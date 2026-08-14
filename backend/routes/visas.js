const router = require('express').Router();
const Visa   = require('../models/Visa');
const { optionalAuth } = require('../middleware/auth');

// ── GET /api/visas ───────────────────────────────────────
// Public; authenticated users get role-appropriate prices
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { region, search, active } = req.query;
    const filter = {};
    if (active !== 'false') filter.isActive = true;
    if (region)             filter.region   = region;
    if (search)             filter.country  = new RegExp(search, 'i');

    const visas = await Visa.find(filter).sort('country');
    const role  = req.user?.role || 'public';

    const data = visas.map(v => v.forRole(role));
    res.json({ success: true, count: data.length, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── GET /api/visas/:slug ─────────────────────────────────
router.get('/:slug', optionalAuth, async (req, res) => {
  try {
    const visa = await Visa.findOne({ slug: req.params.slug, isActive: true });
    if (!visa) return res.status(404).json({ success: false, message: 'Visa not found.' });

    const role = req.user?.role || 'public';
    res.json({ success: true, data: visa.forRole(role) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Admin visa CRUD lives in routes/admin.js (mounted at /api/admin/visas) —
// this file only serves the public read endpoints above.

module.exports = router;
