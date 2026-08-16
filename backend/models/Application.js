const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  docType:      { type: String, default: 'document' }, // passport, photo, ticket…
  originalName: { type: String },
  storedName:   { type: String },
  path:         { type: String },
  mimetype:     { type: String },
  size:         { type: Number },
  uploadedAt:   { type: Date, default: Date.now },
}, { _id: false });

const applicationSchema = new mongoose.Schema({
  // ── Identifiers ─────────────────────────────────────
  applicationId:  { type: String, unique: true },    // human-readable VYT12345678
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  agentId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  visaId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Visa', required: true },

  // ── Applicant details ────────────────────────────────
  applicantName:   { type: String, required: true },
  applicantEmail:  { type: String, required: true },
  applicantPhone:  { type: String, required: true },
  passportNumber:  { type: String, default: '' },
  passportExpiry:  { type: Date },
  nationality:     { type: String, default: '' },
  dateOfBirth:     { type: Date },
  travelDate:      { type: Date },
  returnDate:      { type: Date },
  purposeOfVisit:  { type: String, default: 'Tourism' },

  // ── Extra applicant details (employment, sponsor, emergency, etc.) ─
  employmentStatus:       { type: String, default: '' },
  companyName:             { type: String, default: '' },
  jobTitle:                { type: String, default: '' },
  monthlyIncome:            { type: Number, default: 0 },
  sponsorName:              { type: String, default: '' },
  sponsorContact:           { type: String, default: '' },
  hotelName:                { type: String, default: '' },
  maritalStatus:            { type: String, default: '' },
  emergencyContactName:     { type: String, default: '' },
  emergencyContactPhone:    { type: String, default: '' },
  previousVisaRejection:    { type: String, default: 'No' },
  extra:                    { type: mongoose.Schema.Types.Mixed, default: {} }, // catch-all for remaining apply-form fields

  // ── Selected plan (snapshot of price at time of apply) ─
  planLabel:       { type: String },
  pricePaid:       { type: Number, default: 0 },  // what this applicant paid
  agentCost:       { type: Number, default: 0 },  // what agent's wallet was debited
  publicPrice:     { type: Number, default: 0 },  // reference public price
  serviceFee:      { type: Number, default: 0 },  // service fee added
  agentProfit:     { type: Number, default: 0 },  // publicPrice - agentCost (if agent)

  // ── Status ───────────────────────────────────────────
  status: {
    type: String,
    enum: ['pending','documents_received','in_review','processing','sent_to_immigration','approved','rejected','delivered'],
    default: 'pending',
  },
  statusHistory: [{
    status:    { type: String },
    note:      { type: String, default: '' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now },
  }],
  rejectionReason: { type: String, default: '' },

  // ── Documents ─────────────────────────────────────────
  documents: [documentSchema],

  // ── Additional documents admin has asked the applicant for ─
  docsRequested: [{
    items:       [{ type: String }],           // e.g. ['Bank statement', 'Hotel booking']
    note:        { type: String, default: '' },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    requestedAt: { type: Date, default: Date.now },
    fulfilled:   { type: Boolean, default: false },
  }],

  // ── Payment ───────────────────────────────────────────
  paymentMethod:  { type: String, enum: ['razorpay','wallet','whatsapp','free'], default: 'whatsapp' },
  paymentStatus:  { type: String, enum: ['pending','paid','refunded','waived'], default: 'pending' },
  razorpayOrderId:   { type: String },
  razorpayPaymentId: { type: String },
  amountPaid:        { type: Number, default: 0 },
  transactionId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },

  // ── Commission ─────────────────────────────────────────
  commissionAmount: { type: Number, default: 0 },
  commissionPaid:   { type: Boolean, default: false },

  // ── WhatsApp ──────────────────────────────────────────
  whatsappMsgSent: { type: Boolean, default: false },
  notes:           { type: String, default: '' },
  adminNotes:      { type: String, default: '' },
}, { timestamps: true });

applicationSchema.pre('save', function(next) {
  if (!this.applicationId) {
    this.applicationId = 'VYT' + Date.now().toString().slice(-8);
  }
  next();
});

module.exports = mongoose.model('Application', applicationSchema);
