const router   = require('express').Router();
const Settings = require('../models/Settings');

// ── GET /api/settings ───────────────────────────────────
router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }
    res.json({ success: true, data: settings });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;