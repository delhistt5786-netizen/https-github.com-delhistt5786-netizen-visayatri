const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  serviceFee: {
    type: Number,
    default: 599,
    min: 0
  },
  serviceFeeLabel: {
    type: String,
    default: 'Processing Fee'
  },
  serviceFeeEnabled: {
    type: Boolean,
    default: true
  },
  // When off, status-update notifications only go by email — the WhatsApp
  // deep link is not generated, so the admin UI has nothing to pop open.
  whatsappNotificationsEnabled: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
settingsSchema.pre('save', async function(next) {
  if (this.isNew) {
    const existing = await this.constructor.findOne();
    if (existing) {
      throw new Error('Only one settings document can exist');
    }
  }
  next();
});

module.exports = mongoose.model('Settings', settingsSchema);