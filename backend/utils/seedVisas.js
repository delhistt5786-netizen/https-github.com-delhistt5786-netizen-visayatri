/**
 * Seed script to populate Visa collection with countries and pricing
 * Run: node utils/seedVisas.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Visa = require('../models/Visa');
const Country = require('../models/Country');

// Visa data from rate list
const visasData = [
  {
    country: 'Oman',
    slug: 'oman',
    flag: '🇴🇲',
    region: 'middle-east',
    visaType: 'E-Visa',
    processingTime: '1-3 business days',
    isRiskFree: true,
    plans: [
      { label: '10 Days', basePrice: 800, agentPrice: 1200, publicPrice: 1850 },
      { label: '30 Days', basePrice: 2500, agentPrice: 3900, publicPrice: 5400 },
      { label: '90 Days (Male)', basePrice: 12000, agentPrice: 16500, publicPrice: 20800 },
      { label: '90 Days (Female)', basePrice: 12300, agentPrice: 17000, publicPrice: 21300 },
    ]
  },
  {
    country: 'Qatar',
    slug: 'qatar',
    flag: '🇶🇦',
    region: 'middle-east',
    visaType: 'E-Visa',
    processingTime: '2-5 business days',
    plans: [
      { label: '30 Days', basePrice: 500, agentPrice: 750, publicPrice: 1000 },
    ]
  },
  {
    country: 'Bahrain',
    slug: 'bahrain',
    flag: '🇧🇭',
    region: 'middle-east',
    visaType: 'E-Visa',
    processingTime: '1-2 business days',
    isRiskFree: true,
    plans: [
      { label: '14 Days', basePrice: 1800, agentPrice: 2500, publicPrice: 3200 },
      { label: '3 Months Multi', basePrice: 2800, agentPrice: 3900, publicPrice: 4950 },
      { label: '1 Year Multi', basePrice: 6500, agentPrice: 9000, publicPrice: 11400 },
    ]
  },
  {
    country: 'Saudi Arabia',
    slug: 'saudi-arabia',
    flag: '🇸🇦',
    region: 'middle-east',
    visaType: 'E-Visa',
    processingTime: '5-7 business days',
    isRiskFree: true,
    plans: [
      { label: '90 Days (KL Passport)', basePrice: 0, agentPrice: 0, publicPrice: 0, isContactUs: true },
    ]
  },
  {
    country: 'Singapore',
    slug: 'singapore',
    flag: '🇸🇬',
    region: 'asia',
    visaType: 'E-Visa',
    processingTime: '3-5 business days',
    isRiskFree: true,
    plans: [
      { label: '30 Days', basePrice: 0, agentPrice: 0, publicPrice: 0, isContactUs: true },
    ]
  },
  {
    country: 'Jordan',
    slug: 'jordan',
    flag: '🇯🇴',
    region: 'middle-east',
    visaType: 'E-Visa',
    processingTime: '5-7 business days',
    plans: [
      { label: 'Tourist Visa', basePrice: 3300, agentPrice: 4600, publicPrice: 5800 },
    ]
  },
  {
    country: 'Russia',
    slug: 'russia',
    flag: '🇷🇺',
    region: 'europe',
    visaType: 'E-Visa',
    processingTime: '10-15 business days',
    plans: [
      { label: 'Tourist Visa', basePrice: 3200, agentPrice: 4400, publicPrice: 5500 },
    ]
  },
  {
    country: 'Vietnam',
    slug: 'vietnam',
    flag: '🇻🇳',
    region: 'asia',
    visaType: 'E-Visa',
    processingTime: '1-2 business days',
    plans: [
      { label: '30 Days Single', basePrice: 1800, agentPrice: 2500, publicPrice: 3200 },
    ]
  },
  {
    country: 'Indonesia',
    slug: 'indonesia',
    flag: '🇮🇩',
    region: 'asia',
    visaType: 'E-Visa',
    processingTime: '1-2 business days',
    plans: [
      { label: '30 Days', basePrice: 2300, agentPrice: 3200, publicPrice: 4000 },
    ]
  },
  {
    country: 'Philippines',
    slug: 'philippines',
    flag: '🇵🇭',
    region: 'asia',
    visaType: 'E-Visa',
    processingTime: '3-5 business days',
    plans: [
      { label: '30 Days', basePrice: 2500, agentPrice: 3400, publicPrice: 4400 },
    ]
  },
  {
    country: 'Ethiopia',
    slug: 'ethiopia',
    flag: '🇪🇹',
    region: 'africa',
    visaType: 'E-Visa',
    processingTime: '5-7 business days',
    plans: [
      { label: 'Tourist Visa', basePrice: 4000, agentPrice: 5500, publicPrice: 6900 },
    ]
  },
  {
    country: 'Uganda',
    slug: 'uganda',
    flag: '🇺🇬',
    region: 'africa',
    visaType: 'E-Visa',
    processingTime: '5-7 business days',
    plans: [
      { label: 'Tourist Visa', basePrice: 3400, agentPrice: 4700, publicPrice: 5900 },
    ]
  },
  {
    country: 'Zimbabwe',
    slug: 'zimbabwe',
    flag: '🇿🇼',
    region: 'africa',
    visaType: 'E-Visa',
    processingTime: '3-5 business days',
    plans: [
      { label: 'Tourist Visa', basePrice: 2500, agentPrice: 3500, publicPrice: 4400 },
    ]
  },
  {
    country: 'Azerbaijan',
    slug: 'azerbaijan',
    flag: '🇦🇿',
    region: 'asia',
    visaType: 'E-Visa',
    processingTime: '3-5 business days',
    plans: [
      { label: '30 Days', basePrice: 1700, agentPrice: 2350, publicPrice: 3000 },
      { label: 'Express (Same Day)', basePrice: 3800, agentPrice: 5200, publicPrice: 6500 },
    ]
  },
  {
    country: 'Egypt',
    slug: 'egypt',
    flag: '🇪🇬',
    region: 'africa',
    visaType: 'E-Visa',
    processingTime: '1-2 business days',
    isRiskFree: true,
    plans: [
      { label: '30 Days', basePrice: 2400, agentPrice: 3300, publicPrice: 4200 },
      { label: '30 Days Multi', basePrice: 3600, agentPrice: 4900, publicPrice: 6200 },
    ]
  },
  {
    country: 'Malaysia (South)',
    slug: 'malaysia-south',
    flag: '🇲🇾',
    region: 'asia',
    visaType: 'E-Visa',
    processingTime: '5-7 business days',
    plans: [
      { label: 'Tourist Visa', basePrice: 6200, agentPrice: 8600, publicPrice: 10800 },
    ]
  },
  {
    country: 'Morocco',
    slug: 'morocco',
    flag: '🇲🇦',
    region: 'africa',
    visaType: 'E-Visa',
    processingTime: '5-7 business days',
    plans: [
      { label: 'Tourist Visa', basePrice: 5000, agentPrice: 6900, publicPrice: 8700 },
    ]
  },
  {
    country: 'Laos',
    slug: 'laos',
    flag: '🇱🇦',
    region: 'asia',
    visaType: 'E-Visa',
    processingTime: '1-2 business days',
    plans: [
      { label: '30 Days', basePrice: 3300, agentPrice: 4500, publicPrice: 5700 },
    ]
  },
  {
    country: 'Armenia',
    slug: 'armenia',
    flag: '🇦🇲',
    region: 'asia',
    visaType: 'E-Visa',
    processingTime: '3-5 business days',
    plans: [
      { label: '21 Days', basePrice: 1200, agentPrice: 1600, publicPrice: 2000 },
    ]
  },
  {
    country: 'Armenia (Sureshot)',
    slug: 'armenia-sureshot',
    flag: '🇦🇲',
    region: 'asia',
    visaType: 'E-Visa',
    processingTime: '1-2 business days',
    plans: [
      { label: '21 Days Express', basePrice: 14000, agentPrice: 19500, publicPrice: 25000 },
    ]
  },
  {
    country: 'Kenya',
    slug: 'kenya',
    flag: '🇰🇪',
    region: 'africa',
    visaType: 'E-Visa',
    processingTime: '3-5 business days',
    isRiskFree: true,
    plans: [
      { label: '90 Days', basePrice: 2800, agentPrice: 3900, publicPrice: 4900 },
    ]
  },
  {
    country: 'Tanzania',
    slug: 'tanzania',
    flag: '🇹🇿',
    region: 'africa',
    visaType: 'E-Visa',
    processingTime: '3-5 business days',
    plans: [
      { label: '90 Days', basePrice: 3750, agentPrice: 5200, publicPrice: 6500 },
    ]
  },
  {
    country: 'Uzbekistan',
    slug: 'uzbekistan',
    flag: '🇺🇿',
    region: 'asia',
    visaType: 'E-Visa',
    processingTime: '5-7 business days',
    plans: [
      { label: '30 Days', basePrice: 2250, agentPrice: 3100, publicPrice: 3900 },
    ]
  },
  {
    country: 'Tajikistan',
    slug: 'tajikistan',
    flag: '🇹🇯',
    region: 'asia',
    visaType: 'E-Visa',
    processingTime: '7-10 business days',
    plans: [
      { label: '45 Days', basePrice: 3200, agentPrice: 4400, publicPrice: 5550 },
    ]
  },
  {
    country: 'Kyrgyzstan',
    slug: 'kyrgyzstan',
    flag: '🇰🇬',
    region: 'asia',
    visaType: 'E-Visa',
    processingTime: '5-7 business days',
    plans: [
      { label: '60 Days', basePrice: 6000, agentPrice: 8300, publicPrice: 10500 },
    ]
  },
  {
    country: 'Sri Lanka',
    slug: 'sri-lanka',
    flag: '🇱🇰',
    region: 'asia',
    visaType: 'E-Visa',
    processingTime: '1-2 business days',
    plans: [
      { label: '30 Days', basePrice: 400, agentPrice: 550, publicPrice: 700 },
    ]
  },
  {
    country: 'Mongolia',
    slug: 'mongolia',
    flag: '🇲🇳',
    region: 'asia',
    visaType: 'E-Visa',
    processingTime: '5-7 business days',
    plans: [
      { label: '30 Days', basePrice: 1600, agentPrice: 2200, publicPrice: 2700 },
    ]
  },
  {
    country: 'Ukraine',
    slug: 'ukraine',
    flag: '🇺🇦',
    region: 'europe',
    visaType: 'E-Visa',
    processingTime: '10-15 business days',
    plans: [
      { label: '90 Days', basePrice: 2600, agentPrice: 3600, publicPrice: 4500 },
    ]
  },
  {
    country: 'Papua New Guinea',
    slug: 'papua-new-guinea',
    flag: '🇵🇬',
    region: 'asia',
    visaType: 'E-Visa',
    processingTime: '7-10 business days',
    plans: [
      { label: '60 Days', basePrice: 5100, agentPrice: 7000, publicPrice: 8800 },
    ]
  },
  {
    country: 'South Africa',
    slug: 'south-africa',
    flag: '🇿🇦',
    region: 'africa',
    visaType: 'E-Visa',
    processingTime: '10-15 business days',
    plans: [
      { label: '90 Days', basePrice: 3900, agentPrice: 5400, publicPrice: 6700 },
    ]
  },
  {
    country: 'Zambia',
    slug: 'zambia',
    flag: '🇿🇲',
    region: 'africa',
    visaType: 'E-Visa',
    processingTime: '5-7 business days',
    plans: [
      { label: '90 Days', basePrice: 2900, agentPrice: 4000, publicPrice: 5000 },
    ]
  },
  {
    country: 'Hong Kong',
    slug: 'hongkong',
    flag: '🇭🇰',
    region: 'asia',
    visaType: 'E-Visa',
    processingTime: '1-2 business days',
    plans: [
      { label: '90 Days', basePrice: 700, agentPrice: 950, publicPrice: 1200 },
    ]
  },
  {
    country: 'Japan',
    slug: 'japan',
    flag: '🇯🇵',
    region: 'asia',
    visaType: 'E-Visa',
    processingTime: '15-20 business days',
    plans: [
      { label: '90 Days', basePrice: 3200, agentPrice: 4400, publicPrice: 5500 },
    ]
  },
  {
    country: 'Malaysia (MDC)',
    slug: 'malaysia-mdc',
    flag: '🇲🇾',
    region: 'asia',
    visaType: 'E-Visa',
    processingTime: '5-7 business days',
    plans: [
      { label: 'Tourist Visa', basePrice: 0, agentPrice: 0, publicPrice: 0, isContactUs: true },
    ]
  },
  {
    country: 'Thailand',
    slug: 'thailand',
    flag: '🇹🇭',
    region: 'asia',
    visaType: 'E-Visa',
    processingTime: '5-7 business days',
    plans: [
      { label: 'Tourist Visa', basePrice: 0, agentPrice: 0, publicPrice: 0, isContactUs: true },
    ]
  },
  {
    country: 'Thailand (TDAC)',
    slug: 'thailand-tdac',
    flag: '🇹🇭',
    region: 'asia',
    visaType: 'E-Visa',
    processingTime: '5-7 business days',
    plans: [
      { label: 'Tourist Visa', basePrice: 0, agentPrice: 0, publicPrice: 0, isContactUs: true },
    ]
  },
  {
    country: 'Argentina',
    slug: 'argentina',
    flag: '🇦🇷',
    region: 'others',
    visaType: 'E-Visa',
    processingTime: '5-7 business days',
    plans: [
      { label: '90 Days', basePrice: 1700, agentPrice: 2300, publicPrice: 2900 },
    ]
  },
  {
    country: 'South Africa',
    slug: 'south-africa-2',
    flag: '🇿🇦',
    region: 'africa',
    visaType: 'E-Visa',
    processingTime: '10-15 business days',
    plans: [
      { label: '90 Days', basePrice: 4000, agentPrice: 5500, publicPrice: 6900 },
    ]
  },
  {
    country: 'Madagascar',
    slug: 'madagascar',
    flag: '🇲🇬',
    region: 'africa',
    visaType: 'E-Visa',
    processingTime: '5-7 business days',
    plans: [
      { label: '15 Days', basePrice: 2300, agentPrice: 3200, publicPrice: 4000 },
    ]
  },
  {
    country: 'Cuba',
    slug: 'cuba',
    flag: '🇨🇺',
    region: 'others',
    visaType: 'E-Visa',
    processingTime: '10-15 business days',
    plans: [
      { label: 'Tourist Card', basePrice: 14000, agentPrice: 19500, publicPrice: 25000 },
    ]
  },
];

// Nationalities that must always be selectable even without a visa product of
// their own (this is an India-based service — most applicants are Indian).
const NATIONALITY_ONLY_COUNTRIES = [
  { name: 'India', flag: '🇮🇳', continent: 'asia' },
  { name: 'Pakistan', flag: '🇵🇰', continent: 'asia' },
  { name: 'Bangladesh', flag: '🇧🇩', continent: 'asia' },
  { name: 'Nepal', flag: '🇳🇵', continent: 'asia' },
  { name: 'United States', flag: '🇺🇸', continent: 'north-america' },
  { name: 'United Kingdom', flag: '🇬🇧', continent: 'europe' },
  { name: 'Canada', flag: '🇨🇦', continent: 'north-america' },
  { name: 'Australia', flag: '🇦🇺', continent: 'oceania' },
  { name: 'United Arab Emirates', flag: '🇦🇪', continent: 'middle-east' },
];

// Upsert distinct countries referenced by visasData, return a name -> _id lookup map
async function seedCountries() {
  const regionToContinent = {
    'middle-east': 'middle-east',
    asia: 'asia',
    africa: 'africa',
    europe: 'europe',
    others: 'others',
  };

  const byName = new Map();
  visasData.forEach(v => {
    if (!byName.has(v.country)) {
      byName.set(v.country, { name: v.country, flag: v.flag, continent: regionToContinent[v.region] || 'others' });
    }
  });
  NATIONALITY_ONLY_COUNTRIES.forEach(c => {
    if (!byName.has(c.name)) byName.set(c.name, c);
  });

  const idByName = new Map();
  for (const [name, data] of byName) {
    const country = await Country.findOneAndUpdate(
      { name },
      { $setOnInsert: data },
      { upsert: true, new: true }
    );
    idByName.set(name, country._id);
  }
  console.log(`✅ Seeded/verified ${idByName.size} countries`);
  return idByName;
}

async function seedVisas() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/visayatri');
    console.log('✅ Connected to MongoDB');

    const countryIdByName = await seedCountries();

    // Check if visas already exist
    const count = await Visa.countDocuments();
    if (count > 0) {
      console.log(`⚠️  Database already has ${count} visas. Clear first if you want to reseed.`);
      console.log('Exiting...');
      process.exit(0);
    }

    // Insert all visas, linked to their Country
    const visasWithCountryRef = visasData.map(v => ({ ...v, countryRef: countryIdByName.get(v.country) }));
    const result = await Visa.insertMany(visasWithCountryRef);
    console.log(`✅ Successfully seeded ${result.length} visas`);

    // Display summary
    const regions = {};
    result.forEach(visa => {
      regions[visa.region] = (regions[visa.region] || 0) + 1;
    });
    console.log('\n📊 Visas by Region:');
    Object.entries(regions).forEach(([region, count]) => {
      console.log(`   ${region}: ${count} visas`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding visas:', err.message);
    process.exit(1);
  }
}

// Run if this is the main module
if (require.main === module) {
  seedVisas();
}

module.exports = seedVisas;
