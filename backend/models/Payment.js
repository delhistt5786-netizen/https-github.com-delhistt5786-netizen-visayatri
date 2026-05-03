const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  applicationId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  userId:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  razorpayOrderId:   { type: String, unique: true },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  amount:            { type: Number, required: true },
  currency:          { type: String, default: 'INR' },
  status:            { type: String, enum: ['created','paid','failed','refunded'], default: 'created' },
  method:            { type: String, default: '' },  // card, upi, netbanking…
  notes:             { type: Object, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
