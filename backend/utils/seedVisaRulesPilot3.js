/**
 * VisaRule batch 3 — Qatar, Bahrain, Jordan, Singapore, Malaysia, Hong Kong.
 * Same sourcing method as prior batches: web-search corroborated across
 * multiple independent sources, not a raw fetch of JS-rendered official
 * portals. Seeded DRAFT; run promoteVisaRulesToActive.js (with these
 * slugs added) to go live.
 *
 * Run manually: MONGODB_URI="..." node utils/seedVisaRulesPilot3.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const VisaRule = require('../models/VisaRule');

const verifiedBy = 'Research pass (secondary-source corroborated, NOT a direct official-page fetch) — spot-check recommended';

const RULES = [
  // ── QATAR ────────────────────────────────────────────────
  {
    country: 'Qatar', countrySlug: 'qatar', productSlug: 'qatar-visa-free',
    officialVisaName: 'Visa-Free Entry (Tourism)', visaCategory: 'tourist', travelDocumentType: 'visa_free',
    entryType: 'single',
    validityPeriod: { value: 30, unit: 'days' },
    maximumStay:    { value: 30, unit: 'days' },
    extensionAvailable: true, extensionNote: 'One 30-day extension possible via Ministry of Interior before the first period expires.',
    processingTime: 'Instant on arrival',
    governmentFee: { amount: 0, currency: 'QAR', status: 'VERIFIED' },
    onlineEVisaAvailable: false,
    eligibility: 'Indian passport holders get visa-free entry for tourism, but MUST book a "Discover Qatar" visa-on-arrival hotel package before travel to use this facility.',
    passportRequirements: 'Passport valid for at least 6 months from date of entry.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Discover Qatar hotel booking confirmation', required: true, critical: true, officialReason: 'Mandatory prerequisite to use visa-free entry' },
      { documentName: 'Proof of onward/return travel', required: true, critical: false },
    ],
    source: { sourceUrl: 'https://hayya.qa/', sourceTitle: 'Hayya to Qatar — Official Entry Portal', sourceType: 'immigration_department', lastVerifiedAt: new Date(), verifiedBy },
    ruleVersion: '2026.08',
  },
  {
    country: 'Qatar', countrySlug: 'qatar', productSlug: 'qatar-hayya-a1-evisa',
    officialVisaName: 'Hayya A1 eVisa', visaCategory: 'tourist', travelDocumentType: 'evisa',
    entryType: 'single',
    validityPeriod: { value: 90, unit: 'days' },
    maximumStay:    { value: 30, unit: 'days' },
    extensionAvailable: true, extensionNote: 'One 30-day extension possible via MOI before the first period expires.',
    processingTime: '24-48 hours',
    governmentFee: { amount: 100, currency: 'QAR', status: 'VERIFICATION_REQUIRED' },
    eligibility: 'Available to Indian nationals as an alternative to visa-free entry, applied through hayya.qa.',
    passportRequirements: 'Passport valid for at least 6 months from date of entry.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Passport photo', required: true, critical: true, acceptedFormats: ['jpg','png'] },
    ],
    source: { sourceUrl: 'https://hayya.qa/', sourceTitle: 'Hayya to Qatar — Official Entry Portal', sourceType: 'immigration_department', lastVerifiedAt: new Date(), verifiedBy },
    ruleVersion: '2026.08',
  },

  // ── BAHRAIN ──────────────────────────────────────────────
  {
    country: 'Bahrain', countrySlug: 'bahrain', productSlug: 'bahrain-evisa-14-day',
    officialVisaName: '14-Day eVisa (Single Entry)', visaCategory: 'tourist', travelDocumentType: 'evisa',
    entryType: 'single',
    validityPeriod: { value: 14, unit: 'days' },
    maximumStay:    { value: 14, unit: 'days' },
    extensionAvailable: false,
    processingTime: '3-5 business days',
    governmentFee: { amount: 9, currency: 'BHD', status: 'VERIFICATION_REQUIRED' },
    eligibility: 'Eligible nationalities per the official Bahrain eVisa portal list.',
    passportRequirements: 'Passport valid for at least 6 months.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Passport photo', required: true, critical: true, acceptedFormats: ['jpg','png'] },
      { documentName: 'Confirmed return ticket', required: true, critical: false },
    ],
    source: { sourceUrl: 'https://www.evisa.gov.bh/', sourceTitle: 'Kingdom of Bahrain — Official eVisa Portal', sourceType: 'immigration_department', lastVerifiedAt: new Date(), verifiedBy },
    ruleVersion: '2026.08',
  },
  {
    country: 'Bahrain', countrySlug: 'bahrain', productSlug: 'bahrain-evisa-1-year-multiple',
    officialVisaName: '1-Year Multiple-Entry eVisa', visaCategory: 'tourist', travelDocumentType: 'evisa',
    entryType: 'multiple',
    validityPeriod: { value: 1, unit: 'years' },
    maximumStay:    { value: 90, unit: 'days' },
    extensionAvailable: false,
    processingTime: '3-5 business days',
    governmentFee: { amount: 45, currency: 'BHD', status: 'VERIFICATION_REQUIRED' },
    eligibility: 'Eligible nationalities per the official Bahrain eVisa portal list.',
    passportRequirements: 'Passport valid for at least 6 months.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Passport photo', required: true, critical: true, acceptedFormats: ['jpg','png'] },
    ],
    source: { sourceUrl: 'https://www.evisa.gov.bh/', sourceTitle: 'Kingdom of Bahrain — Official eVisa Portal', sourceType: 'immigration_department', lastVerifiedAt: new Date(), verifiedBy },
    ruleVersion: '2026.08',
  },

  // ── JORDAN ───────────────────────────────────────────────
  {
    country: 'Jordan', countrySlug: 'jordan', productSlug: 'jordan-evisa',
    officialVisaName: 'eVisa', visaCategory: 'tourist', travelDocumentType: 'evisa',
    entryType: 'single',
    validityPeriod: { value: 3, unit: 'months' },
    maximumStay:    { value: 30, unit: 'days' },
    extensionAvailable: false,
    processingTime: 'Several business days (varies)',
    governmentFee: { amount: 23, currency: 'USD', status: 'VERIFICATION_REQUIRED' },
    eligibility: 'IMPORTANT: Indian passport holders do NOT automatically qualify. Eligibility requires ONE of: a valid residence permit from a GCC country (UAE, Saudi Arabia, Qatar, Bahrain, Kuwait, Oman), OR a valid Schengen/US/UK visa, OR an EU residence permit. Verify against a specific applicant before selling this product.',
    passportRequirements: 'Passport valid for at least 6 months beyond planned entry date.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Proof of GCC residence / Schengen / US / UK visa (whichever qualifies)', required: true, critical: true, officialReason: 'Mandatory eligibility proof for Indian nationals' },
    ],
    source: { sourceUrl: 'https://www.visitjordan.com/', sourceTitle: 'Jordan Tourism Board / MOI eVisa', sourceType: 'ministry_of_foreign_affairs', lastVerifiedAt: new Date(), verifiedBy },
    ruleVersion: '2026.08',
  },

  // ── SINGAPORE ────────────────────────────────────────────
  {
    country: 'Singapore', countrySlug: 'singapore', productSlug: 'singapore-visit-visa',
    officialVisaName: 'Visit Visa (Form 14A)', visaCategory: 'tourist', travelDocumentType: 'consular_visa',
    entryType: 'single',
    validityPeriod: { value: 30, unit: 'days' },
    maximumStay:    { value: 30, unit: 'days' },
    extensionAvailable: false,
    processingTime: '3-5 business days',
    governmentFee: { amount: 2100, currency: 'INR', status: 'VERIFICATION_REQUIRED' },
    onlineEVisaAvailable: false,
    separateProcessOffline: true,
    eligibility: 'Mandatory for all Indian ordinary-passport holders — no visa-free or visa-on-arrival option. Indian nationals CANNOT apply directly to ICA and must go through an authorized visa agent (e.g. VFS Global, IVS Global) or a local Singapore sponsor. Visayatri is NOT an authorized Singapore visa agent — this is Official Portal Assistance only, submitted through the authorized agent network.',
    passportRequirements: 'Passport valid for at least 6 months.',
    photoRequirements: '2 photos, 35mm x 45mm, white background.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Form 14A (signed)', required: true, critical: true },
      { documentName: '2 passport photos (35mm x 45mm)', required: true, critical: true },
    ],
    source: { sourceUrl: 'https://www.ica.gov.sg/enter-transit-depart/entering-singapore/visa_requirements/visa-detail-page/india', sourceTitle: 'Immigration & Checkpoints Authority (ICA) Singapore — India visa requirements', sourceType: 'immigration_department', lastVerifiedAt: new Date(), verifiedBy },
    ruleVersion: '2026.08',
  },

  // ── MALAYSIA ─────────────────────────────────────────────
  {
    country: 'Malaysia', countrySlug: 'malaysia', productSlug: 'malaysia-visa-exemption',
    officialVisaName: 'Visa Exemption (Tourism/Business/Social/Transit)', visaCategory: 'tourist', travelDocumentType: 'visa_free',
    entryType: 'single',
    validityPeriod: { value: 30, unit: 'days' },
    maximumStay:    { value: 30, unit: 'days' },
    extensionAvailable: false,
    processingTime: 'N/A — visa-free',
    governmentFee: { amount: 0, currency: 'MYR', status: 'VERIFIED' },
    onlineEVisaAvailable: false,
    eligibility: 'Indian nationals are currently visa-exempt for tourism/business/social/transit purposes, for stays up to 30 days. This waiver is time-bound — announced through 31 December 2026 — and must be re-checked closer to travel in case it is not renewed.',
    passportRequirements: 'Passport valid for more than 6 months.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
    ],
    source: { sourceUrl: 'https://www.imi.gov.my/', sourceTitle: 'Malaysian Immigration Department', sourceType: 'immigration_department', lastVerifiedAt: new Date(), verifiedBy },
    ruleVersion: '2026.08',
  },
  {
    country: 'Malaysia', countrySlug: 'malaysia', productSlug: 'malaysia-evisa',
    officialVisaName: 'eVisa', visaCategory: 'tourist', travelDocumentType: 'evisa',
    entryType: 'single',
    validityPeriod: { value: 3, unit: 'months' },
    maximumStay:    { value: 30, unit: 'days' },
    extensionAvailable: false,
    processingTime: '3-5 business days',
    governmentFee: { amount: 88, currency: 'MYR', status: 'VERIFICATION_REQUIRED' },
    eligibility: 'Optional alternative to visa-free entry (e.g. for applicants who want pre-approval, or if the exemption lapses).',
    passportRequirements: 'Passport valid for more than 6 months.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Passport photo', required: true, critical: true, acceptedFormats: ['jpg','png'] },
    ],
    source: { sourceUrl: 'https://malaysiavisa.imi.gov.my/evisa/evisa.jsp', sourceTitle: 'Malaysian Immigration Department — Official eVisa', sourceType: 'immigration_department', lastVerifiedAt: new Date(), verifiedBy },
    ruleVersion: '2026.08',
  },
  {
    country: 'Malaysia', countrySlug: 'malaysia', productSlug: 'malaysia-mdac',
    officialVisaName: 'Malaysia Digital Arrival Card (MDAC)', visaCategory: 'other', travelDocumentType: 'arrival_card',
    entryType: 'single',
    validityPeriod: { value: 1, unit: 'days' },
    maximumStay:    { value: 0, unit: 'days' },
    extensionAvailable: false,
    processingTime: 'Instant (submit within 3 days before arrival)',
    governmentFee: { amount: 0, currency: 'MYR', status: 'VERIFIED' },
    onlineEVisaAvailable: false,
    eligibility: 'Mandatory arrival declaration for ALL foreign nationals entering Malaysia, regardless of visa status. NOT a visa.',
    requiredDocuments: [
      { documentName: 'Passport details', required: true, critical: true },
      { documentName: 'Flight/arrival details', required: true, critical: true },
      { documentName: 'Accommodation address in Malaysia', required: true, critical: true },
    ],
    source: { sourceUrl: 'https://imigresen-online.imi.gov.my/mdac/main', sourceTitle: 'Malaysian Immigration Department — MDAC', sourceType: 'immigration_department', lastVerifiedAt: new Date(), verifiedBy },
    ruleVersion: '2026.08',
  },

  // ── HONG KONG ────────────────────────────────────────────
  {
    country: 'Hong Kong', countrySlug: 'hong-kong', productSlug: 'hong-kong-par',
    officialVisaName: 'Pre-Arrival Registration (PAR)', visaCategory: 'tourist', travelDocumentType: 'travel_authorization',
    entryType: 'multiple',
    validityPeriod: { value: 6, unit: 'months' },
    maximumStay:    { value: 14, unit: 'days' },
    extensionAvailable: false,
    processingTime: 'Instant',
    governmentFee: { amount: 0, currency: 'HKD', status: 'VERIFIED' },
    eligibility: 'For Indian passport holders visiting up to 14 days (not for work/study/settlement/stays over 14 days, which require a full visa). Valid 6 months, multiple entries, each capped at 14 days.',
    passportRequirements: 'Passport valid for at least 6 months.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page scan', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Recent photo', required: true, critical: true, acceptedFormats: ['jpg','png'] },
      { documentName: 'Travel plan / itinerary', required: true, critical: false },
      { documentName: 'Contact address in Hong Kong (hotel accepted)', required: true, critical: true },
    ],
    source: { sourceUrl: 'https://www.immd.gov.hk/', sourceTitle: 'Hong Kong Immigration Department — Pre-Arrival Registration', sourceType: 'immigration_department', lastVerifiedAt: new Date(), verifiedBy },
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
