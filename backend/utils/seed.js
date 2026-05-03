require('dotenv').config();
const mongoose = require('mongoose');
const Visa = require('../models/Visa');
const User = require('../models/User');
const Settings = require('../models/Settings');

/**
 * Triple-tier price helper
 * basePrice   = our internal cost / what we actually pay
 * agentPrice  = base + 8%  (agent profit margin when they resell)
 * publicPrice = base + 20% (B2C customer-facing price)
 */
const tiers = (base, contactUs = false) => {
  if (contactUs || base === 0) return [{ label: null, basePrice: 0, agentPrice: 0, publicPrice: 0, isContactUs: true }];
  return {
    basePrice:   base,
    agentPrice:  Math.ceil(base * 1.08 / 100) * 100,   // round up to nearest ₹100
    publicPrice: Math.ceil(base * 1.20 / 100) * 100,
  };
};

const plan = (label, base, contactUs = false) => {
  if (contactUs || base === 0) return { label, basePrice: 0, agentPrice: 0, publicPrice: 0, isContactUs: true };
  const t = tiers(base);
  return { label, ...t };
};

const visaData = [
  // ── MIDDLE EAST ──────────────────────────────────────────────────────────
  {
    country: 'Oman', slug: 'oman', flag: '🇴🇲', region: 'middle-east', isRiskFree: true,
    plans: [
      plan('10 Days',        1850),
      plan('30 Days',        5400),
      plan('90 Days Male',  20800),
      plan('90 Days Female',21300),
    ],
    processingTime: '2-3 business days', visaType: 'E-Visa',
    requirements: ['Valid passport (6+ months)', 'White background photo', 'Return ticket', 'Hotel booking'],
    faqs: [
      { question: 'Is Oman Risk Free?', answer: 'Yes — Oman E-Visa has a very high approval rate and is considered risk-free.' },
      { question: 'How long does approval take?', answer: 'Typically 2-3 business days.' },
    ],
  },
  {
    country: 'Qatar', slug: 'qatar', flag: '🇶🇦', region: 'middle-east',
    plans: [ plan('30 Days', 1000) ],
    processingTime: '1-2 business days', visaType: 'E-Visa',
    requirements: ['Valid passport', 'White background photo', 'Return ticket'],
  },
  {
    country: 'Bahrain', slug: 'bahrain', flag: '🇧🇭', region: 'middle-east', isRiskFree: true,
    plans: [
      plan('14 Days',       3200),
      plan('3 Month Multi', 4950),
      plan('1 Year Multi', 11400),
    ],
    processingTime: '2-4 business days', visaType: 'E-Visa',
    requirements: ['Valid passport', 'White background photo', 'Bank statement (3 months)', 'Return ticket'],
    faqs: [{ question: 'What is a Multi Entry visa?', answer: 'You can enter Bahrain multiple times within the validity period.' }],
  },
  {
    country: 'Saudi Arabia', slug: 'saudi-arabia', flag: '🇸🇦', region: 'middle-east', isRiskFree: true,
    plans: [ plan('90 Days (KL Passport)', 0, true) ],
    processingTime: 'Contact us for timeline', visaType: 'E-Visa',
    requirements: ['KL Passport required', 'White background photo', 'Valid passport'],
  },
  {
    country: 'Jordan', slug: 'jordan', flag: '🇯🇴', region: 'middle-east',
    plans: [ plan('E-Visa', 5800) ],
    processingTime: '3-5 business days', visaType: 'E-Visa',
    requirements: ['Valid passport', 'White background photo', 'Hotel booking', 'Return ticket'],
  },
  // ── ASIA ─────────────────────────────────────────────────────────────────
  {
    country: 'Singapore', slug: 'singapore', flag: '🇸🇬', region: 'asia', isRiskFree: true,
    plans: [ plan('30 Days', 0, true) ],
    processingTime: 'Contact us', visaType: 'E-Visa',
    requirements: ['Valid passport', 'White background photo'],
  },
  {
    country: 'India', slug: 'india', flag: '🇮🇳', region: 'asia',
    plans: [
      plan('30 Days',      3500),
      plan('1 Year Multi', 4900),
      plan('5 Year Multi', 8500),
    ],
    processingTime: '3-5 business days', visaType: 'E-Visa',
    requirements: ['Valid passport', 'White background photo', 'Travel itinerary'],
  },
  {
    country: 'Russia', slug: 'russia', flag: '🇷🇺', region: 'asia',
    plans: [ plan('E-Visa', 5500) ],
    processingTime: '4-6 business days', visaType: 'E-Visa',
    requirements: ['Valid passport (18+ months)', 'White background photo', 'Hotel booking'],
  },
  {
    country: 'Vietnam', slug: 'vietnam', flag: '🇻🇳', region: 'asia',
    plans: [ plan('E-Visa', 3200) ],
    processingTime: '2-3 business days', visaType: 'E-Visa',
    requirements: ['Valid passport', 'White background photo'],
  },
  {
    country: 'Indonesia', slug: 'indonesia', flag: '🇮🇩', region: 'asia',
    plans: [ plan('E-Visa', 4000) ],
    processingTime: '3-5 business days', visaType: 'E-Visa',
    requirements: ['Valid passport', 'White background photo', 'Return ticket'],
  },
  {
    country: 'Cambodia', slug: 'cambodia', flag: '🇰🇭', region: 'asia',
    plans: [ plan('E-Visa', 4400) ],
    processingTime: '2-3 business days', visaType: 'E-Visa',
    requirements: ['Valid passport', 'White background photo'],
  },
  {
    country: 'Malaysia', slug: 'malaysia', flag: '🇲🇾', region: 'asia',
    plans: [ plan('South', 10800) ],
    processingTime: '5-7 business days', visaType: 'E-Visa',
    requirements: ['Valid passport', 'White background photo', 'Bank statement'],
  },
  {
    country: 'Thailand', slug: 'thailand', flag: '🇹🇭', region: 'asia',
    plans: [ plan('TDAC', 0, true), plan('Thailand 6 Visa', 0, true) ],
    processingTime: 'Contact us', visaType: 'E-Visa',
    requirements: ['Valid passport', 'White background photo'],
  },
  {
    country: 'Laos', slug: 'laos', flag: '🇱🇦', region: 'others',
    plans: [ plan('E-Visa', 5700) ],
    processingTime: '3-5 business days', visaType: 'E-Visa',
    requirements: ['Valid passport', 'White background photo'],
  },
  {
    country: 'Armenia', slug: 'armenia', flag: '🇦🇲', region: 'others',
    plans: [
      plan('21 Days',          2000),
      plan('21 Days Sureshot', 25000),
    ],
    processingTime: '3-7 business days', visaType: 'E-Visa',
    requirements: ['Valid passport', 'White background photo'],
    faqs: [{ question: 'What is Sureshot?', answer: 'Sureshot guarantees visa approval through an expedited premium channel.' }],
  },
  {
    country: 'Uzbekistan', slug: 'uzbekistan', flag: '🇺🇿', region: 'asia',
    plans: [ plan('E-Visa', 3900) ],
    processingTime: '3-5 business days', visaType: 'E-Visa',
    requirements: ['Valid passport', 'White background photo'],
  },
  {
    country: 'Tajikistan', slug: 'tajikistan', flag: '🇹🇯', region: 'asia',
    plans: [ plan('E-Visa', 5550) ],
    processingTime: '5-7 business days', visaType: 'E-Visa',
    requirements: ['Valid passport', 'White background photo'],
  },
  {
    country: 'Kyrgyzstan', slug: 'kyrgyzstan', flag: '🇰🇬', region: 'asia',
    plans: [ plan('E-Visa', 10500) ],
    processingTime: '5-7 business days', visaType: 'E-Visa',
    requirements: ['Valid passport', 'White background photo'],
  },
  {
    country: 'Sri Lanka', slug: 'sri-lanka', flag: '🇱🇰', region: 'asia',
    plans: [ plan('E-Visa', 700) ],
    processingTime: '1-2 business days', visaType: 'E-Visa',
    requirements: ['Valid passport', 'White background photo'],
  },
  {
    country: 'Mongolia', slug: 'mongolia', flag: '🇲🇳', region: 'asia',
    plans: [ plan('E-Visa', 2700) ],
    processingTime: '3-5 business days', visaType: 'E-Visa',
    requirements: ['Valid passport', 'White background photo'],
  },
  {
    country: 'Japan', slug: 'japan', flag: '🇯🇵', region: 'asia',
    plans: [ plan('E-Visa', 5500) ],
    processingTime: '5-7 business days', visaType: 'E-Visa',
    requirements: ['Valid passport (6+ months)', 'White background photo', 'Bank statement (3 months)', 'ITR / Salary slip'],
  },
  {
    country: 'Hong Kong', slug: 'hong-kong', flag: '🇭🇰', region: 'asia',
    plans: [ plan('E-Visa', 1200) ],
    processingTime: '3-5 business days', visaType: 'E-Visa',
    requirements: ['Valid passport', 'White background photo'],
  },
  // ── AFRICA ───────────────────────────────────────────────────────────────
  {
    country: 'Egypt', slug: 'egypt', flag: '🇪🇬', region: 'africa',
    plans: [
      plan('Single Entry', 4200),
      plan('Multi Entry',  6200),
    ],
    processingTime: '3-5 business days', visaType: 'E-Visa',
    requirements: ['Valid passport', 'White background photo', 'Return ticket', 'Hotel booking'],
  },
  {
    country: 'Morocco', slug: 'morocco', flag: '🇲🇦', region: 'africa',
    plans: [ plan('E-Visa', 8700) ],
    processingTime: '5-7 business days', visaType: 'E-Visa',
    requirements: ['Valid passport', 'White background photo', 'Bank statement'],
  },
  {
    country: 'Ethiopia', slug: 'ethiopia', flag: '🇪🇹', region: 'africa',
    plans: [ plan('E-Visa', 6900) ],
    processingTime: '3-5 business days', visaType: 'E-Visa',
    requirements: ['Valid passport', 'White background photo'],
  },
  {
    country: 'Uganda', slug: 'uganda', flag: '🇺🇬', region: 'africa',
    plans: [ plan('E-Visa', 5900) ],
    processingTime: '3-5 business days', visaType: 'E-Visa',
    requirements: ['Valid passport', 'White background photo'],
  },
  {
    country: 'Zimbabwe', slug: 'zimbabwe', flag: '🇿🇼', region: 'africa',
    plans: [ plan('E-Visa', 4400) ],
    processingTime: '3-5 business days', visaType: 'E-Visa',
    requirements: ['Valid passport', 'White background photo'],
  },
  {
    country: 'Kenya', slug: 'kenya', flag: '🇰🇪', region: 'africa',
    plans: [ plan('E-Visa', 4900) ],
    processingTime: '3-5 business days', visaType: 'E-Visa',
    requirements: ['Valid passport', 'White background photo', 'Return ticket'],
  },
  {
    country: 'Tanzania', slug: 'tanzania', flag: '🇹🇿', region: 'africa',
    plans: [ plan('E-Visa', 6500) ],
    processingTime: '5-7 business days', visaType: 'E-Visa',
    requirements: ['Valid passport', 'White background photo'],
  },
  {
    country: 'South Africa', slug: 'south-africa', flag: '🇿🇦', region: 'africa',
    plans: [ plan('E-Visa', 6700) ],
    processingTime: '7-10 business days', visaType: 'E-Visa',
    requirements: ['Valid passport (30+ days after travel)', 'White background photo', 'Bank statement', 'Proof of accommodation'],
  },
  {
    country: 'Zambia', slug: 'zambia', flag: '🇿🇲', region: 'africa',
    plans: [ plan('E-Visa', 5000) ],
    processingTime: '3-5 business days', visaType: 'E-Visa',
    requirements: ['Valid passport', 'White background photo'],
  },
  {
    country: 'Madagascar', slug: 'madagascar', flag: '🇲🇬', region: 'africa',
    plans: [ plan('15 Days', 4000) ],
    processingTime: '3-5 business days', visaType: 'E-Visa',
    requirements: ['Valid passport', 'White background photo'],
  },
  // ── EUROPE ───────────────────────────────────────────────────────────────
  {
    country: 'Azerbaijan', slug: 'azerbaijan', flag: '🇦🇿', region: 'europe',
    plans: [
      plan('Normal',  3000),
      plan('Express', 6500),
    ],
    processingTime: '3-7 business days', visaType: 'E-Visa',
    requirements: ['Valid passport', 'White background photo'],
    faqs: [{ question: 'What is Express?', answer: 'Express processing in 1-2 business days instead of 3-7.' }],
  },
  {
    country: 'Ukraine', slug: 'ukraine', flag: '🇺🇦', region: 'europe',
    plans: [ plan('E-Visa', 4500) ],
    processingTime: '5-7 business days', visaType: 'E-Visa',
    requirements: ['Valid passport', 'White background photo'],
  },
  // ── OTHERS ───────────────────────────────────────────────────────────────
  {
    country: 'Papua New Guinea', slug: 'papua-new-guinea', flag: '🇵🇬', region: 'others',
    plans: [ plan('E-Visa', 8800) ],
    processingTime: '5-7 business days', visaType: 'E-Visa',
    requirements: ['Valid passport', 'White background photo'],
  },
  {
    country: 'Argentina', slug: 'argentina', flag: '🇦🇷', region: 'others',
    plans: [ plan('E-Visa', 2900) ],
    processingTime: '3-5 business days', visaType: 'E-Visa',
    requirements: ['Valid passport', 'White background photo'],
  },
  {
    country: 'Cuba', slug: 'cuba', flag: '🇨🇺', region: 'others',
    plans: [ plan('E-Visa', 25000) ],
    processingTime: '7-10 business days', visaType: 'E-Visa',
    requirements: ['Valid passport', 'White background photo', 'Travel insurance', 'Return ticket'],
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // Visas
  await Visa.deleteMany({});
  const inserted = await Visa.insertMany(visaData);
  console.log(`✅ Seeded ${inserted.length} visas with triple-tier pricing`);

  // Admin
  await User.deleteMany({ role: 'admin' });
  await User.create({ name: 'Admin', email: 'admin@visayatri.com', password: 'Admin@123', role: 'admin' });
  console.log('✅ Admin: admin@visayatri.com / Admin@123');

  // Demo agent (approved)
  await User.deleteOne({ email: 'agent@visayatri.com' });
  await User.create({
    name: 'Demo Agent', email: 'agent@visayatri.com', password: 'Agent@123',
    role: 'agent', agentCode: 'AGT999001', isApproved: true,
    walletBalance: 10000, commissionRate: 10,
  });
  console.log('✅ Agent:  agent@visayatri.com / Agent@123  (wallet: ₹10,000)');

  // Demo user
  await User.deleteOne({ email: 'user@visayatri.com' });
  await User.create({ name: 'Demo User', email: 'user@visayatri.com', password: 'User@123', role: 'user' });
  console.log('✅ User:   user@visayatri.com / User@123');

  // Settings
  await Settings.deleteMany({});
  await Settings.create({
    serviceFee: 599,
    serviceFeeLabel: 'Processing Fee',
    serviceFeeEnabled: true,
  });
  console.log('✅ Settings: Service fee ₹599 enabled');

  console.log('\n🚀 Seed complete!\n');
  process.exit(0);
}

seed().catch(err => { console.error('❌ Seed failed:', err.message); process.exit(1); });
