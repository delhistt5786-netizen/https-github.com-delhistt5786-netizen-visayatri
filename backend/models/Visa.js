const mongoose = require('mongoose');

/**
 * Triple-tier pricing per plan:
 *   basePrice   → admin cost / what we pay (internal only)
 *   agentPrice  → approved agent sees this (discounted)
 *   publicPrice → public / B2C customers see this (higher)
 *
 * Profit margin = publicPrice - basePrice
 * Agent profit  = publicPrice - agentPrice (if agent marks up to client)
 */
const planSchema = new mongoose.Schema({
  label:       { type: String, required: true },   // "30 Days", "1 Year Multi"
  basePrice:   { type: Number, required: true, default: 0 }, // internal cost
  agentPrice:  { type: Number, required: true, default: 0 }, // agent-facing
  publicPrice: { type: Number, required: true, default: 0 }, // B2C public
  isContactUs: { type: Boolean, default: false },  // show "Contact Us" if true
}, { _id: false });

const visaSchema = new mongoose.Schema({
  country:     { type: String, required: true, trim: true },
  slug:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  flag:        { type: String, default: '' },
  region:      { type: String, enum: ['middle-east','asia','africa','europe','others'], required: true },
  plans:       [planSchema],
  isRiskFree:  { type: Boolean, default: false },
  isActive:    { type: Boolean, default: true },

  // Details
  processingTime: { type: String, default: '3-5 business days' },
  visaType:       { type: String, default: 'E-Visa' },
  description:    { type: String, default: '' },
  requirements:   [{ type: String }],
  faqs: [{
    question: { type: String },
    answer:   { type: String },
  }],
}, { timestamps: true });

// Virtual: return plans with only the price appropriate to the caller
// Used in routes to strip basePrice from non-admin responses
visaSchema.methods.forRole = function(role) {
  const obj = this.toObject();
  obj.plans = obj.plans.map(p => {
    const plan = { label: p.label, isContactUs: p.isContactUs };
    if (role === 'admin') {
      plan.basePrice   = p.basePrice;
      plan.agentPrice  = p.agentPrice;
      plan.publicPrice = p.publicPrice;
      plan.margin      = p.publicPrice - p.basePrice;
    } else if (role === 'agent') {
      plan.price       = p.agentPrice;   // agent pays this
      plan.publicPrice = p.publicPrice;  // agent can see markup potential
      plan.profit      = p.publicPrice - p.agentPrice;
    } else {
      plan.price       = p.publicPrice;  // public sees this only
    }
    return plan;
  });
  return obj;
};

module.exports = mongoose.model('Visa', visaSchema);
