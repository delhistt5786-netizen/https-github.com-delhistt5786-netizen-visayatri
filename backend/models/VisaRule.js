const mongoose = require('mongoose');

/**
 * VisaRule — official, sourced, versioned visa rules per country/product.
 *
 * This is a SEPARATE, additive layer from the existing `Visa` model (which
 * drives the live purchase flow and must not change). VisaRule exists to
 * show verified official information (fees, validity, documents, source)
 * without touching checkout/payment/application logic until a human has
 * reviewed and approved a rule (see `verificationStatus`).
 *
 * Never overwrite a rule in place when the underlying government rule
 * changes — create a new version instead, so applications that already
 * captured a `ruleSnapshot` are unaffected by later edits.
 */
const documentRequirementSchema = new mongoose.Schema({
  documentName:         { type: String, required: true },
  required:             { type: Boolean, default: true },
  critical:             { type: Boolean, default: false },
  conditional:          { type: Boolean, default: false },
  condition:            { type: String, default: '' }, // e.g. "if travelling for business"
  acceptedFormats:      [{ type: String }],             // e.g. ['pdf', 'jpg']
  maxSizeMb:            { type: Number },
  validityRequirement:  { type: String, default: '' },  // e.g. "passport valid 6+ months"
  officialReason:       { type: String, default: '' },
}, { _id: false });

const sourceSchema = new mongoose.Schema({
  sourceUrl:      { type: String, required: true },
  sourceTitle:    { type: String, required: true },
  sourceType:     {
    type: String,
    enum: ['immigration_department', 'government_visa_portal', 'ministry_of_foreign_affairs', 'embassy_consulate', 'tourism_authority'],
    required: true,
  },
  lastVerifiedAt: { type: Date, required: true },
  verifiedBy:     { type: String, default: '' },
}, { _id: false });

const visaRuleSchema = new mongoose.Schema({
  country:            { type: String, required: true, index: true }, // e.g. "Oman"
  countrySlug:        { type: String, required: true, index: true }, // e.g. "oman"
  productSlug:        { type: String, required: true },              // e.g. "oman-10-day"

  officialVisaName:   { type: String, required: true }, // e.g. "10-Day Tourist eVisa"
  officialVisaCode:   { type: String, default: '' },
  visaCategory:       {
    type: String,
    enum: ['tourist', 'business', 'medical', 'student', 'family_visit', 'conference_event',
           'employment', 'transit', 'long_stay', 'other'],
    default: 'tourist',
  },
  travelDocumentType: {
    // Distinguishes an actual visa from an eTA / arrival declaration / VOA per section 7
    type: String,
    enum: ['evisa', 'eta', 'travel_authorization', 'arrival_card', 'travel_declaration',
           'visa_on_arrival', 'visa_free', 'consular_visa'],
    default: 'evisa',
  },
  onlineEVisaAvailable: { type: Boolean, default: true },
  separateProcessOffline: { type: Boolean, default: false },

  entryType:   { type: String, enum: ['single', 'double', 'multiple'], required: true },
  numberOfEntries: { type: Number }, // for multiple-entry, if a fixed cap applies

  validityPeriod: {
    value: { type: Number, required: true },
    unit:  { type: String, enum: ['days', 'months', 'years'], required: true },
  },
  maximumStay: {
    value: { type: Number, required: true },
    unit:  { type: String, enum: ['days', 'months', 'years'], required: true },
  },
  extensionAvailable: { type: Boolean, default: false },
  extensionNote:       { type: String, default: '' },

  processingTime: { type: String, default: '' }, // human-readable, e.g. "2-3 business days"

  // ── Fees — government fee kept strictly separate from VisaYatri's own price ──
  governmentFee: {
    amount:   { type: Number },
    currency: { type: String },
    status:   { type: String, enum: ['VERIFIED', 'VERIFICATION_REQUIRED'], default: 'VERIFICATION_REQUIRED' },
  },
  visaYatriServiceFee: { type: Number, default: 0 },   // INR
  totalCustomerPriceInr: { type: Number },              // INR, informational only until wired to checkout

  eligibility: { type: String, default: '' },
  passportRequirements: { type: String, default: '' },
  photoRequirements:    { type: String, default: '' },

  requiredDocuments: [documentRequirementSchema],

  source: { type: sourceSchema, required: true },

  ruleVersion:   { type: String, required: true }, // e.g. "2026.08"
  effectiveFrom: { type: Date, default: Date.now },
  status:        { type: String, enum: ['ACTIVE', 'SUPERSEDED', 'DRAFT'], default: 'DRAFT' },

  verificationStatus: {
    // A rule only becomes customer-facing once a human has reviewed it —
    // never auto-promote research output to ACTIVE.
    type: String,
    enum: ['OFFICIAL_VERIFICATION_REQUIRED', 'HUMAN_REVIEWED'],
    default: 'OFFICIAL_VERIFICATION_REQUIRED',
  },

  disclaimer: {
    type: String,
    default: 'Visa approval is solely at the discretion of the relevant government/immigration authority. Visayatri assists with application preparation and submission support but does not control the visa decision.',
  },
}, { timestamps: true });

visaRuleSchema.index({ countrySlug: 1, productSlug: 1, ruleVersion: 1 }, { unique: true });

module.exports = mongoose.model('VisaRule', visaRuleSchema);
