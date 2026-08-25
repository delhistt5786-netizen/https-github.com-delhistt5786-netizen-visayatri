/**
 * VisaRule batch 5 — Egypt, Kenya, Sri Lanka, Azerbaijan, Morocco, Tanzania.
 * Same sourcing method as prior batches (web-search corroborated).
 * Run manually: MONGODB_URI="..." node utils/seedVisaRulesPilot5.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const VisaRule = require('../models/VisaRule');

const verifiedBy = 'Research pass (secondary-source corroborated, NOT a direct official-page fetch) — spot-check recommended';

const RULES = [
  // ── EGYPT ────────────────────────────────────────────────
  {
    country: 'Egypt', countrySlug: 'egypt', productSlug: 'egypt-evisa-single',
    officialVisaName: 'eVisa (Single Entry)', visaCategory: 'tourist', travelDocumentType: 'evisa',
    entryType: 'single',
    validityPeriod: { value: 90, unit: 'days' },
    maximumStay:    { value: 30, unit: 'days' },
    extensionAvailable: false,
    processingTime: '3-5 business days',
    governmentFee: { amount: 25, currency: 'USD', status: 'VERIFICATION_REQUIRED' },
    passportRequirements: 'Passport valid for at least 6 months.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Passport photo', required: true, critical: true, acceptedFormats: ['jpg','png'] },
    ],
    source: { sourceUrl: 'https://visa2egypt.gov.eg/', sourceTitle: 'Egypt Ministry of Interior — Official eVisa Portal', sourceType: 'immigration_department', lastVerifiedAt: new Date(), verifiedBy },
    ruleVersion: '2026.08',
  },
  {
    country: 'Egypt', countrySlug: 'egypt', productSlug: 'egypt-evisa-multiple',
    officialVisaName: 'eVisa (Multiple Entry)', visaCategory: 'tourist', travelDocumentType: 'evisa',
    entryType: 'multiple',
    validityPeriod: { value: 180, unit: 'days' },
    maximumStay:    { value: 30, unit: 'days' },
    extensionAvailable: false,
    processingTime: '3-5 business days',
    governmentFee: { amount: 60, currency: 'USD', status: 'VERIFICATION_REQUIRED' },
    passportRequirements: 'Passport valid for at least 6 months.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Passport photo', required: true, critical: true, acceptedFormats: ['jpg','png'] },
    ],
    source: { sourceUrl: 'https://visa2egypt.gov.eg/', sourceTitle: 'Egypt Ministry of Interior — Official eVisa Portal', sourceType: 'immigration_department', lastVerifiedAt: new Date(), verifiedBy },
    ruleVersion: '2026.08',
  },

  // ── KENYA ────────────────────────────────────────────────
  {
    country: 'Kenya', countrySlug: 'kenya', productSlug: 'kenya-eta',
    officialVisaName: 'Electronic Travel Authorization (eTA)', visaCategory: 'tourist', travelDocumentType: 'eta',
    entryType: 'single',
    validityPeriod: { value: 90, unit: 'days' },
    maximumStay:    { value: 90, unit: 'days' },
    extensionAvailable: false,
    processingTime: '24-72 hours (official window: 3-5 business days)',
    governmentFee: { amount: 30, currency: 'USD', status: 'VERIFICATION_REQUIRED' },
    eligibility: 'Kenya replaced its old eVisa system with the eTA in 2024 — this is a travel authorization, not a traditional visa, but functions as the mandatory pre-arrival approval for Indian nationals.',
    passportRequirements: 'Passport valid for at least 6 months.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Digital return/onward ticket', required: true, critical: true },
      { documentName: 'Hotel booking confirmation', required: true, critical: true },
    ],
    source: { sourceUrl: 'https://etakenya.go.ke/', sourceTitle: 'Republic of Kenya — Official eTA Portal', sourceType: 'immigration_department', lastVerifiedAt: new Date(), verifiedBy },
    ruleVersion: '2026.08',
  },

  // ── SRI LANKA ────────────────────────────────────────────
  {
    country: 'Sri Lanka', countrySlug: 'sri-lanka', productSlug: 'sri-lanka-eta',
    officialVisaName: 'Tourist ETA', visaCategory: 'tourist', travelDocumentType: 'eta',
    entryType: 'double',
    validityPeriod: { value: 30, unit: 'days' },
    maximumStay:    { value: 30, unit: 'days' },
    extensionAvailable: true,
    extensionNote: 'Extendable up to 240 further days at the Department of Immigration, Colombo (max ~270 days total).',
    processingTime: 'Typically same-day online',
    governmentFee: { amount: 0, currency: 'USD', status: 'VERIFICATION_REQUIRED' },
    eligibility: 'CONFLICTING REPORTS as of this research: some sources state Sri Lanka waived ETA fees AND the ETA requirement entirely for Indian nationals from Feb 2026 (tourism boost ahead of the 2026 T20 World Cup); others still describe a free-but-required ETA process. This is a live, disputed policy point — verify current status directly at eta.gov.lk or the Sri Lankan High Commission before advising customers.',
    passportRequirements: 'Passport valid for the intended stay; confirmed return/onward ticket required regardless of ETA status.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Confirmed return/onward ticket', required: true, critical: true },
    ],
    source: { sourceUrl: 'https://eta.gov.lk/', sourceTitle: 'Sri Lanka Department of Immigration & Emigration — Official ETA Portal', sourceType: 'immigration_department', lastVerifiedAt: new Date(), verifiedBy },
    ruleVersion: '2026.08',
  },

  // ── AZERBAIJAN ───────────────────────────────────────────
  {
    country: 'Azerbaijan', countrySlug: 'azerbaijan', productSlug: 'azerbaijan-evisa-standard',
    officialVisaName: 'e-Visa (Standard Processing)', visaCategory: 'tourist', travelDocumentType: 'evisa',
    entryType: 'single',
    validityPeriod: { value: 90, unit: 'days' },
    maximumStay:    { value: 30, unit: 'days' },
    extensionAvailable: false,
    processingTime: '3 working days',
    governmentFee: { amount: 25, currency: 'USD', status: 'VERIFICATION_REQUIRED' },
    eligibility: 'Fee sources conflict ($25 vs $60 depending on source) — confirm current fee on evisa.gov.az before quoting.',
    passportRequirements: 'Passport valid for at least 6 months.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Passport photo', required: true, critical: true, acceptedFormats: ['jpg','png'] },
    ],
    source: { sourceUrl: 'https://evisa.gov.az/', sourceTitle: 'Republic of Azerbaijan — Official Electronic Visa Portal', sourceType: 'ministry_of_foreign_affairs', lastVerifiedAt: new Date(), verifiedBy },
    ruleVersion: '2026.08',
  },
  {
    country: 'Azerbaijan', countrySlug: 'azerbaijan', productSlug: 'azerbaijan-evisa-express',
    officialVisaName: 'e-Visa (Express Processing)', visaCategory: 'tourist', travelDocumentType: 'evisa',
    entryType: 'single',
    validityPeriod: { value: 90, unit: 'days' },
    maximumStay:    { value: 30, unit: 'days' },
    extensionAvailable: false,
    processingTime: '~3 hours (where express service is available)',
    governmentFee: { amount: 60, currency: 'USD', status: 'VERIFICATION_REQUIRED' },
    eligibility: 'Same eligibility as standard e-Visa; express is a faster-processing option at a higher fee, offered where the official portal has express service available.',
    passportRequirements: 'Passport valid for at least 6 months.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Passport photo', required: true, critical: true, acceptedFormats: ['jpg','png'] },
    ],
    source: { sourceUrl: 'https://evisa.gov.az/', sourceTitle: 'Republic of Azerbaijan — Official Electronic Visa Portal', sourceType: 'ministry_of_foreign_affairs', lastVerifiedAt: new Date(), verifiedBy },
    ruleVersion: '2026.08',
  },

  // ── MOROCCO ──────────────────────────────────────────────
  {
    country: 'Morocco', countrySlug: 'morocco', productSlug: 'morocco-evisa',
    officialVisaName: 'e-Visa', visaCategory: 'tourist', travelDocumentType: 'evisa',
    entryType: 'single',
    validityPeriod: { value: 180, unit: 'days' },
    maximumStay:    { value: 30, unit: 'days' },
    extensionAvailable: false,
    processingTime: '3 business days (urgent: 24 hours)',
    governmentFee: { amount: 6113, currency: 'INR', status: 'VERIFICATION_REQUIRED' },
    eligibility: 'Domain for the official portal could not be independently confirmed with full confidence in this research pass (evis.ma referenced by secondary sources) — verify the correct official Moroccan e-visa domain before publishing.',
    passportRequirements: 'Passport valid for at least 6 months.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Passport photo', required: true, critical: true, acceptedFormats: ['jpg','png'] },
    ],
    source: { sourceUrl: 'https://evis.ma/', sourceTitle: 'Morocco e-Visa Portal (domain unconfirmed — verify)', sourceType: 'immigration_department', lastVerifiedAt: new Date(), verifiedBy },
    ruleVersion: '2026.08',
  },

  // ── TANZANIA ─────────────────────────────────────────────
  {
    country: 'Tanzania', countrySlug: 'tanzania', productSlug: 'tanzania-evisa-ordinary',
    officialVisaName: 'Ordinary eVisa', visaCategory: 'tourist', travelDocumentType: 'evisa',
    entryType: 'single',
    validityPeriod: { value: 90, unit: 'days' },
    maximumStay:    { value: 90, unit: 'days' },
    extensionAvailable: false,
    processingTime: '5-10 business days',
    governmentFee: { amount: 50, currency: 'USD', status: 'VERIFICATION_REQUIRED' },
    passportRequirements: 'Passport valid for at least 6 months with at least one unused visa page.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Passport photo', required: true, critical: true, acceptedFormats: ['jpg','png'] },
    ],
    source: { sourceUrl: 'https://eservices.immigration.go.tz/', sourceTitle: 'Tanzania Immigration Department — Official eVisa Portal', sourceType: 'immigration_department', lastVerifiedAt: new Date(), verifiedBy },
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
