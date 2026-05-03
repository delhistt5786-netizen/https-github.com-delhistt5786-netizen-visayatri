const router      = require('express').Router();
const User        = require('../models/User');
const Application = require('../models/Application');
const Transaction = require('../models/Transaction');
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
router.post('/wallet/topup-request', protect, authorize('agent'), agentApproved, (req, res) => {
  const { amount } = req.body;
  if (!amount || Number(amount) <= 0)
    return res.status(400).json({ success: false, message: 'Enter a positive amount.' });
  const link = wa.walletTopUpMessage(req.user.name, req.user.agentCode, amount);
  res.json({ success: true, whatsappLink: link });
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
