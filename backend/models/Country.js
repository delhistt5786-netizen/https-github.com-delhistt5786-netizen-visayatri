const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema({
  name:      { type: String, required: true, unique: true, trim: true },
  code:      { type: String, trim: true, uppercase: true, default: '' }, // ISO2, e.g. "IN"
  flag:      { type: String, default: '' }, // emoji
  continent: { type: String, enum: ['middle-east','asia','africa','europe','north-america','south-america','oceania','others'], default: 'others' },
  isActive:  { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Country', countrySchema);
