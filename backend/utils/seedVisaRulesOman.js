/**
 * Pilot data for the new VisaRule engine — Oman only.
 *
 * Researched via web search cross-referencing the official Royal Oman
 * Police eVisa portal (evisa.rop.gov.om); the portal itself is a
 * JS-rendered SPA that couldn't be fetched and parsed directly, so figures
 * below are corroborated across multiple independent secondary sources
 * rather than read straight off the official page. Seeded as DRAFT /
 * OFFICIAL_VERIFICATION_REQUIRED — do NOT flip to ACTIVE / HUMAN_REVIEWED
 * until someone has confirmed the fee/validity figures directly on
 * evisa.rop.gov.om.
 *
 * Run manually: MONGODB_URI="..." node utils/seedVisaRulesOman.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const VisaRule = require('../models/VisaRule');

const SOURCE = {
  sourceUrl:   'https://evisa.rop.gov.om/',
  sourceTitle: 'Royal Oman Police — eVisa Portal',
  sourceType:  'immigration_department',
  lastVerifiedAt: new Date(),
  verifiedBy:  'Research pass (secondary-source corroborated, NOT a direct official-page fetch) — needs human confirmation on evisa.rop.gov.om before going live',
};

const RULES = [
  {
    country: 'Oman', countrySlug: 'oman', productSlug: 'oman-10-day',
    officialVisaName: '10-Day Tourist eVisa', visaCategory: 'tourist', travelDocumentType: 'evisa',
    entryType: 'single',
    validityPeriod: { value: 10, unit: 'days' },
    maximumStay:    { value: 10, unit: 'days' },
    extensionAvailable: false,
    processingTime: '2-3 business days',
    governmentFee: { amount: 5, currency: 'OMR', status: 'VERIFICATION_REQUIRED' },
    eligibility: 'Unsponsored tourist eVisa for eligible nationalities (per Royal Oman Police list).',
    passportRequirements: 'Passport valid for at least 6 months from date of entry.',
    photoRequirements: 'Recent passport-size colour photograph, white background.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'], officialReason: 'Identity verification' },
      { documentName: 'Passport-size photograph', required: true, critical: true, acceptedFormats: ['jpg','png'] },
      { documentName: 'Confirmed return/onward ticket', required: true, critical: false },
    ],
    ruleVersion: '2026.08-draft',
  },
  {
    country: 'Oman', countrySlug: 'oman', productSlug: 'oman-30-day',
    officialVisaName: '30-Day Tourist eVisa (Single Entry)', visaCategory: 'tourist', travelDocumentType: 'evisa',
    entryType: 'single',
    validityPeriod: { value: 30, unit: 'days' },
    maximumStay:    { value: 30, unit: 'days' },
    extensionAvailable: true,
    extensionNote: 'Extendable once for a further 30 days, subject to Royal Oman Police approval.',
    processingTime: '2-3 business days',
    governmentFee: { amount: 20, currency: 'OMR', status: 'VERIFICATION_REQUIRED' },
    eligibility: 'Unsponsored tourist eVisa for eligible nationalities (per Royal Oman Police list).',
    passportRequirements: 'Passport valid for at least 6 months from date of entry.',
    photoRequirements: 'Recent passport-size colour photograph, white background.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Passport-size photograph', required: true, critical: true, acceptedFormats: ['jpg','png'] },
      { documentName: 'Confirmed return/onward ticket', required: true, critical: false },
      { documentName: 'Hotel booking confirmation', required: false, conditional: true, condition: 'Requested by ROP in some cases' },
    ],
    ruleVersion: '2026.08-draft',
  },
  {
    country: 'Oman', countrySlug: 'oman', productSlug: 'oman-1-year-multiple',
    officialVisaName: '1-Year Multiple-Entry Tourist eVisa', visaCategory: 'tourist', travelDocumentType: 'evisa',
    entryType: 'multiple',
    validityPeriod: { value: 1, unit: 'years' },
    maximumStay:    { value: 30, unit: 'days' }, // per-visit cap
    extensionAvailable: false,
    extensionNote: 'Each individual stay is capped at 30 days and cannot be extended, but the visa allows repeated re-entry within the 1-year validity.',
    processingTime: '2-3 business days',
    governmentFee: { amount: 50, currency: 'OMR', status: 'VERIFICATION_REQUIRED' },
    eligibility: 'Unsponsored tourist eVisa for eligible nationalities (per Royal Oman Police list).',
    passportRequirements: 'Passport valid for at least 6 months from date of entry.',
    photoRequirements: 'Recent passport-size colour photograph, white background.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Passport-size photograph', required: true, critical: true, acceptedFormats: ['jpg','png'] },
    ],
    ruleVersion: '2026.08-draft',
  },
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  for (const rule of RULES) {
    await VisaRule.findOneAndUpdate(
      { countrySlug: rule.countrySlug, productSlug: rule.productSlug, ruleVersion: rule.ruleVersion },
      { ...rule, source: SOURCE, status: 'DRAFT', verificationStatus: 'OFFICIAL_VERIFICATION_REQUIRED' },
      { upsert: true, new: true },
    );
    console.log(`Upserted: ${rule.officialVisaName}`);
  }

  console.log('\nDone. All rules seeded as DRAFT / OFFICIAL_VERIFICATION_REQUIRED — review before promoting to ACTIVE.');
  process.exit(0);
}

run().catch(err => { console.error('Seed failed:', err.message); process.exit(1); });
