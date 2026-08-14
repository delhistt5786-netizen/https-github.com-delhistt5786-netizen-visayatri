const fs          = require('fs');
const crypto      = require('crypto');
const jwt         = require('jsonwebtoken');
const router      = require('express').Router();
const Application = require('../models/Application');
const Visa        = require('../models/Visa');
const User        = require('../models/User');
const Settings    = require('../models/Settings');
const { protect, optionalAuth, authorize } = require('../middleware/auth');
const { handleUpload }       = require('../middleware/upload');
const { checkFaceCoverage }  = require('../middleware/faceCheck');
const { debitWallet, creditWallet } = require('../utils/wallet');
const wa = require('../utils/whatsapp');
const { mailVisaDocumentReady, mailDocumentsRequested } = require('../utils/mailer');

const PHOTO_DOC_TYPES = new Set(['photo', 'digitalPhoto']);

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

/* ─────────────────────────────────────────────────────────
   POST /api/applications  — create
   B2C (individual) applicants do NOT need to be logged in — a lightweight
   account is created/reused behind the scenes from their email so they can
   still track the application afterwards. B2B (agents) must be logged in,
   since agent pricing/wallet/commission all depend on a real agent account.
───────────────────────────────────────────────────────── */
router.post('/', optionalAuth, async (req, res) => {
  try {
    const {
      visaId, planLabel,
      applicantName, applicantEmail, applicantPhone,
      passportNumber, passportExpiry, nationality,
      dateOfBirth, travelDate, returnDate, purposeOfVisit,
      paymentMethod,
      employmentStatus, companyName, jobTitle, monthlyIncome,
      sponsorName, sponsorContact, hotelName, maritalStatus,
      emergencyContactName, emergencyContactPhone, previousVisaRejection,
      extra,
    } = req.body;

    if (!visaId || !planLabel || !applicantName || !applicantEmail || !applicantPhone)
      return res.status(400).json({ success: false, message: 'visaId, planLabel, applicantName, applicantEmail and applicantPhone are required.' });

    const visa = await Visa.findById(visaId);
    if (!visa || !visa.isActive)
      return res.status(404).json({ success: false, message: 'Visa not found or currently inactive.' });

    const plan = visa.plans.find(p => p.label === planLabel);
    if (!plan && !req.body.isContactUs)
      return res.status(400).json({ success: false, message: `Plan "${planLabel}" not found for this visa.` });

    /* Guest / B2C checkout — no login required. Find-or-create a lightweight
       account from the applicant's email so the application (and later
       document uploads) still has an owner, and so they can track it. */
    let user = req.user;
    let issuedToken = null;
    if (!user) {
      user = await User.findOne({ email: applicantEmail.toLowerCase().trim() });
      if (!user) {
        user = await User.create({
          name:     applicantName,
          email:    applicantEmail,
          phone:    applicantPhone,
          password: crypto.randomBytes(24).toString('hex'), // unusable random password — applicant can set one via "forgot password" later
          role:     'user',
        });
      }
      issuedToken = signToken(user._id);
    }

    const role        = user.role;
    const isAgent     = role === 'agent';
    const isContactUs = plan?.isContactUs;

    // B2B (agents) must be logged in — optionalAuth won't have created a guest
    // account for them since only the missing-user branch above does that, but
    // guard explicitly in case a request claims agent pricing without a token.
    if (isAgent && !req.user)
      return res.status(401).json({ success: false, message: 'Please log in to your agent account to apply.' });

    if (isAgent && !user.isApproved)
      return res.status(403).json({ success: false, message: 'Your agent account is pending admin approval.' });

    /* Price resolution */
    let pricePaid   = 0;
    let agentCost   = 0;
    let publicPrice = plan?.publicPrice || 0;
    let serviceFee  = 0;

    if (isAgent) {
      agentCost = plan?.agentPrice || 0;
      pricePaid = agentCost;
    } else {
      pricePaid   = plan?.publicPrice || 0;
      agentCost   = plan?.basePrice   || 0;
    }

    // B2C service fee — added at payment time, agents (B2B) are exempt since
    // their margin is already built into agentPrice.
    const settings = await Settings.findOne();
    if (!isAgent && settings && settings.serviceFeeEnabled) {
      serviceFee = settings.serviceFee || 0;
      pricePaid += serviceFee;
    }

    const agentProfit       = isAgent ? (publicPrice - agentCost) : 0;
    const commissionAmount  = (isAgent && user.commissionRate > 0 && agentCost > 0)
      ? Math.round(agentCost * user.commissionRate / 100)
      : 0;

    /* Wallet debit for agents choosing wallet payment */
    const pm = paymentMethod || 'whatsapp';
    let walletDebited = false;
    if (isAgent && pm === 'wallet' && agentCost > 0) {
      await debitWallet(
        user._id, agentCost, 'visa_payment',
        `Visa: ${visa.country} — ${planLabel}`,
      );
      walletDebited = true;
    }

    const app = await Application.create({
      userId:   user._id,
      agentId:  isAgent ? user._id : undefined,
      visaId,
      applicantName, applicantEmail, applicantPhone,
      passportNumber: passportNumber || '',
      passportExpiry: passportExpiry || undefined,
      nationality:    nationality    || '',
      dateOfBirth:    dateOfBirth    || undefined,
      travelDate:     travelDate     || undefined,
      returnDate:     returnDate     || undefined,
      purposeOfVisit: purposeOfVisit || 'Tourism',
      employmentStatus:       employmentStatus       || '',
      companyName:            companyName            || '',
      jobTitle:               jobTitle               || '',
      monthlyIncome:          monthlyIncome           || 0,
      sponsorName:            sponsorName            || '',
      sponsorContact:         sponsorContact         || '',
      hotelName:              hotelName              || '',
      maritalStatus:          maritalStatus          || '',
      emergencyContactName:   emergencyContactName   || '',
      emergencyContactPhone:  emergencyContactPhone  || '',
      previousVisaRejection:  previousVisaRejection  || 'No',
      extra:                  extra || {},
      planLabel,
      pricePaid,
      agentCost,
      publicPrice,
      serviceFee,
      agentProfit,
      commissionAmount,
      paymentMethod:  pm,
      paymentStatus:  walletDebited ? 'paid' : 'pending',
      amountPaid:     walletDebited ? agentCost : 0,
      statusHistory:  [{ status: 'pending', note: 'Application submitted', updatedBy: user._id }],
    });

    await app.populate('visaId', 'country flag slug');

    /* Build contextual WhatsApp link */
    let whatsappLink;
    const travelDateStr = travelDate ? new Date(travelDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : 'N/A';

    if (isAgent) {
      whatsappLink = wa.agentApplyMessage({
        visaCountry:   visa.country,
        planLabel,
        agentPrice:    agentCost,
        publicPrice,
        agentName:     user.name,
        agentCode:     user.agentCode,
        clientName:    applicantName,
        clientPhone:   applicantPhone,
        travelDate,
        passportNumber,
        nationality,
        purposeOfVisit,
      });
    } else {
      whatsappLink = wa.applyMessage({
        visaCountry:   visa.country,
        planLabel,
        price:         pricePaid,
        userName:      user.name,
        email:         applicantEmail,
        phone:         applicantPhone,
        travelDate,
        returnDate,
        passportNumber,
        nationality,
        purposeOfVisit,
      });
    }

    res.status(201).json({
      success: true,
      data: app,
      whatsappLink,
      // Present only for guest (B2C, no-login) checkout — lets the frontend
      // silently sign the applicant into their auto-created account so they
      // can upload documents next and track the application afterwards.
      ...(issuedToken ? {
        token: issuedToken,
        user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role },
      } : {}),
    });
  } catch (err) {
    if (err.message?.startsWith('Insufficient'))
      return res.status(400).json({ success: false, message: err.message });
    console.error('[app-create]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ─────────────────────────────────────────────────────────
   GET /api/applications/my
───────────────────────────────────────────────────────── */
router.get('/my', protect, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = req.user.role === 'agent'
      ? { agentId: req.user._id }
      : { userId:  req.user._id };
    if (status) filter.status = status;

    const [apps, total] = await Promise.all([
      Application.find(filter)
        .populate('visaId', 'country flag slug visaType processingTime')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Application.countDocuments(filter),
    ]);
    res.json({ success: true, data: apps, total, page: Number(page) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

/* ─────────────────────────────────────────────────────────
   GET /api/applications/my/avatar
   Returns the applicant's most recently uploaded digital photo (already
   passed the face-coverage guard at upload time) to use as a profile avatar.
───────────────────────────────────────────────────────── */
router.get('/my/avatar', protect, async (req, res) => {
  try {
    const app = await Application.findOne({ userId: req.user._id, 'documents.docType': 'digitalPhoto' })
      .sort('-createdAt')
      .select('documents');

    const photoDoc = app?.documents?.find(d => d.docType === 'digitalPhoto');
    if (!photoDoc) return res.json({ success: true, avatarUrl: null });

    res.json({ success: true, avatarUrl: `/uploads/${app._id}/${photoDoc.storedName}` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

/* ─────────────────────────────────────────────────────────
   GET /api/applications/:id
───────────────────────────────────────────────────────── */
router.get('/:id', protect, async (req, res) => {
  try {
    const app = await Application.findById(req.params.id)
      .populate('visaId')
      .populate('userId',  'name email phone')
      .populate('agentId', 'name agentCode');

    if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

    const isOwner = app.userId._id.toString() === req.user._id.toString();
    const isAgent = req.user.role === 'agent' && app.agentId?._id?.toString() === req.user._id.toString();
    if (!isOwner && !isAgent && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Access denied.' });

    const trackLink = wa.trackMessage(app.applicationId, app.applicantName);
    res.json({ success: true, data: app, trackLink });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

/* ─────────────────────────────────────────────────────────
   POST /api/applications/:id/documents
───────────────────────────────────────────────────────── */
router.post('/:id/documents', protect, handleUpload('documents', 10), async (req, res) => {
  try {
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

    if (req.user.role === 'user' && app.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Access denied.' });

    const docTypes  = req.body.docTypes ? JSON.parse(req.body.docTypes) : [];
    const files     = req.files || [];

    // Server-side guard: any photo-type upload must contain a face in a plausible
    // frame coverage. Check each file independently — a bad photo must not take
    // down otherwise-valid documents (e.g. front/back passport) uploaded in the
    // same batch.
    const newDocs  = [];
    const rejected = [];
    for (let i = 0; i < files.length; i++) {
      const docType = docTypes[i] || 'document';
      const file = files[i];

      if (PHOTO_DOC_TYPES.has(docType) && file.mimetype !== 'application/pdf') {
        const result = await checkFaceCoverage(file.path);
        if (!result.ok) {
          fs.unlink(file.path, () => {});
          rejected.push({ docType, message: result.message });
          continue;
        }
      }

      newDocs.push({
        docType,
        originalName: file.originalname,
        storedName:   file.filename,
        path:         file.path,
        mimetype:     file.mimetype,
        size:         file.size,
      });
    }

    if (!newDocs.length) {
      return res.status(422).json({
        success: false,
        message: rejected[0]?.message || 'No valid files received.',
        rejected,
      });
    }

    app.documents.push(...newDocs);
    if (app.status === 'pending') {
      app.status = 'documents_received';
      app.statusHistory.push({
        status: 'documents_received',
        note:   `${newDocs.length} document(s) uploaded`,
        updatedBy: req.user._id,
      });
    }
    await app.save();

    const message = rejected.length
      ? `${newDocs.length} file(s) uploaded — ${rejected.length} rejected: ${rejected.map(r => r.message).join(' ')}`
      : `${newDocs.length} file(s) uploaded successfully.`;
    res.json({ success: true, data: app, uploaded: newDocs.length, rejected, message });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

/* ─────────────────────────────────────────────────────────
   PUT /api/applications/:id/status  — admin / agent
───────────────────────────────────────────────────────── */
router.put('/:id/status', protect, authorize('admin', 'agent'), async (req, res) => {
  try {
    const { status, note, rejectionReason, adminNotes } = req.body;
    const VALID = ['pending','documents_received','in_review','processing','sent_to_immigration','approved','rejected','delivered'];
    if (!VALID.includes(status))
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${VALID.join(', ')}` });

    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

    if (req.user.role === 'agent' && app.agentId?.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Access denied.' });

    const oldStatus = app.status;
    app.status = status;
    app.statusHistory.push({ status, note: note || '', updatedBy: req.user._id });
    if (rejectionReason) app.rejectionReason = rejectionReason;
    if (adminNotes)      app.adminNotes      = adminNotes;

    /* Commission credit on first approval */
    if (status === 'approved' && oldStatus !== 'approved') {
      if (app.agentId && !app.commissionPaid && app.commissionAmount > 0) {
        await creditWallet(
          app.agentId, app.commissionAmount, 'commission',
          `Commission: ${app.applicationId} — ${app.planLabel}`,
          { applicationId: app._id, createdBy: req.user._id },
        );
        app.commissionPaid = true;
        await User.findByIdAndUpdate(app.agentId, { $inc: { totalCommission: app.commissionAmount } });
      }
    }

    await app.save();
    res.json({ success: true, data: app, message: `Status updated to "${status}"` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

/* ─────────────────────────────────────────────────────────
   PUT /api/applications/:id  — admin edit fields
───────────────────────────────────────────────────────── */
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const EDITABLE = [
      'applicantName','applicantEmail','applicantPhone',
      'passportNumber','passportExpiry','nationality',
      'dateOfBirth','travelDate','returnDate','purposeOfVisit',
      'planLabel','pricePaid','adminNotes','notes',
      'employmentStatus','companyName','jobTitle','monthlyIncome',
      'sponsorName','sponsorContact','hotelName','maritalStatus',
      'emergencyContactName','emergencyContactPhone','previousVisaRejection','extra',
    ];
    const updates = {};
    EDITABLE.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const app = await Application.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .populate('visaId','country flag')
      .populate('userId','name email');
    if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

    res.json({ success: true, data: app, message: 'Application updated.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

/* ─────────────────────────────────────────────────────────
   POST /api/applications/:id/visa-document  — admin uploads the
   final approved visa file. Marks the application delivered and
   notifies the applicant by email (best-effort) + returns a WhatsApp
   deep link so the admin can also ping them directly.
───────────────────────────────────────────────────────── */
router.post('/:id/visa-document', protect, authorize('admin'), handleUpload('visaDocument', 1), async (req, res) => {
  try {
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

    const file = (req.files || [])[0];
    if (!file) return res.status(400).json({ success: false, message: 'No file received.' });

    app.documents.push({
      docType:      'visaDocument',
      originalName: file.originalname,
      storedName:   file.filename,
      path:         file.path,
      mimetype:     file.mimetype,
      size:         file.size,
    });
    app.status = 'delivered';
    app.statusHistory.push({ status: 'delivered', note: 'Visa document dispatched', updatedBy: req.user._id });
    await app.save();

    const emailResult = await mailVisaDocumentReady(app);
    const whatsappLink = wa.visaDispatchedMessage(app.applicationId, app.applicantName, app.applicantPhone);

    res.json({
      success: true, data: app, whatsappLink,
      message: `Visa dispatched to ${app.applicantName}${emailResult.sent ? ' — email sent' : ' (email not configured, use WhatsApp)'}`,
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

/* ─────────────────────────────────────────────────────────
   POST /api/applications/:id/request-documents  — admin asks
   the applicant for more documents. Notifies by email
   (best-effort) + returns a WhatsApp deep link.
───────────────────────────────────────────────────────── */
router.post('/:id/request-documents', protect, authorize('admin'), async (req, res) => {
  try {
    const { items, note } = req.body;
    if (!Array.isArray(items) || items.length === 0 || items.some(i => !i.trim()))
      return res.status(400).json({ success: false, message: 'Provide at least one document name.' });

    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

    app.docsRequested.push({ items, note: note || '', requestedBy: req.user._id });
    app.statusHistory.push({ status: app.status, note: `Requested documents: ${items.join(', ')}`, updatedBy: req.user._id });
    await app.save();

    const emailResult = await mailDocumentsRequested(app, items, note);
    const whatsappLink = wa.docsRequestedMessage(app.applicationId, app.applicantName, app.applicantPhone, items, note);

    res.json({
      success: true, data: app, whatsappLink,
      message: `Document request sent to ${app.applicantName}${emailResult.sent ? ' — email sent' : ' (email not configured, use WhatsApp)'}`,
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

/* ─────────────────────────────────────────────────────────
   GET /api/applications  — admin all
───────────────────────────────────────────────────────── */
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, agentId, visaId, page = 1, limit = 25, search } = req.query;
    const filter = {};
    if (status)  filter.status  = status;
    if (agentId) filter.agentId = agentId;
    if (visaId)  filter.visaId  = visaId;
    if (search) {
      filter.$or = [
        { applicantName:  new RegExp(search, 'i') },
        { applicantEmail: new RegExp(search, 'i') },
        { applicationId:  new RegExp(search, 'i') },
        { applicantPhone: new RegExp(search, 'i') },
      ];
    }
    const [apps, total] = await Promise.all([
      Application.find(filter)
        .populate('visaId',  'country flag slug')
        .populate('userId',  'name email phone')
        .populate('agentId', 'name agentCode')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Application.countDocuments(filter),
    ]);
    res.json({ success: true, data: apps, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
