const router       = require('express').Router();
const Application  = require('../models/Application');
const { protect }  = require('../middleware/auth');
const { buildInvoicePDF } = require('../utils/invoicePdf');

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

module.exports = router;
