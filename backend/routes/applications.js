const router      = require('express').Router();
const Application = require('../models/Application');
const Visa        = require('../models/Visa');
const User        = require('../models/User');
const Settings    = require('../models/Settings');
const { protect, authorize } = require('../middleware/auth');
const { handleUpload }       = require('../middleware/upload');
const { debitWallet, creditWallet } = require('../utils/wallet');
const wa = require('../utils/whatsapp');

/* ─────────────────────────────────────────────────────────
   POST /api/applications  — create
───────────────────────────────────────────────────────── */
router.post('/', protect, async (req, res) => {
  try {
    const {
      visaId, planLabel,
      applicantName, applicantEmail, applicantPhone,
      passportNumber, passportExpiry, nationality,
      dateOfBirth, travelDate, returnDate, purposeOfVisit,
      paymentMethod,
    } = req.body;

    if (!visaId || !planLabel || !applicantName || !applicantEmail || !applicantPhone)
      return res.status(400).json({ success: false, message: 'visaId, planLabel, applicantName, applicantEmail and applicantPhone are required.' });

    const visa = await Visa.findById(visaId);
    if (!visa || !visa.isActive)
      return res.status(404).json({ success: false, message: 'Visa not found or currently inactive.' });

    const plan = visa.plans.find(p => p.label === planLabel);
    if (!plan && !req.body.isContactUs)
      return res.status(400).json({ success: false, message: `Plan "${planLabel}" not found for this visa.` });

    const role        = req.user.role;
    const isAgent     = role === 'agent';
    const isContactUs = plan?.isContactUs;

    if (isAgent && !req.user.isApproved)
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

    // Add service fee if enabled
    const settings = await Settings.findOne();
    if (settings && settings.serviceFeeEnabled) {
      serviceFee = settings.serviceFee || 0;
      pricePaid += serviceFee;
    }

    const agentProfit       = isAgent ? (publicPrice - agentCost) : 0;
    const commissionAmount  = (isAgent && req.user.commissionRate > 0 && agentCost > 0)
      ? Math.round(agentCost * req.user.commissionRate / 100)
      : 0;

    /* Wallet debit for agents choosing wallet payment */
    const pm = paymentMethod || 'whatsapp';
    let walletDebited = false;
    if (isAgent && pm === 'wallet' && agentCost > 0) {
      await debitWallet(
        req.user._id, agentCost, 'visa_payment',
        `Visa: ${visa.country} — ${planLabel}`,
      );
      walletDebited = true;
    }

    const app = await Application.create({
      userId:   req.user._id,
      agentId:  isAgent ? req.user._id : undefined,
      visaId,
      applicantName, applicantEmail, applicantPhone,
      passportNumber: passportNumber || '',
      passportExpiry: passportExpiry || undefined,
      nationality:    nationality    || '',
      dateOfBirth:    dateOfBirth    || undefined,
      travelDate:     travelDate     || undefined,
      returnDate:     returnDate     || undefined,
      purposeOfVisit: purposeOfVisit || 'Tourism',
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
      statusHistory:  [{ status: 'pending', note: 'Application submitted', updatedBy: req.user._id }],
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
        agentName:     req.user.name,
        agentCode:     req.user.agentCode,
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
        userName:      req.user.name,
        email:         applicantEmail,
        phone:         applicantPhone,
        travelDate,
        returnDate,
        passportNumber,
        nationality,
        purposeOfVisit,
      });
    }

    res.status(201).json({ success: true, data: app, whatsappLink });
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
    const newDocs   = (req.files || []).map((f, i) => ({
      docType:      docTypes[i] || 'document',
      originalName: f.originalname,
      storedName:   f.filename,
      path:         f.path,
      mimetype:     f.mimetype,
      size:         f.size,
    }));

    if (!newDocs.length)
      return res.status(400).json({ success: false, message: 'No valid files received.' });

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
    res.json({ success: true, data: app, uploaded: newDocs.length, message: `${newDocs.length} file(s) uploaded successfully.` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

/* ─────────────────────────────────────────────────────────
   PUT /api/applications/:id/status  — admin / agent
───────────────────────────────────────────────────────── */
router.put('/:id/status', protect, authorize('admin', 'agent'), async (req, res) => {
  try {
    const { status, note, rejectionReason, adminNotes } = req.body;
    const VALID = ['pending','documents_received','in_review','processing','approved','rejected','delivered'];
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
