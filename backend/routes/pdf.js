const fs           = require('fs');
const archiver     = require('archiver');
const router       = require('express').Router();
const Application  = require('../models/Application');
const VisaRule     = require('../models/VisaRule');
const { protect }  = require('../middleware/auth');
const { buildInvoicePDF } = require('../utils/invoicePdf');
const { buildChecklistPDF } = require('../utils/checklistPdf');

const DOC_LABELS = {
  frontPassport: 'Front-Passport', backPassport: 'Back-Passport', digitalPhoto: 'Photo',
  visaDocument: 'Visa-Document', optional1: 'Additional-Doc-1', optional2: 'Additional-Doc-2',
  optional3: 'Additional-Doc-3', optional4: 'Additional-Doc-4',
};

// ── GET /api/pdf/invoice/:appId ──────────────────────────
router.get('/invoice/:appId', protect, async (req, res) => {
  try {
    const app = await Application.findById(req.params.appId)
      .populate('visaId',  'country flag visaType processingTime')
      .populate('userId',  'name email phone')
      .populate('agentId', 'name agentCode');

    if (!app)
      return res.status(404).json({ success: false, message: 'Application not found.' });

    // Authorization
    const isOwner  = app.userId._id.toString() === req.user._id.toString();
    const isAgent  = app.agentId && app.agentId._id.toString() === req.user._id.toString();
    const isAdmin  = req.user.role === 'admin';
    if (!isOwner && !isAgent && !isAdmin)
      return res.status(403).json({ success: false, message: 'Access denied.' });

    const pdfBuffer = await buildInvoicePDF(app);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=visayatri-${app.applicationId}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    if (!res.headersSent)
      res.status(500).json({ success: false, message: err.message });
  }
});

/* ── GET /api/pdf/pack/:appId ──────────────────────────────
   Master Application Pack (section 24-25): a ZIP containing every
   original uploaded document (renamed VY-<AppID>-<DocType>.<ext>),
   an Application Summary PDF, and a Document Checklist PDF. Original
   files are never modified, only copied under clearer names. */
router.get('/pack/:appId', protect, async (req, res) => {
  try {
    const app = await Application.findById(req.params.appId)
      .populate('visaId',  'country flag visaType processingTime slug')
      .populate('userId',  'name email phone')
      .populate('agentId', 'name agentCode');

    if (!app)
      return res.status(404).json({ success: false, message: 'Application not found.' });

    const isOwner = app.userId._id.toString() === req.user._id.toString();
    const isAgent = app.agentId && app.agentId._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAgent && !isAdmin)
      return res.status(403).json({ success: false, message: 'Access denied.' });

    let requiredDocs = [];
    if (app.visaId?.slug) {
      const rule = await VisaRule.findOne({ countrySlug: app.visaId.slug, status: 'ACTIVE' });
      requiredDocs = rule?.requiredDocuments || [];
    }

    const [summaryPdf, checklistPdf] = await Promise.all([
      buildInvoicePDF(app),
      buildChecklistPDF(app, requiredDocs),
    ]);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=VY-${app.applicationId}-Documents.zip`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', err => { if (!res.headersSent) res.status(500).json({ success: false, message: err.message }); });
    archive.pipe(res);

    archive.append(summaryPdf, { name: `VY-${app.applicationId}-Application-Summary.pdf` });
    archive.append(checklistPdf, { name: `VY-${app.applicationId}-Checklist.pdf` });

    for (const d of app.documents || []) {
      if (!fs.existsSync(d.path)) continue; // skip silently if a file was removed from disk
      const ext = (d.originalName.split('.').pop() || 'dat').toLowerCase();
      const label = DOC_LABELS[d.docType] || d.docType;
      archive.file(d.path, { name: `VY-${app.applicationId}-${label}.${ext}` });
    }

    await archive.finalize();
  } catch (err) {
    if (!res.headersSent)
      res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
