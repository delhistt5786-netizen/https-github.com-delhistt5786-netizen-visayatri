const router        = require('express').Router();
const User          = require('../models/User');
const Application   = require('../models/Application');
const Transaction   = require('../models/Transaction');
const WalletRequest = require('../models/WalletRequest');
const { protect, authorize, agentApproved } = require('../middleware/auth');
const { creditWallet } = require('../utils/wallet');
const wa = require('../utils/whatsapp');

/* ── GET /api/agents/dashboard ──────────────────────────── */
router.get('/dashboard', protect, authorize('agent'), async (req, res) => {
  try {
    const agent = await User.findById(req.user._id).select('-password');

    if (!agent.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Agent account pending approval.',
        code: 'AGENT_PENDING',
        whatsappLink: wa.generalMessage(),
      });
    }

    const [apps, txns] = await Promise.all([
      Application.find({ agentId: req.user._id })
        .populate('visaId', 'country flag slug')
        .sort('-createdAt').limit(50),
      Transaction.find({ agentId: req.user._id }).sort('-createdAt').limit(20),
    ]);

    /* Per-visa profitability breakdown */
    const profitByVisa = {};
    apps.forEach(a => {
      const key = a.visaId?.country || 'Unknown';
      if (!profitByVisa[key]) profitByVisa[key] = { country: key, flag: a.visaId?.flag || '🌍', count: 0, totalCost: 0, totalProfit: 0, approved: 0 };
      profitByVisa[key].count++;
      profitByVisa[key].totalCost   += a.agentCost   || 0;
      profitByVisa[key].totalProfit += a.agentProfit  || 0;
      if (a.status === 'approved') profitByVisa[key].approved++;
    });

    const stats = {
      walletBalance:   agent.walletBalance,
      totalTopUp:      agent.totalTopUp,
      totalSpent:      agent.totalSpent,
      totalCommission: agent.totalCommission,
      commissionRate:  agent.commissionRate,
      agentCode:       agent.agentCode,
      companyName:     agent.companyName,
      total:           apps.length,
      pending:         apps.filter(a => a.status === 'pending').length,
      inReview:        apps.filter(a => ['in_review','processing'].includes(a.status)).length,
      approved:        apps.filter(a => a.status === 'approved').length,
      rejected:        apps.filter(a => a.status === 'rejected').length,
      totalPaid:       apps.filter(a => a.paymentStatus === 'paid').reduce((s, a) => s + (a.agentCost || 0), 0),
      totalPotentialProfit: apps.reduce((s, a) => s + (a.agentProfit || 0), 0),
    };

    res.json({
      success: true,
      stats,
      applications: apps,
      transactions: txns,
      profitBreakdown: Object.values(profitByVisa).sort((a,b) => b.count - a.count),
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

/* ── GET /api/agents/leaderboard ─────────────────────────
   Top agents by lifetime commission earned. Names are shown as
   "First L." (except the requesting agent's own row, and referral
   attribution) so agents can't scrape each other's full identity. */
router.get('/leaderboard', protect, authorize('agent'), async (req, res) => {
  try {
    const top = await User.find({ role: 'agent', isApproved: true, totalCommission: { $gt: 0 } })
      .sort('-totalCommission')
      .limit(10)
      .select('name companyName totalCommission agentCode');

    const rows = top.map((a, i) => ({
      rank: i + 1,
      isYou: a._id.toString() === req.user._id.toString(),
      name: a._id.toString() === req.user._id.toString()
        ? a.name
        : `${a.name.split(' ')[0]} ${a.name.split(' ')[1]?.[0] || ''}.`.trim(),
      companyName: a.companyName,
      totalCommission: a.totalCommission,
    }));

    const inTop10 = rows.some(r => r.isYou);
    let yourRank = null;
    if (!inTop10) {
      const higherCount = await User.countDocuments({
        role: 'agent', isApproved: true,
        totalCommission: { $gt: req.user.totalCommission || 0 },
      });
      yourRank = higherCount + 1;
    }

    res.json({ success: true, data: { top: rows, yourRank, yourCommission: req.user.totalCommission || 0 } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

/* ── GET /api/agents/wallet ─────────────────────────────── */
router.get('/wallet', protect, authorize('agent'), agentApproved, async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const [agent, txns, total] = await Promise.all([
      User.findById(req.user._id).select('walletBalance totalTopUp totalSpent totalCommission commissionRate'),
      Transaction.find({ agentId: req.user._id }).sort('-createdAt').skip((page-1)*limit).limit(Number(limit)),
      Transaction.countDocuments({ agentId: req.user._id }),
    ]);
    const topUpLink = wa.walletTopUpMessage(req.user.name, req.user.agentCode, '');
    res.json({ success: true, wallet: agent, transactions: txns, total, topUpLink });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

/* ── POST /api/agents/wallet/topup-request ──────────────── */
/* Creates a trackable pending request AND returns a WhatsApp link so the   */
/* agent can still ping admin directly if they want a faster turnaround.   */
router.post('/wallet/topup-request', protect, authorize('agent'), agentApproved, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || Number(amount) <= 0)
      return res.status(400).json({ success: false, message: 'Enter a positive amount.' });

    const request = await WalletRequest.create({ agentId: req.user._id, amount: Number(amount) });
    const link = wa.walletTopUpMessage(req.user.name, req.user.agentCode, amount);
    res.json({ success: true, whatsappLink: link, request });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

/* ── GET /api/agents/wallet/requests  — agent's own ─────── */
router.get('/wallet/requests', protect, authorize('agent'), agentApproved, async (req, res) => {
  try {
    const requests = await WalletRequest.find({ agentId: req.user._id }).sort('-createdAt').limit(30);
    res.json({ success: true, data: requests });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

/* ── GET /api/agents/wallet-requests  — admin, all agents ── */
router.get('/wallet-requests', protect, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const requests = await WalletRequest.find(filter)
      .populate('agentId', 'name agentCode email walletBalance')
      .sort('-createdAt').limit(100);
    res.json({ success: true, data: requests });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

/* ── PUT /api/agents/wallet-requests/:id/approve  — admin ── */
router.put('/wallet-requests/:id/approve', protect, authorize('admin'), async (req, res) => {
  try {
    const request = await WalletRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });
    if (request.status !== 'pending')
      return res.status(400).json({ success: false, message: `Request already ${request.status}.` });

    const { agent, transaction } = await creditWallet(
      request.agentId, request.amount, 'top_up',
      `Top-up request approved by ${req.user.name}`,
      { createdBy: req.user._id },
    );

    request.status     = 'approved';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    res.json({ success: true, message: `₹${request.amount.toLocaleString('en-IN')} credited to ${agent.name}`, request, walletBalance: agent.walletBalance, transaction });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

/* ── PUT /api/agents/wallet-requests/:id/reject  — admin ─── */
router.put('/wallet-requests/:id/reject', protect, authorize('admin'), async (req, res) => {
  try {
    const request = await WalletRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });
    if (request.status !== 'pending')
      return res.status(400).json({ success: false, message: `Request already ${request.status}.` });

    request.status     = 'rejected';
    request.note       = req.body.note || '';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    res.json({ success: true, message: 'Request rejected.', request });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

/* ── POST /api/agents/wallet/credit  — admin ────────────── */
router.post('/wallet/credit', protect, authorize('admin'), async (req, res) => {
  try {
    const { agentId, amount, description } = req.body;
    if (!agentId || !amount || Number(amount) <= 0)
      return res.status(400).json({ success: false, message: 'agentId and positive amount are required.' });

    const agent = await User.findOne({ _id: agentId, role: 'agent' });
    if (!agent) return res.status(404).json({ success: false, message: 'Agent not found.' });

    const { transaction } = await creditWallet(
      agentId, Number(amount), 'top_up',
      description || `Admin top-up by ${req.user.name}`,
      { createdBy: req.user._id },
    );

    const updated = await User.findById(agentId).select('-password');
    res.json({
      success:       true,
      message:       `₹${Number(amount).toLocaleString('en-IN')} credited to ${updated.name}`,
      walletBalance: updated.walletBalance,
      agent:         updated,
      transaction,
    });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

/* ── POST /api/agents  — admin creates agent directly ──── */
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, phone, companyName, city, commissionRate } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });

    if (await User.findOne({ email }))
      return res.status(409).json({ success: false, message: 'Email already registered.' });

    const agent = await User.create({
      name, email, password, phone: phone || '',
      role: 'agent',
      agentCode: 'AGT' + Date.now().toString().slice(-6),
      isApproved: true,
      companyName: companyName || '',
      city: city || '',
      commissionRate: commissionRate !== undefined ? Number(commissionRate) : 10,
    });

    res.status(201).json({ success: true, data: agent.toSafeObject(), message: `Agent ${agent.name} created and approved.` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

/* ── GET /api/agents/list  — admin ─────────────────────── */
router.get('/list', protect, authorize('admin'), async (req, res) => {
  try {
    const { approved, search, page = 1, limit = 50 } = req.query;
    const filter = { role: 'agent' };
    if (approved !== undefined) filter.isApproved = approved === 'true';
    if (search) filter.$or = [{ name: new RegExp(search,'i') }, { email: new RegExp(search,'i') }, { agentCode: new RegExp(search,'i') }];

    const [agents, total] = await Promise.all([
      User.find(filter).select('-password').sort('-createdAt').skip((page-1)*limit).limit(Number(limit)),
      User.countDocuments(filter),
    ]);
    res.json({ success: true, data: agents, total });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

/* ── PUT /api/agents/:id/approve  — admin ─────────────── */
router.put('/:id/approve', protect, authorize('admin'), async (req, res) => {
  try {
    const { isApproved } = req.body;
    const agent = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'agent' },
      { isApproved },
      { new: true },
    ).select('-password');
    if (!agent) return res.status(404).json({ success: false, message: 'Agent not found.' });
    res.json({ success: true, data: agent, message: `Agent ${isApproved ? 'approved ✓' : 'suspended'}.` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

/* ── PUT /api/agents/:id  — admin edit agent ────────────── */
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { commissionRate, isApproved, isActive, companyName, city, gstNumber } = req.body;
    const updates = {};
    if (commissionRate !== undefined) {
      if (commissionRate < 0 || commissionRate > 100)
        return res.status(400).json({ success: false, message: 'Commission must be 0–100.' });
      updates.commissionRate = commissionRate;
    }
    if (isApproved  !== undefined) updates.isApproved  = isApproved;
    if (isActive    !== undefined) updates.isActive     = isActive;
    if (companyName !== undefined) updates.companyName  = companyName;
    if (city        !== undefined) updates.city         = city;
    if (gstNumber   !== undefined) updates.gstNumber    = gstNumber;

    const agent = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!agent) return res.status(404).json({ success: false, message: 'Agent not found.' });
    res.json({ success: true, data: agent, message: 'Agent updated.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

/* ── GET /api/agents/:id/transactions  — admin ─────────── */
router.get('/:id/transactions', protect, authorize('admin'), async (req, res) => {
  try {
    const txns = await Transaction.find({ agentId: req.params.id }).sort('-createdAt').limit(100);
    res.json({ success: true, data: txns });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
