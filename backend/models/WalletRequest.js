const mongoose = require('mongoose');

/**
 * Agent-initiated wallet top-up request, reviewed by admin.
 * Approving auto-credits the agent's wallet via the wallet util (keeps the
 * Transaction ledger consistent); rejecting just records the decision.
 */
const walletRequestSchema = new mongoose.Schema({
  agentId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  amount:      { type: Number, required: true },
  status:      { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  note:        { type: String, default: '' },
  reviewedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt:  { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('WalletRequest', walletRequestSchema);
