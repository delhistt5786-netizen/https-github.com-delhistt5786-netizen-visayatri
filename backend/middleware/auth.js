const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Attach authenticated user to req.user
 */
exports.protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authenticated. Please log in.' });
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ success: false, message: 'User no longer exists.' });
    if (!user.isActive) return res.status(403).json({ success: false, message: 'Account has been disabled.' });
    req.user = user;
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'Session expired. Please log in again.' : 'Invalid token.';
    res.status(401).json({ success: false, message: msg });
  }
};

/**
 * Restrict to specific roles
 */
exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Requires role: ${roles.join(' or ')}.`,
    });
  }
  next();
};

/**
 * Agent must be approved by admin
 */
exports.agentApproved = (req, res, next) => {
  if (req.user.role === 'agent' && !req.user.isApproved) {
    return res.status(403).json({
      success: false,
      message: 'Your agent account is pending admin approval.',
      code: 'AGENT_PENDING',
    });
  }
  next();
};

/**
 * Optional auth — attach user if token present, otherwise continue
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
      const token = header.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (user && user.isActive) req.user = user;
    }
  } catch { /* ignore */ }
  next();
};
