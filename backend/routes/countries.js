const router  = require('express').Router();
const Country = require('../models/Country');
const { protect, authorize } = require('../middleware/auth');

// ── GET /api/countries — public, active only ─────────────
router.get('/', async (req, res) => {
  try {
    const countries = await Country.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: countries, total: countries.length });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── POST /api/countries — admin create ───────────────────
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, code, flag, continent } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Country name is required.' });

    const existing = await Country.findOne({ name: new RegExp(`^${name}$`, 'i') });
    if (existing) return res.status(400).json({ success: false, message: 'Country already exists.' });

    const country = await Country.create({ name, code, flag, continent });
    res.status(201).json({ success: true, data: country, message: 'Country created successfully.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── PUT /api/countries/:id — admin update ────────────────
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, code, flag, continent, isActive } = req.body;
    const updates = {};
    if (name !== undefined)      updates.name = name;
    if (code !== undefined)      updates.code = code;
    if (flag !== undefined)      updates.flag = flag;
    if (continent !== undefined) updates.continent = continent;
    if (isActive !== undefined)  updates.isActive = isActive;

    const country = await Country.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!country) return res.status(404).json({ success: false, message: 'Country not found.' });
    res.json({ success: true, data: country, message: 'Country updated successfully.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── DELETE /api/countries/:id — admin delete ─────────────
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const country = await Country.findByIdAndDelete(req.params.id);
    if (!country) return res.status(404).json({ success: false, message: 'Country not found.' });
    res.json({ success: true, message: 'Country deleted successfully.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
