const mongoose = require('mongoose');

/**
 * DocumentVaultItem — a user's reusable documents (Phase 9, section 23).
 * Kept separate from Application.documents (which are per-application
 * snapshots submitted with a specific application) so a user can upload
 * a passport once and reference it across future applications without
 * re-uploading — the apply flow itself is not wired to this yet, this is
 * storage + management only.
 */
const documentVaultItemSchema = new mongoose.Schema({
  owner:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  documentType:     {
    type: String,
    enum: ['passport', 'photo', 'bank_statement', 'itr', 'employment_letter',
           'business_registration', 'invitation_letter', 'insurance',
           'hotel_booking', 'flight_itinerary', 'other'],
    required: true,
  },
  originalName:     { type: String, required: true },
  storedName:       { type: String, required: true },
  path:             { type: String, required: true },
  mimetype:         { type: String, required: true },
  size:             { type: Number, required: true },
  expiryDate:       { type: Date }, // e.g. passport expiry — used to warn against reusing an expired document
  verificationStatus: { type: String, enum: ['unverified', 'verified', 'flagged'], default: 'unverified' },
  version:          { type: Number, default: 1 },
}, { timestamps: true });

module.exports = mongoose.model('DocumentVaultItem', documentVaultItemSchema);
