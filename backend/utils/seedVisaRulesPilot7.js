/**
 * VisaRule batch 7 — Ethiopia, Uganda, Zimbabwe, Laos, Tajikistan, Kyrgyzstan.
 * Same sourcing method as prior batches (web-search corroborated).
 * Run manually: MONGODB_URI="..." node utils/seedVisaRulesPilot7.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const VisaRule = require('../models/VisaRule');

const verifiedBy = 'Research pass (secondary-source corroborated, NOT a direct official-page fetch) — spot-check recommended';

const RULES = [
  {
    country: 'Ethiopia', countrySlug: 'ethiopia', productSlug: 'ethiopia-evisa-30-day',
    officialVisaName: 'e-Visa (30-Day)', visaCategory: 'tourist', travelDocumentType: 'evisa',
    entryType: 'single',
    validityPeriod: { value: 30, unit: 'days' },
    maximumStay:    { value: 30, unit: 'days' },
    extensionAvailable: false,
    processingTime: '3-5 business days',
    governmentFee: { amount: 52, currency: 'USD', status: 'VERIFICATION_REQUIRED' },
    passportRequirements: 'Passport valid for at least 6 months with 2 blank pages.',
    photoRequirements: '4cm x 6cm photo, white/light background, taken within last 6 months.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Passport-style photo (4x6cm)', required: true, critical: true, acceptedFormats: ['jpg','png'] },
    ],
    source: { sourceUrl: 'https://www.evisa.gov.et/', sourceTitle: 'Ethiopia Immigration & Citizenship Service — Official eVisa Portal', sourceType: 'immigration_department', lastVerifiedAt: new Date(), verifiedBy },
    ruleVersion: '2026.08',
  },
  {
    country: 'Ethiopia', countrySlug: 'ethiopia', productSlug: 'ethiopia-evisa-90-day',
    officialVisaName: 'e-Visa (90-Day)', visaCategory: 'tourist', travelDocumentType: 'evisa',
    entryType: 'single',
    validityPeriod: { value: 90, unit: 'days' },
    maximumStay:    { value: 90, unit: 'days' },
    extensionAvailable: false,
    processingTime: '3-5 business days',
    governmentFee: { amount: 72, currency: 'USD', status: 'VERIFICATION_REQUIRED' },
    passportRequirements: 'Passport valid for at least 6 months with 2 blank pages.',
    photoRequirements: '4cm x 6cm photo, white/light background, taken within last 6 months.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Passport-style photo (4x6cm)', required: true, critical: true, acceptedFormats: ['jpg','png'] },
    ],
    source: { sourceUrl: 'https://www.evisa.gov.et/', sourceTitle: 'Ethiopia Immigration & Citizenship Service — Official eVisa Portal', sourceType: 'immigration_department', lastVerifiedAt: new Date(), verifiedBy },
    ruleVersion: '2026.08',
  },

  {
    country: 'Uganda', countrySlug: 'uganda', productSlug: 'uganda-evisa',
    officialVisaName: 'e-Visa', visaCategory: 'tourist', travelDocumentType: 'evisa',
    entryType: 'single',
    validityPeriod: { value: 90, unit: 'days' }, // approval-authorization validity, to enter within
    maximumStay:    { value: 30, unit: 'days' },
    extensionAvailable: false,
    processingTime: '3-5 business days',
    governmentFee: { amount: 50, currency: 'USD', status: 'VERIFICATION_REQUIRED' },
    eligibility: 'No visa-on-arrival for Indian nationals — e-Visa must be obtained in advance. Approval Authorisation is valid 90 days from approval date to enter; if unused it expires and a fresh application is required.',
    passportRequirements: 'Passport valid for at least 6 months with at least 2 blank pages.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Passport-style photo', required: true, critical: true, acceptedFormats: ['jpg','png'] },
    ],
    source: { sourceUrl: 'https://visas.immigration.go.ug/', sourceTitle: 'Uganda Directorate of Citizenship and Immigration Control — Official eVisa Portal', sourceType: 'immigration_department', lastVerifiedAt: new Date(), verifiedBy },
    ruleVersion: '2026.08',
  },

  {
    country: 'Zimbabwe', countrySlug: 'zimbabwe', productSlug: 'zimbabwe-evisa-single',
    officialVisaName: 'Single Entry Tourist eVisa', visaCategory: 'tourist', travelDocumentType: 'evisa',
    entryType: 'single',
    validityPeriod: { value: 3, unit: 'months' }, // window to enter
    maximumStay:    { value: 30, unit: 'days' },
    extensionAvailable: false,
    processingTime: 'Not confirmed in this research pass',
    governmentFee: { amount: 30, currency: 'USD', status: 'VERIFICATION_REQUIRED' },
    eligibility: 'The official portal displays nationality-specific fees automatically — Indian-specific fee not independently confirmed in this pass; $30 is the commonly cited single-entry figure but should be checked against the live portal for India specifically.',
    passportRequirements: 'Passport valid for at least 6 months.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Passport photo', required: true, critical: true, acceptedFormats: ['jpg','png'] },
    ],
    source: { sourceUrl: 'https://www.evisa.gov.zw/', sourceTitle: 'Zimbabwe Department of Immigration — Official eVisa Portal', sourceType: 'immigration_department', lastVerifiedAt: new Date(), verifiedBy },
    ruleVersion: '2026.08',
  },

  {
    country: 'Laos', countrySlug: 'laos', productSlug: 'laos-evisa',
    officialVisaName: 'e-Visa', visaCategory: 'tourist', travelDocumentType: 'evisa',
    entryType: 'single',
    validityPeriod: { value: 60, unit: 'days' },
    maximumStay:    { value: 30, unit: 'days' },
    extensionAvailable: false,
    processingTime: '3 business days',
    governmentFee: { amount: 40, currency: 'USD', status: 'VERIFICATION_REQUIRED' }, // midpoint of conflicting $35-$50 reports
    eligibility: 'Fee sources conflict ($35 vs $50) — confirm current fee on laoevisa.gov.la before quoting.',
    passportRequirements: 'Passport valid for at least 6 months with 1-2 blank pages.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Passport photo', required: true, critical: true, acceptedFormats: ['jpg','png'] },
    ],
    source: { sourceUrl: 'https://laoevisa.gov.la/', sourceTitle: "Lao PDR — Official Online Visa Portal", sourceType: 'immigration_department', lastVerifiedAt: new Date(), verifiedBy },
    ruleVersion: '2026.08',
  },

  {
    country: 'Tajikistan', countrySlug: 'tajikistan', productSlug: 'tajikistan-evisa',
    officialVisaName: 'e-Visa', visaCategory: 'tourist', travelDocumentType: 'evisa',
    entryType: 'single',
    validityPeriod: { value: 90, unit: 'days' },
    maximumStay:    { value: 45, unit: 'days' },
    extensionAvailable: false,
    processingTime: 'Not confirmed in this research pass (commonly ~3 business days for the region)',
    governmentFee: { amount: 50, currency: 'USD', status: 'VERIFICATION_REQUIRED' },
    eligibility: 'Fee sources conflict ($30 vs $50) and max-stay sources conflict (45 vs 60 days) — confirm both directly on evisa.tj before quoting. Enters through all border points.',
    passportRequirements: 'Passport valid for the intended stay.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Passport photo', required: true, critical: true, acceptedFormats: ['jpg','png'] },
    ],
    source: { sourceUrl: 'https://www.evisa.tj/', sourceTitle: 'Republic of Tajikistan — Official e-Visa Portal', sourceType: 'ministry_of_foreign_affairs', lastVerifiedAt: new Date(), verifiedBy },
    ruleVersion: '2026.08',
  },

  {
    country: 'Kyrgyzstan', countrySlug: 'kyrgyzstan', productSlug: 'kyrgyzstan-evisa',
    officialVisaName: 'e-Visa', visaCategory: 'tourist', travelDocumentType: 'evisa',
    entryType: 'single',
    validityPeriod: { value: 90, unit: 'days' },
    maximumStay:    { value: 30, unit: 'days' },
    extensionAvailable: false,
    processingTime: '3 business days',
    governmentFee: { amount: 30, currency: 'USD', status: 'VERIFICATION_REQUIRED' },
    eligibility: 'Indian nationals holding a valid US/UK/Schengen visa can instead use 7-day visa-free entry as a faster alternative — worth flagging to customers who already hold one of those visas.',
    passportRequirements: 'Passport valid for the intended stay.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Passport photo', required: true, critical: true, acceptedFormats: ['jpg','png'] },
    ],
    source: { sourceUrl: 'https://www.evisa.e-gov.kg/', sourceTitle: 'Kyrgyz Republic — Official e-Visa Portal', sourceType: 'ministry_of_foreign_affairs', lastVerifiedAt: new Date(), verifiedBy },
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
