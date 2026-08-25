/**
 * VisaRule batch 6 — Japan, South Africa, Ukraine, Uzbekistan, Armenia, Mongolia.
 * Same sourcing method as prior batches (web-search corroborated).
 * Run manually: MONGODB_URI="..." node utils/seedVisaRulesPilot6.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const VisaRule = require('../models/VisaRule');

const verifiedBy = 'Research pass (secondary-source corroborated, NOT a direct official-page fetch) — spot-check recommended';

const RULES = [
  // ── JAPAN ────────────────────────────────────────────────
  {
    country: 'Japan', countrySlug: 'japan', productSlug: 'japan-visa-single',
    officialVisaName: 'Tourist Visa (Single Entry)', visaCategory: 'tourist', travelDocumentType: 'consular_visa',
    entryType: 'single',
    validityPeriod: { value: 90, unit: 'days' },
    maximumStay:    { value: 90, unit: 'days' },
    extensionAvailable: false,
    processingTime: '5-7 business days (up to 10-15 in peak season)',
    governmentFee: { amount: 1300, currency: 'INR', status: 'VERIFICATION_REQUIRED' },
    onlineEVisaAvailable: false,
    separateProcessOffline: true,
    eligibility: 'Not a pure online eVisa — documents are submitted at VFS Japan in person/by courier; approved applications are issued as an e-visa (soft copy) rather than a passport sticker, but the submission process itself is offline. A separate VFS service fee applies on top of the embassy fee.',
    passportRequirements: 'Passport valid for the intended stay.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Passport photo', required: true, critical: true, acceptedFormats: ['jpg','png'] },
      { documentName: 'Itinerary / travel plan', required: true, critical: false },
      { documentName: 'Bank statement (financial proof)', required: true, critical: false },
    ],
    source: { sourceUrl: 'https://www.in.emb-japan.go.jp/itpr_en/Visa.html', sourceTitle: 'Embassy of Japan in India — Visa Information', sourceType: 'embassy_consulate', lastVerifiedAt: new Date(), verifiedBy },
    ruleVersion: '2026.08',
  },
  {
    country: 'Japan', countrySlug: 'japan', productSlug: 'japan-visa-multiple',
    officialVisaName: 'Tourist Visa (Multiple Entry, 1-5 years)', visaCategory: 'tourist', travelDocumentType: 'consular_visa',
    entryType: 'multiple',
    validityPeriod: { value: 5, unit: 'years' },
    maximumStay:    { value: 90, unit: 'days' },
    extensionAvailable: false,
    processingTime: '5-7 business days (up to 10-15 in peak season)',
    governmentFee: { amount: 2600, currency: 'INR', status: 'VERIFICATION_REQUIRED' },
    onlineEVisaAvailable: false,
    separateProcessOffline: true,
    eligibility: 'Actual granted validity (anywhere from 1 to 5 years) is at the Embassy\'s discretion based on applicant profile/travel history, not guaranteed at 5 years.',
    passportRequirements: 'Passport valid for the intended stay.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Passport photo', required: true, critical: true, acceptedFormats: ['jpg','png'] },
      { documentName: 'Itinerary / travel plan', required: true, critical: false },
      { documentName: 'Bank statement (financial proof)', required: true, critical: false },
    ],
    source: { sourceUrl: 'https://www.in.emb-japan.go.jp/itpr_en/Visa.html', sourceTitle: 'Embassy of Japan in India — Visa Information', sourceType: 'embassy_consulate', lastVerifiedAt: new Date(), verifiedBy },
    ruleVersion: '2026.08',
  },

  // ── SOUTH AFRICA ─────────────────────────────────────────
  {
    country: 'South Africa', countrySlug: 'south-africa', productSlug: 'south-africa-eta',
    officialVisaName: 'Electronic Travel Authorisation (ETA)', visaCategory: 'tourist', travelDocumentType: 'eta',
    entryType: 'single',
    validityPeriod: { value: 90, unit: 'days' },
    maximumStay:    { value: 90, unit: 'days' },
    extensionAvailable: false,
    processingTime: 'Not confirmed in this research pass',
    governmentFee: { amount: 500, currency: 'ZAR', status: 'VERIFICATION_REQUIRED' },
    eligibility: 'ETA launched Oct 2025 as a newer, simpler alternative to the eVisa for Indian nationals. IMPORTANT: only valid for entry via O.R. Tambo, Cape Town, or Lanseria airports — entry through any other port still requires the traditional eVisa or a consular visa.',
    passportRequirements: 'Passport valid for at least 30 days beyond intended departure, with at least 2 blank pages.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Passport photo', required: true, critical: true, acceptedFormats: ['jpg','png'] },
      { documentName: 'Proof of onward/return travel', required: true, critical: false },
    ],
    source: { sourceUrl: 'https://eta.dha.gov.za/', sourceTitle: 'South Africa Department of Home Affairs — Official ETA Portal', sourceType: 'immigration_department', lastVerifiedAt: new Date(), verifiedBy },
    ruleVersion: '2026.08',
  },

  // ── UKRAINE ──────────────────────────────────────────────
  {
    country: 'Ukraine', countrySlug: 'ukraine', productSlug: 'ukraine-evisa',
    officialVisaName: 'e-Visa (Single/Double Entry)', visaCategory: 'tourist', travelDocumentType: 'evisa',
    entryType: 'double',
    validityPeriod: { value: 30, unit: 'days' },
    maximumStay:    { value: 30, unit: 'days' },
    extensionAvailable: false,
    processingTime: 'Standard processing (exact SLA not confirmed in this research pass)',
    governmentFee: { amount: 30, currency: 'USD', status: 'VERIFICATION_REQUIRED' },
    eligibility: 'Ukraine\'s temporary visa-free regime for Indian travellers expired 30 January 2026 — Indian nationals now require this e-Visa. Note active regional conflict; strongly advise checking Indian MEA/embassy travel advisories before booking regardless of visa status.',
    passportRequirements: 'Passport valid for at least 3 months beyond intended stay.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Passport photo', required: true, critical: true, acceptedFormats: ['jpg','png'] },
      { documentName: 'Document confirming purpose of visit', required: true, critical: false },
    ],
    source: { sourceUrl: 'https://evisa.mfa.gov.ua/', sourceTitle: 'Ministry of Foreign Affairs of Ukraine — Official e-Visa Portal', sourceType: 'ministry_of_foreign_affairs', lastVerifiedAt: new Date(), verifiedBy },
    ruleVersion: '2026.08',
  },

  // ── UZBEKISTAN ───────────────────────────────────────────
  {
    country: 'Uzbekistan', countrySlug: 'uzbekistan', productSlug: 'uzbekistan-evisa',
    officialVisaName: 'e-Visa', visaCategory: 'tourist', travelDocumentType: 'evisa',
    entryType: 'single',
    validityPeriod: { value: 90, unit: 'days' },
    maximumStay:    { value: 30, unit: 'days' },
    extensionAvailable: false,
    processingTime: '2-3 business days',
    governmentFee: { amount: 20, currency: 'USD', status: 'VERIFICATION_REQUIRED' },
    passportRequirements: 'Passport valid for at least 3 months from intended arrival date.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Passport photo', required: true, critical: true, acceptedFormats: ['jpg','png'] },
    ],
    source: { sourceUrl: 'https://e-visa.gov.uz/', sourceTitle: 'Republic of Uzbekistan — Official e-Visa Portal', sourceType: 'ministry_of_foreign_affairs', lastVerifiedAt: new Date(), verifiedBy },
    ruleVersion: '2026.08',
  },

  // ── ARMENIA ──────────────────────────────────────────────
  {
    country: 'Armenia', countrySlug: 'armenia', productSlug: 'armenia-evisa-21-day',
    officialVisaName: 'e-Visa (21-Day, Single Entry)', visaCategory: 'tourist', travelDocumentType: 'evisa',
    entryType: 'single',
    validityPeriod: { value: 21, unit: 'days' },
    maximumStay:    { value: 21, unit: 'days' },
    extensionAvailable: false,
    processingTime: 'Up to 3 working days',
    governmentFee: { amount: 8, currency: 'USD', status: 'VERIFICATION_REQUIRED' },
    eligibility: 'Indian nationals must ALSO provide mandatory travel insurance AND either (a) a valid US/EU/UK visa or residence permit, OR (b) a supporting-documents package (return ticket, invitation letter, bank statement). This eligibility condition is commonly what commercial "Sureshot" service labels are actually assisting with — it is not a separate official visa category.',
    passportRequirements: 'Passport valid for at least 6 months.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Passport photo', required: true, critical: true, acceptedFormats: ['jpg','png'] },
      { documentName: 'Travel insurance', required: true, critical: true },
      { documentName: 'Valid US/EU/UK visa or residence permit', required: false, conditional: true, condition: 'Required unless applicant submits the alternate supporting-documents package', acceptedFormats: ['pdf'] },
      { documentName: 'Return ticket, invitation letter, bank statement (alternate route)', required: false, conditional: true, condition: 'Required only if applicant lacks a qualifying US/EU/UK visa or residence permit' },
    ],
    source: { sourceUrl: 'https://evisa.mfa.am/', sourceTitle: 'Ministry of Foreign Affairs of Armenia — Official e-Visa Portal', sourceType: 'ministry_of_foreign_affairs', lastVerifiedAt: new Date(), verifiedBy },
    ruleVersion: '2026.08',
  },

  // ── MONGOLIA ─────────────────────────────────────────────
  {
    country: 'Mongolia', countrySlug: 'mongolia', productSlug: 'mongolia-evisa',
    officialVisaName: 'e-Visa', visaCategory: 'tourist', travelDocumentType: 'evisa',
    entryType: 'single',
    validityPeriod: { value: 150, unit: 'days' },
    maximumStay:    { value: 30, unit: 'days' },
    extensionAvailable: false,
    processingTime: '3 working days',
    governmentFee: { amount: 53, currency: 'USD', status: 'VERIFICATION_REQUIRED' },
    eligibility: 'Fee sources conflict significantly ($5 to $53 across different sources) — confirm current fee on the official Mongolian Immigration Agency portal before quoting.',
    passportRequirements: 'Passport valid for at least 6 months from intended arrival date.',
    requiredDocuments: [
      { documentName: 'Passport bio-data page', required: true, critical: true, acceptedFormats: ['pdf','jpg'] },
      { documentName: 'Passport photo', required: true, critical: true, acceptedFormats: ['jpg','png'] },
    ],
    source: { sourceUrl: 'https://www.evisa.gov.mn/', sourceTitle: 'Immigration Agency of Mongolia — Official e-Visa Portal', sourceType: 'immigration_department', lastVerifiedAt: new Date(), verifiedBy },
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
