const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User   = require('../models/User');
const { protect } = require('../middleware/auth');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const sendAuth = (res, status, user, token) =>
  res.status(status).json({
    success: true,
    token,
    user: {
      id:            user._id,
      name:          user.name,
      email:         user.email,
      phone:         user.phone,
      role:          user.role,
      isApproved:    user.isApproved,
      agentCode:     user.agentCode,
      walletBalance: user.walletBalance,
    },
  });

// ── POST /api/auth/register ──────────────────────────────
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
  body('role').optional().isIn(['user','agent']).withMessage('Role must be user or agent'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });

  try {
    const { name, email, password, phone, role, companyName, city } = req.body;

    if (await User.findOne({ email }))
      return res.status(409).json({ success: false, message: 'Email already registered. Please login.' });

    const userData = { name, email, password, phone: phone || '', role: role || 'user' };

    if (role === 'agent') {
      userData.agentCode   = 'AGT' + Date.now().toString().slice(-6);
      userData.isApproved  = false;
      userData.companyName = companyName || '';
      userData.city        = city || '';
    }

    const user  = await User.create(userData);
    const token = signToken(user._id);
    sendAuth(res, 201, user, token);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/auth/login ─────────────────────────────────
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, message: errors.array()[0].msg });

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    if (!user.isActive)
      return res.status(403).json({ success: false, message: 'Account disabled. Contact support.' });

    const token = signToken(user._id);
    sendAuth(res, 200, user, token);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/auth/me ─────────────────────────────────────
router.get('/me', protect, (req, res) =>
  res.json({ success: true, user: req.user })
);

// ── PUT /api/auth/profile ────────────────────────────────
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, companyName, city, gstNumber } = req.body;
    const updates = { name, phone };
    if (req.user.role === 'agent') Object.assign(updates, { companyName, city, gstNumber });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/auth/change-password ────────────────────────
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'New password min 6 chars' });

    const user = await User.findById(req.user._id);
    if (!(await user.comparePassword(currentPassword)))
      return res.status(401).json({ success: false, message: 'Current password incorrect.' });

    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
