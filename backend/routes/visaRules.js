const router   = require('express').Router();
const VisaRule = require('../models/VisaRule');

/* ── GET /api/visa-rules/:countrySlug ─────────────────────
   Public. Returns only HUMAN_REVIEWED, ACTIVE rules — research output
   that hasn't been signed off never reaches customers. */
router.get('/:countrySlug', async (req, res) => {
  try {
    const rules = await VisaRule.find({
      countrySlug: req.params.countrySlug,
      status: 'ACTIVE',
      verificationStatus: 'HUMAN_REVIEWED',
    }).sort('officialVisaName');
    res.json({ success: true, data: rules });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

/* ── GET /api/visa-rules/admin/:countrySlug ────────────────
   Returns ALL rules regardless of verification status, for the admin
   review workspace (Phase 13). Auth added when that workspace is built;
   left unauthenticated is not acceptable, so route is intentionally
   omitted from server.js for now until that guard is in place. */

module.exports = router;
