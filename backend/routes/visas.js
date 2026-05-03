const router = require('express').Router();
const Visa   = require('../models/Visa');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

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

// ── POST /api/visas — admin create ───────────────────────
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const visa = await Visa.create(req.body);
    res.status(201).json({ success: true, data: visa });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// ── PUT /api/visas/:id — admin update ────────────────────
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const visa = await Visa.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!visa) return res.status(404).json({ success: false, message: 'Visa not found.' });
    res.json({ success: true, data: visa });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// ── DELETE /api/visas/:id — admin soft-delete ────────────
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Visa.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Visa deactivated.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
