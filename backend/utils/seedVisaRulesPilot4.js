/**
 * VisaRule batch 4 — Russia, Indonesia, Cambodia.
 * Same sourcing method as prior batches (web-search corroborated).
 * Run manually: MONGODB_URI="..." node utils/seedVisaRulesPilot4.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const VisaRule = require('../models/VisaRule');

const verifiedBy = 'Research pass (secondary-source corroborated, NOT a direct official-page fetch) — spot-check recommended';

const RULES = [
  {
    country: 'Russia', countrySlug: 'russia', productSlug: 'russia-evisa',
    officialVisaName: 'Unified Electronic Visa', visaCategory: 'tourist', travelDocumentType: 'evisa',
    entryType: 'single',
    validityPeriod: { value: 60, unit: 'days' },
    maximumStay:    { value: 16, unit: 'days' },
    extensionAvailable: false,
    processingTime: '4 calendar days',
    governmentFee: { amount: 52, currency: 'USD', status: 'VERIFICATION_REQUIRED' },
    eligibility: 'Available to Indian passport holders for tourism, business, humanitarian and some other purposes.',
    passportRequirements: 'Passport valid for at least 6 months.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Passport photo', required: true, critical: true, acceptedFormats: ['jpg','png'] },
      { documentName: 'Travel medical insurance valid across Russia for trip duration', required: true, critical: true, officialReason: 'Mandatory for e-visa entry' },
    ],
    source: { sourceUrl: 'https://evisa.kdmid.ru/', sourceTitle: 'Russian Federation — Official Electronic Visa Portal', sourceType: 'ministry_of_foreign_affairs', lastVerifiedAt: new Date(), verifiedBy },
    ruleVersion: '2026.08',
  },
  {
    country: 'Indonesia', countrySlug: 'indonesia', productSlug: 'indonesia-e-voa',
    officialVisaName: 'Electronic Visa on Arrival (e-VOA)', visaCategory: 'tourist', travelDocumentType: 'visa_on_arrival',
    entryType: 'single',
    validityPeriod: { value: 90, unit: 'days' }, // entry window from issue date
    maximumStay:    { value: 30, unit: 'days' },
    extensionAvailable: true,
    extensionNote: 'One 30-day extension available (max 60 days total); since June 2025 extension requires an in-person visit to a local immigration office, can be applied for 14+ days after arrival.',
    processingTime: 'Same-day online',
    governmentFee: { amount: 500000, currency: 'IDR', status: 'VERIFICATION_REQUIRED' },
    eligibility: 'Indian nationals are among 90+ eligible nationalities for e-VOA.',
    passportRequirements: 'Passport valid for at least 6 months.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Passport-size photo', required: true, critical: true, acceptedFormats: ['jpg','png'] },
    ],
    source: { sourceUrl: 'https://evisa.imigrasi.go.id/', sourceTitle: 'Directorate General of Immigration, Indonesia — Official eVisa Portal', sourceType: 'immigration_department', lastVerifiedAt: new Date(), verifiedBy },
    ruleVersion: '2026.08',
  },
  {
    country: 'Cambodia', countrySlug: 'cambodia', productSlug: 'cambodia-evisa-tourist',
    officialVisaName: 'Tourist eVisa (Type T)', visaCategory: 'tourist', travelDocumentType: 'evisa',
    entryType: 'single',
    validityPeriod: { value: 90, unit: 'days' }, // entry window
    maximumStay:    { value: 30, unit: 'days' },
    extensionAvailable: false,
    processingTime: '3 business days',
    governmentFee: { amount: 30, currency: 'USD', status: 'VERIFICATION_REQUIRED' },
    eligibility: 'Available to Indian passport holders for tourism/leisure.',
    passportRequirements: 'Passport valid for at least 6 months.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Passport-size photo', required: true, critical: true, acceptedFormats: ['jpg','png'] },
    ],
    source: { sourceUrl: 'https://www.evisa.gov.kh/', sourceTitle: 'Kingdom of Cambodia — Official eVisa Portal', sourceType: 'immigration_department', lastVerifiedAt: new Date(), verifiedBy },
    ruleVersion: '2026.08',
  },
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
  for (const rule of RULES) {
    await VisaRule.findOneAndUpdate(
      { countrySlug: rule.countrySlug, productSlug: rule.productSlug, ruleVersion: rule.ruleVersion },
      { ...rule, status: 'DRAFT', verificationStatus: 'OFFICIAL_VERIFICATION_REQUIRED' },
      { upsert: true, new: true },
    );
    console.log(`Upserted: ${rule.country} — ${rule.officialVisaName}`);
  }
  console.log('\nDone.');
  process.exit(0);
}

run().catch(err => { console.error('Seed failed:', err.message); process.exit(1); });
