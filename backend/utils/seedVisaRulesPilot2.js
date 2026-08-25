/**
 * Pilot data for the VisaRule engine — Vietnam, Thailand, Saudi Arabia.
 * Same sourcing caveat as utils/seedVisaRulesOman.js: web-search
 * corroborated across multiple independent sources, not a raw fetch of
 * the JS-rendered official portals. Owner has authorized promoting these
 * straight to ACTIVE (see promoteVisaRulesToActive.js) rather than
 * blocking on a manual page-by-page re-check first — revisit if any
 * figure looks off.
 *
 * Run manually: MONGODB_URI="..." node utils/seedVisaRulesPilot2.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const VisaRule = require('../models/VisaRule');

const verifiedBy = 'Research pass (secondary-source corroborated, NOT a direct official-page fetch) — spot-check recommended';

const RULES = [
  // ── VIETNAM ──────────────────────────────────────────────
  {
    country: 'Vietnam', countrySlug: 'vietnam', productSlug: 'vietnam-evisa-single',
    officialVisaName: 'e-Visa (Single Entry)', visaCategory: 'tourist', travelDocumentType: 'evisa',
    entryType: 'single',
    validityPeriod: { value: 90, unit: 'days' },
    maximumStay:    { value: 90, unit: 'days' },
    extensionAvailable: false,
    processingTime: '3 business days',
    governmentFee: { amount: 25, currency: 'USD', status: 'VERIFIED' },
    eligibility: 'Citizens of eligible countries per the National Portal on Immigration list.',
    passportRequirements: 'Passport valid for at least 6 months.',
    photoRequirements: 'Recent passport-style portrait photo, uploaded digitally.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Digital portrait photo', required: true, critical: true, acceptedFormats: ['jpg','png'] },
    ],
    source: {
      sourceUrl: 'https://evisa.xuatnhapcanh.gov.vn/trang-chu-ttdt',
      sourceTitle: 'Vietnam National Portal on Immigration — e-Visa',
      sourceType: 'immigration_department', lastVerifiedAt: new Date(), verifiedBy,
    },
    ruleVersion: '2026.08',
  },
  {
    country: 'Vietnam', countrySlug: 'vietnam', productSlug: 'vietnam-evisa-multiple',
    officialVisaName: 'e-Visa (Multiple Entry)', visaCategory: 'tourist', travelDocumentType: 'evisa',
    entryType: 'multiple',
    validityPeriod: { value: 90, unit: 'days' },
    maximumStay:    { value: 90, unit: 'days' },
    extensionAvailable: false,
    processingTime: '3 business days',
    governmentFee: { amount: 50, currency: 'USD', status: 'VERIFIED' },
    eligibility: 'Citizens of eligible countries per the National Portal on Immigration list.',
    passportRequirements: 'Passport valid for at least 6 months.',
    photoRequirements: 'Recent passport-style portrait photo, uploaded digitally.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Digital portrait photo', required: true, critical: true, acceptedFormats: ['jpg','png'] },
    ],
    source: {
      sourceUrl: 'https://evisa.xuatnhapcanh.gov.vn/trang-chu-ttdt',
      sourceTitle: 'Vietnam National Portal on Immigration — e-Visa',
      sourceType: 'immigration_department', lastVerifiedAt: new Date(), verifiedBy,
    },
    ruleVersion: '2026.08',
  },

  // ── THAILAND ─────────────────────────────────────────────
  {
    country: 'Thailand', countrySlug: 'thailand', productSlug: 'thailand-tourist-evisa',
    officialVisaName: 'Tourist eVisa', visaCategory: 'tourist', travelDocumentType: 'evisa',
    entryType: 'single',
    validityPeriod: { value: 3, unit: 'months' },
    maximumStay:    { value: 60, unit: 'days' },
    extensionAvailable: true,
    extensionNote: 'A single 30-day extension is available in-country via Thai Immigration, subject to their discretion.',
    processingTime: 'Several business days (varies)',
    governmentFee: { amount: 74, currency: 'USD', status: 'VERIFICATION_REQUIRED' },
    eligibility: 'Indian nationals: current policy is in transition — a 30-day visa exemption was cabinet-approved in July 2026 but was still pending Royal Gazette publication as of this research. Until published, Indian travellers use either Visa on Arrival (up to 15 days) or this Tourist eVisa (up to 60 days). Re-check status before advising customers.',
    passportRequirements: 'Passport valid for at least 6 months.',
    photoRequirements: 'Recent passport-style photo per portal specification.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Passport photo', required: true, critical: true, acceptedFormats: ['jpg','png'] },
      { documentName: 'Proof of accommodation', required: true, critical: false },
      { documentName: 'Proof of onward/return travel', required: true, critical: false },
      { documentName: 'Proof of sufficient funds', required: false, conditional: true, condition: 'May be requested by immigration officer' },
    ],
    source: {
      sourceUrl: 'https://www.thaievisa.go.th/',
      sourceTitle: 'Ministry of Foreign Affairs of Thailand — Thailand eVisa',
      sourceType: 'ministry_of_foreign_affairs', lastVerifiedAt: new Date(), verifiedBy,
    },
    ruleVersion: '2026.08',
  },
  {
    country: 'Thailand', countrySlug: 'thailand', productSlug: 'thailand-tdac',
    officialVisaName: 'Thailand Digital Arrival Card (TDAC)', visaCategory: 'other', travelDocumentType: 'arrival_card',
    entryType: 'single',
    validityPeriod: { value: 1, unit: 'days' }, // single-trip declaration, not a stay-granting document
    maximumStay:    { value: 0, unit: 'days' }, // TDAC grants no stay itself — it's a mandatory arrival declaration
    extensionAvailable: false,
    processingTime: 'Instant (submit within 72 hours before arrival)',
    governmentFee: { amount: 0, currency: 'THB', status: 'VERIFIED' },
    onlineEVisaAvailable: false,
    eligibility: 'Mandatory for ALL non-Thai nationals entering Thailand, regardless of visa type or exemption status. NOT a visa — a free digital arrival declaration that replaces the old paper TM6 card.',
    requiredDocuments: [
      { documentName: 'Passport details', required: true, critical: true },
      { documentName: 'Flight/arrival details', required: true, critical: true },
      { documentName: 'Accommodation address in Thailand', required: true, critical: true },
    ],
    source: {
      sourceUrl: 'https://tdac.immigration.go.th/',
      sourceTitle: 'Thailand Immigration Bureau — Digital Arrival Card',
      sourceType: 'immigration_department', lastVerifiedAt: new Date(), verifiedBy,
    },
    ruleVersion: '2026.08',
  },

  // ── SAUDI ARABIA ─────────────────────────────────────────
  {
    country: 'Saudi Arabia', countrySlug: 'saudi-arabia', productSlug: 'saudi-tourist-evisa',
    officialVisaName: 'Tourist eVisa', visaCategory: 'tourist', travelDocumentType: 'evisa',
    entryType: 'multiple',
    validityPeriod: { value: 1, unit: 'years' },
    maximumStay:    { value: 90, unit: 'days' },
    extensionAvailable: false,
    processingTime: '5-30 minutes (online, typically same-day)',
    governmentFee: { amount: 535, currency: 'SAR', status: 'VERIFICATION_REQUIRED' },
    eligibility: 'Citizens of ~66 eligible countries per the official Visit Saudi eVisa portal.',
    passportRequirements: 'Passport valid for at least 6 months.',
    photoRequirements: 'Recent passport-style photo, white background.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Passport photo', required: true, critical: true, acceptedFormats: ['jpg','png'] },
      { documentName: 'Travel health insurance', required: true, critical: true, officialReason: 'Bundled into the official eVisa fee as mandatory travel insurance' },
    ],
    source: {
      sourceUrl: 'https://visa.visitsaudi.com/',
      sourceTitle: 'Saudi Ministry of Tourism — Official eVisa Portal',
      sourceType: 'tourism_authority', lastVerifiedAt: new Date(), verifiedBy,
    },
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
