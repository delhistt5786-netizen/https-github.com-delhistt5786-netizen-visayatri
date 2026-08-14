const router      = require('express').Router();
const User        = require('../models/User');
const Application = require('../models/Application');
const Visa        = require('../models/Visa');
const Country     = require('../models/Country');
const Transaction = require('../models/Transaction');
const Settings    = require('../models/Settings');
const { protect, authorize } = require('../middleware/auth');

// ── GET /api/admin/stats ─────────────────────────────────
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const [
      totalUsers, totalAgents, totalApplications, totalVisas,
      statusAgg, revenueAgg, monthlyAgg, pendingAgents
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'agent' }),
      Application.countDocuments(),
      Visa.countDocuments({ isActive: true }),

      // Status breakdown
      Application.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),

      // Revenue from paid applications
      Application.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amountPaid' }, count: { $sum: 1 } } }
      ]),

      // Monthly application trend (last 6 months)
      Application.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) } } },
        { $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
          revenue: { $sum: '$amountPaid' },
        }},
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),

      User.countDocuments({ role: 'agent', isApproved: false }),
    ]);

    const statusMap = {};
    statusAgg.forEach(s => { statusMap[s._id] = s.count; });

    res.json({
      success: true,
      stats: {
        totalUsers, totalAgents, totalApplications, totalVisas,
        pendingAgents,
        revenue:    revenueAgg[0]?.total   || 0,
        paidApps:   revenueAgg[0]?.count   || 0,
        statusBreakdown: statusMap,
        monthlyTrend: monthlyAgg,
      },
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── GET /api/admin/dashboard ─────────────────────────────
// Full dashboard: stats + recent apps + recent agents
router.get('/dashboard', protect, authorize('admin'), async (req, res) => {
  try {
    const [statsRes, recentApps, recentAgents, topVisas] = await Promise.all([
      // Reuse stats inline
      Promise.all([
        User.countDocuments({ role: 'user' }),
        User.countDocuments({ role: 'agent' }),
        Application.countDocuments(),
        Visa.countDocuments({ isActive: true }),
        Application.aggregate([{ $match: { paymentStatus:'paid' } }, { $group:{ _id:null, total:{ $sum:'$amountPaid' }}}]),
        Application.countDocuments({ status: 'pending' }),
      ]),
      Application.find().populate('visaId','country flag').populate('userId','name email')
        .sort('-createdAt').limit(8),
      User.find({ role:'agent' }).select('-password').sort('-createdAt').limit(5),
      Application.aggregate([
        { $group: { _id: '$visaId', count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 5 },
        { $lookup: { from: 'visas', localField: '_id', foreignField: '_id', as: 'visa' } },
        { $unwind: '$visa' },
        { $project: { country: '$visa.country', flag: '$visa.flag', count: 1 } },
      ]),
    ]);

    const [totalUsers, totalAgents, totalApplications, totalVisas, revArr, pendingApps] = statsRes;

    res.json({
      success: true,
      stats: {
        totalUsers, totalAgents, totalApplications, totalVisas,
        revenue: revArr[0]?.total || 0, pendingApps,
      },
      recentApps,
      recentAgents,
      topVisas,
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── GET /api/admin/users ─────────────────────────────────
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const { role, search, page = 1, limit = 30 } = req.query;
    const filter = {};
    if (role)   filter.role = role;
    if (search) filter.$or = [{ name: new RegExp(search,'i') }, { email: new RegExp(search,'i') }];

    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort('-createdAt')
        .skip((page-1)*limit).limit(Number(limit)),
      User.countDocuments(filter),
    ]);
    res.json({ success: true, data: users, total });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── PUT /api/admin/users/:id/toggle ─────────────────────
router.put('/users/:id/toggle', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.role === 'admin')
      return res.status(400).json({ success: false, message: 'Cannot disable admin.' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'blocked'}.`, isActive: user.isActive });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── GET /api/admin/transactions ──────────────────────────
router.get('/transactions', protect, authorize('admin'), async (req, res) => {
  try {
    const { agentId, type, page = 1, limit = 30 } = req.query;
    const filter = {};
    if (agentId) filter.agentId = agentId;
    if (type)    filter.type    = type;
    const txns = await Transaction.find(filter)
      .populate('agentId','name agentCode email')
      .sort('-createdAt').skip((page-1)*limit).limit(Number(limit));
    const total = await Transaction.countDocuments(filter);
    res.json({ success: true, data: txns, total });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ╔══════════════════════════════════════════════════════════════╗
// ║              VISA MANAGEMENT ENDPOINTS                        ║
// ╚══════════════════════════════════════════════════════════════╝

// ── GET /api/admin/visas ─────────────────────────────
// Get all visas with optional filters
router.get('/visas', protect, authorize('admin'), async (req, res) => {
  try {
    const { region, isActive } = req.query;
    const filter = {};
    if (region) filter.region = region;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const visas = await Visa.find(filter).sort({ country: 1 }).populate('countryRef', 'name code flag continent');
    res.json({ success: true, data: visas, total: visas.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/visas/:id ─────────────────────────
// Get specific visa by ID
router.get('/visas/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const visa = await Visa.findById(req.params.id).populate('countryRef', 'name code flag continent');
    if (!visa) {
      return res.status(404).json({ success: false, message: 'Visa not found' });
    }
    res.json({ success: true, data: visa });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/admin/visas ────────────────────────────
// Create new visa
router.post('/visas', protect, authorize('admin'), async (req, res) => {
  try {
    let { country, countryRef, slug, flag, region, plans, description, requirements, faqs, processingTime, visaType } = req.body;

    // If a Country reference was picked from the dropdown, derive the display fields from it
    if (countryRef) {
      const countryDoc = await Country.findById(countryRef);
      if (!countryDoc) return res.status(400).json({ success: false, message: 'Selected country not found.' });
      country = countryDoc.name;
      flag = flag || countryDoc.flag;
    }

    // Validate required fields
    if (!country || !slug || !region) {
      return res.status(400).json({
        success: false,
        message: 'Country, slug, and region are required'
      });
    }

    // Check if slug already exists
    const existing = await Visa.findOne({ slug });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Slug already exists. Use a unique slug.'
      });
    }

    const visa = new Visa({
      country,
      countryRef: countryRef || undefined,
      slug: slug.toLowerCase().trim(),
      flag: flag || '',
      region,
      plans: plans || [],
      description: description || '',
      requirements: requirements || [],
      faqs: faqs || [],
      processingTime: processingTime || '3-5 business days',
      visaType: visaType || 'E-Visa',
      isActive: true
    });

    await visa.save();
    res.status(201).json({ success: true, data: visa, message: 'Visa created successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/admin/visas/:id ─────────────────────────
// Update visa details
router.put('/visas/:id', protect, authorize('admin'), async (req, res) => {
  try {
    let { country, countryRef, slug, flag, region, plans, description, requirements, faqs, processingTime, visaType, isActive } = req.body;

    let visa = await Visa.findById(req.params.id);
    if (!visa) {
      return res.status(404).json({ success: false, message: 'Visa not found' });
    }

    // Check if new slug is unique (if being changed)
    if (slug && slug.toLowerCase() !== visa.slug) {
      const existing = await Visa.findOne({ slug: slug.toLowerCase() });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Slug already exists. Use a unique slug.'
        });
      }
    }

    // If a Country reference was picked from the dropdown, derive the display fields from it
    if (countryRef) {
      const countryDoc = await Country.findById(countryRef);
      if (!countryDoc) return res.status(400).json({ success: false, message: 'Selected country not found.' });
      country = country || countryDoc.name;
      flag = flag || countryDoc.flag;
      visa.countryRef = countryRef;
    }

    // Update fields
    if (country) visa.country = country;
    if (slug) visa.slug = slug.toLowerCase().trim();
    if (flag !== undefined) visa.flag = flag;
    if (region) visa.region = region;
    if (plans) visa.plans = plans;
    if (description !== undefined) visa.description = description;
    if (requirements) visa.requirements = requirements;
    if (faqs) visa.faqs = faqs;
    if (processingTime) visa.processingTime = processingTime;
    if (visaType) visa.visaType = visaType;
    if (isActive !== undefined) visa.isActive = isActive;

    await visa.save();
    res.json({ success: true, data: visa, message: 'Visa updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/admin/visas/:id/toggle ────────────────
// Toggle visa active status
router.patch('/visas/:id/toggle', protect, authorize('admin'), async (req, res) => {
  try {
    let visa = await Visa.findById(req.params.id);
    if (!visa) {
      return res.status(404).json({ success: false, message: 'Visa not found' });
    }

    visa.isActive = !visa.isActive;
    await visa.save();
    
    res.json({ 
      success: true, 
      data: visa, 
      message: `Visa ${visa.isActive ? 'activated' : 'deactivated'} successfully` 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/admin/visas/:id ──────────────────────
// Delete visa
router.delete('/visas/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const visa = await Visa.findByIdAndDelete(req.params.id);
    if (!visa) {
      return res.status(404).json({ success: false, message: 'Visa not found' });
    }

    res.json({ success: true, message: 'Visa deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/settings ─────────────────────────────
router.get('/settings', protect, authorize('admin'), async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }
    res.json({ success: true, data: settings });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── PUT /api/admin/settings ─────────────────────────────
router.put('/settings', protect, authorize('admin'), async (req, res) => {
  try {
    const { serviceFee, serviceFeeLabel, serviceFeeEnabled } = req.body;
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }
    if (serviceFee !== undefined) settings.serviceFee = serviceFee;
    if (serviceFeeLabel !== undefined) settings.serviceFeeLabel = serviceFeeLabel;
    if (serviceFeeEnabled !== undefined) settings.serviceFeeEnabled = serviceFeeEnabled;
    await settings.save();
    res.json({ success: true, data: settings, message: 'Settings updated successfully.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
