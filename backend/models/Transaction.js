const mongoose = require('mongoose');

/**
 * Wallet transaction ledger for agents.
 * Every credit (top-up, commission) and debit (visa cost) is recorded.
 */
const transactionSchema = new mongoose.Schema({
  agentId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type:          { type: String, enum: ['credit', 'debit'], required: true },
  category:      {
    type: String,
    enum: ['top_up', 'visa_payment', 'commission', 'refund', 'admin_adjustment'],
    required: true,
  },
  amount:        { type: Number, required: true },          // always positive
  balanceBefore: { type: Number, required: true },
  balanceAfter:  { type: Number, required: true },
  description:   { type: String, default: '' },
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
  razorpayId:    { type: String, default: '' },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // admin who credited
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
