const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:    { type: String, default: '' },
  password: { type: String, required: true, minlength: 6 },
  role:     { type: String, enum: ['user', 'agent', 'admin'], default: 'user' },
  isActive: { type: Boolean, default: true },

  // ── Agent-specific fields ──────────────────────────────
  agentCode:       { type: String, unique: true, sparse: true },
  isApproved:      { type: Boolean, default: false },
  walletBalance:   { type: Number, default: 0 },    // current balance
  totalTopUp:      { type: Number, default: 0 },    // total ever credited
  totalSpent:      { type: Number, default: 0 },    // total ever debited
  commissionRate:  { type: Number, default: 10 },   // % commission on approved apps
  totalCommission: { type: Number, default: 0 },    // lifetime commission earned
  companyName:     { type: String, default: '' },
  gstNumber:       { type: String, default: '' },
  city:            { type: String, default: '' },

  // ── Password reset ──────────────────────────────────────
  // Stores a SHA-256 hash of the token, never the raw value that goes out
  // in the email — same reasoning as password hashing, so a DB leak alone
  // can't be used to reset accounts.
  resetPasswordToken:   { type: String, select: false },
  resetPasswordExpires: { type: Date, select: false },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Strip sensitive fields from JSON
userSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
