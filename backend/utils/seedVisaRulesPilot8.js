/**
 * VisaRule batch 8 (FINAL) — Papua New Guinea, Zambia, Argentina, Madagascar, Cuba.
 * Completes the 36-country scope. Same sourcing method as prior batches
 * (web-search corroborated, not raw official-portal fetches).
 * Run manually: MONGODB_URI="..." node utils/seedVisaRulesPilot8.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const VisaRule = require('../models/VisaRule');

const verifiedBy = 'Research pass (secondary-source corroborated, NOT a direct official-page fetch) — spot-check recommended';

const RULES = [
  {
    country: 'Papua New Guinea', countrySlug: 'papua-new-guinea', productSlug: 'png-evisa-tourist',
    officialVisaName: 'Tourist eVisa', visaCategory: 'tourist', travelDocumentType: 'evisa',
    entryType: 'single',
    validityPeriod: { value: 6, unit: 'months' },
    maximumStay:    { value: 60, unit: 'days' },
    extensionAvailable: false,
    processingTime: 'Not confirmed in this research pass',
    governmentFee: { amount: 50, currency: 'USD', status: 'VERIFICATION_REQUIRED' },
    eligibility: 'No Visa on Arrival for Indian nationals — an approved eVisa is required before boarding the flight to Port Moresby.',
    passportRequirements: 'Passport valid for the intended stay.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Passport photo', required: true, critical: true, acceptedFormats: ['jpg','png'] },
    ],
    source: { sourceUrl: 'https://evisa.ica.gov.pg/', sourceTitle: 'PNG Immigration & Citizenship Authority — Official eVisa Portal', sourceType: 'immigration_department', lastVerifiedAt: new Date(), verifiedBy },
    ruleVersion: '2026.08',
  },
  {
    country: 'Zambia', countrySlug: 'zambia', productSlug: 'zambia-evisa-single',
    officialVisaName: 'eVisa (Single/Double Entry)', visaCategory: 'tourist', travelDocumentType: 'evisa',
    entryType: 'single',
    validityPeriod: { value: 90, unit: 'days' },
    maximumStay:    { value: 30, unit: 'days' },
    extensionAvailable: false,
    processingTime: '3 business days',
    governmentFee: { amount: 50, currency: 'USD', status: 'VERIFICATION_REQUIRED' },
    passportRequirements: 'Passport valid for at least 6 months with at least 2 blank pages.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Passport photo', required: true, critical: true, acceptedFormats: ['jpg','png'] },
    ],
    source: { sourceUrl: 'https://eservices.zambiaimmigration.gov.zm/', sourceTitle: 'Zambia Department of Immigration — Official eVisa Portal', sourceType: 'immigration_department', lastVerifiedAt: new Date(), verifiedBy },
    ruleVersion: '2026.08',
  },
  {
    country: 'Zambia', countrySlug: 'zambia', productSlug: 'zambia-evisa-multiple',
    officialVisaName: 'eVisa (Multiple Entry)', visaCategory: 'tourist', travelDocumentType: 'evisa',
    entryType: 'multiple',
    validityPeriod: { value: 90, unit: 'days' },
    maximumStay:    { value: 30, unit: 'days' },
    extensionAvailable: false,
    processingTime: '3 business days',
    governmentFee: { amount: 80, currency: 'USD', status: 'VERIFICATION_REQUIRED' },
    passportRequirements: 'Passport valid for at least 6 months with at least 2 blank pages.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Passport photo', required: true, critical: true, acceptedFormats: ['jpg','png'] },
    ],
    source: { sourceUrl: 'https://eservices.zambiaimmigration.gov.zm/', sourceTitle: 'Zambia Department of Immigration — Official eVisa Portal', sourceType: 'immigration_department', lastVerifiedAt: new Date(), verifiedBy },
    ruleVersion: '2026.08',
  },
  {
    country: 'Argentina', countrySlug: 'argentina', productSlug: 'argentina-visa-free-us-visa-holders',
    officialVisaName: 'Visa-Free Entry (for US visa / Green Card holders)', visaCategory: 'tourist', travelDocumentType: 'visa_free',
    entryType: 'multiple',
    validityPeriod: { value: 90, unit: 'days' },
    maximumStay:    { value: 90, unit: 'days' },
    extensionAvailable: false,
    processingTime: 'N/A — visa-free',
    governmentFee: { amount: 0, currency: 'USD', status: 'VERIFIED' },
    eligibility: 'Since Resolution 353/2025 (28 Aug 2025), Indian citizens holding a valid US visa OR US permanent residence (Green Card) can enter Argentina visa-free for tourism, up to 90 days. This exempts them from AVE entirely — check for this FIRST before selling the AVE product below.',
    passportRequirements: 'Passport valid for at least 6 months, with a valid US visa or Green Card.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Valid US visa or Green Card', required: true, critical: true, officialReason: 'Basis of the visa-free exemption' },
    ],
    source: { sourceUrl: 'https://eindi.cancilleria.gob.ar/en/01-tourist-visa', sourceTitle: 'Argentine Embassy in India — Tourist Visa Information', sourceType: 'embassy_consulate', lastVerifiedAt: new Date(), verifiedBy },
    ruleVersion: '2026.08',
  },
  {
    country: 'Argentina', countrySlug: 'argentina', productSlug: 'argentina-ave-evisa',
    officialVisaName: 'AVE (Electronic Travel Authorization)', visaCategory: 'tourist', travelDocumentType: 'eta',
    entryType: 'multiple',
    validityPeriod: { value: 3, unit: 'months' },
    maximumStay:    { value: 90, unit: 'days' },
    extensionAvailable: false,
    processingTime: '20 business days',
    governmentFee: { amount: 0, currency: 'USD', status: 'VERIFICATION_REQUIRED' },
    eligibility: 'For Indian nationals who do NOT qualify for the visa-free route above: eligible only if holding a valid US visa OR Schengen visa, for tourism purposes only.',
    passportRequirements: 'Passport valid for at least 6 months with at least 2 blank pages.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Valid US or Schengen visa', required: true, critical: true, officialReason: 'Mandatory eligibility basis' },
    ],
    source: { sourceUrl: 'https://eindi.cancilleria.gob.ar/en/01-tourist-visa', sourceTitle: 'Argentine Embassy in India — Tourist Visa Information', sourceType: 'embassy_consulate', lastVerifiedAt: new Date(), verifiedBy },
    ruleVersion: '2026.08',
  },
  {
    country: 'Madagascar', countrySlug: 'madagascar', productSlug: 'madagascar-evisa-15-day',
    officialVisaName: 'e-Visa (15-Day, Short Stay)', visaCategory: 'tourist', travelDocumentType: 'evisa',
    entryType: 'single',
    validityPeriod: { value: 60, unit: 'days' }, // entry window
    maximumStay:    { value: 15, unit: 'days' },
    extensionAvailable: false,
    processingTime: '3 calendar days',
    governmentFee: { amount: 35, currency: 'USD', status: 'VERIFICATION_REQUIRED' },
    eligibility: 'Fee tripled from ~$10 to $35 (€30) effective 16 Feb 2026 — make sure any older cached pricing is not still in use.',
    passportRequirements: 'Passport valid for at least 6 months from date of arrival.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Passport photo', required: true, critical: true, acceptedFormats: ['jpg','png'] },
    ],
    source: { sourceUrl: 'https://evisamada.gov.mg/', sourceTitle: 'Madagascar — Official eVisa Portal (domain seen in multiple sources; not independently fetched)', sourceType: 'immigration_department', lastVerifiedAt: new Date(), verifiedBy },
    ruleVersion: '2026.08',
  },
  {
    country: 'Cuba', countrySlug: 'cuba', productSlug: 'cuba-tourist-card',
    officialVisaName: 'Tourist Card (Tarjeta de Turismo)', visaCategory: 'tourist', travelDocumentType: 'travel_authorization',
    entryType: 'single',
    validityPeriod: { value: 30, unit: 'days' },
    maximumStay:    { value: 30, unit: 'days' },
    extensionAvailable: true,
    extensionNote: 'One 30-day extension available in-country.',
    processingTime: 'Not confirmed in this research pass',
    governmentFee: { amount: 25, currency: 'USD', status: 'VERIFICATION_REQUIRED' },
    eligibility: 'SIGNIFICANT DISCREPANCY found in this research pass: several sources describe India-Cuba as having a general visa-free arrangement, needing only this Tourist Card (not a "visa" in the traditional sense) — while the current commercial product on this site is priced far above what a simple Tourist Card would cost. No official Cuban government portal URL could be confidently identified in this pass. This entire product needs a fresh, careful re-verification (ideally via the Cuban Embassy in India directly) before the fee or process description is trusted.',
    passportRequirements: 'Passport valid for at least 6 months.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Return/onward flight booking', required: true, critical: true },
      { documentName: 'Hotel/accommodation booking', required: true, critical: true },
      { documentName: 'Proof of sufficient funds', required: true, critical: false },
    ],
    source: { sourceUrl: 'https://misiones.cubaminrex.cu/en/india', sourceTitle: 'Cuban Embassy in India (general site — specific Tourist Card page not confidently located in this pass)', sourceType: 'embassy_consulate', lastVerifiedAt: new Date(), verifiedBy },
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
  console.log('\nDone. All 36 countries seeded.');
  process.exit(0);
}

run().catch(err => { console.error('Seed failed:', err.message); process.exit(1); });
