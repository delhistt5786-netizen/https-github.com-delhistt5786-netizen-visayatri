/**
 * Portal mappings — the ONLY place field selectors live (section 30: "Store
 * mappings in configuration. Do not hard-code mappings throughout extension
 * code."). Add/update a country by editing an entry here; content.js and
 * background.js never hard-code a selector.
 *
 * ⚠️ IMPORTANT — READ BEFORE USING ⚠️
 * EVERY entry below has `verified: false`. None of these selectors have
 * been checked against the real, live DOM of the portal they target — this
 * was built without live browser access to any of these 35 government
 * sites. They're a consistent best-guess pattern (common field name/id
 * conventions) so the extension has *something* to try, combined with
 * content.js's "field not found → report, don't guess" safety net
 * (section 37), which is what makes shipping unverified guesses safe
 * rather than reckless.
 *
 * Treat this file as 35 TODOs, not 35 finished integrations. Vietnam's
 * entry has the fullest field set as the worked pilot example; the rest
 * intentionally start smaller (name, passport number, DOB, nationality)
 * since guessing an ever-longer list of fields for a page nobody has
 * inspected adds volume, not value.
 *
 * How to verify/update a mapping:
 *   1. Open the live portal, get to the actual application form.
 *   2. Right-click each field → Inspect. Note its `name` or `id`
 *      attribute (prefer these over CSS classes, which change whenever
 *      the site's frontend framework rebuilds).
 *   3. Replace the `selector` value(s) below.
 *   4. Test with a real (or clearly test) application via the popup.
 *   5. Only then flip that entry's `verified` to `true`.
 *
 * Countries intentionally NOT included (no fillable online form to
 * assist with — see each VisaRule.travelDocumentType/eligibility for why):
 *   - Japan (VFS in-person/courier submission, not a self-serve web form)
 *   - Singapore (submitted via an authorized agent network, not directly)
 *   - Cuba (no official portal could be confidently identified in research)
 */

const COMMON_FIELDS = [
  { visayatriField: 'firstName',      selector: 'input[name="firstName"], input[name="givenName"], input[name="givenNames"], #firstName',   type: 'text', appField: 'applicantName' },
  { visayatriField: 'lastName',       selector: 'input[name="lastName"], input[name="surname"], #lastName',                                   type: 'text', appField: 'applicantName' },
  { visayatriField: 'passportNumber', selector: 'input[name="passportNumber"], input[name="passportNo"], #passportNumber',                    type: 'text', appField: 'passportNumber' },
  { visayatriField: 'dateOfBirth',    selector: 'input[name="dateOfBirth"], input[name="dob"], #dateOfBirth',                                 type: 'date', appField: 'dateOfBirth' },
  { visayatriField: 'nationality',    selector: 'select[name="nationality"], #nationality',                                                    type: 'select', appField: 'nationality' },
];

const EXTENDED_FIELDS = [
  ...COMMON_FIELDS,
  { visayatriField: 'passportExpiry', selector: 'input[name="passportExpiry"], input[name="passportExpiryDate"], #passportExpiryDate',        type: 'date', appField: 'passportExpiry' },
  { visayatriField: 'email',          selector: 'input[name="email"], #email',                                                                 type: 'text', appField: 'applicantEmail' },
  { visayatriField: 'phone',          selector: 'input[name="phone"], input[name="phoneNumber"], #phoneNumber',                                type: 'text', appField: 'applicantPhone' },
  { visayatriField: 'travelDate',     selector: 'input[name="intendedEntryDate"], input[name="arrivalDate"], input[name="travelDate"], #entryDate', type: 'date', appField: 'travelDate' },
  { visayatriField: 'purposeOfVisit', selector: 'select[name="purposeOfEntry"], select[name="purpose"], #purpose',                             type: 'select', appField: 'purposeOfVisit' },
];

const GENERIC_STOP_OVERRIDES = {
  captcha: 'iframe[src*="recaptcha"], .g-recaptcha, [class*="captcha" i]',
  otp: 'input[name*="otp" i], input[placeholder*="otp" i]',
  payment: 'iframe[src*="payment" i], [class*="payment" i] button[type="submit"]',
};

function entry(country, countrySlug, fields = EXTENDED_FIELDS) {
  return { country, countrySlug, verified: false, fields, stopConditionSelectors: GENERIC_STOP_OVERRIDES };
}

const PORTAL_MAPPINGS = {
  // ── Pilot (built first, see README for the full worked example) ──
  'evisa.xuatnhapcanh.gov.vn': entry('Vietnam', 'vietnam'),

  // ── Middle East ──────────────────────────────────────────
  'evisa.rop.gov.om':        entry('Oman', 'oman'),
  'hayya.qa':                entry('Qatar', 'qatar'),
  'www.evisa.gov.bh':        entry('Bahrain', 'bahrain'),
  'visa.visitsaudi.com':     entry('Saudi Arabia', 'saudi-arabia'),

  // ── Asia ─────────────────────────────────────────────────
  'evisa.kdmid.ru':          entry('Russia', 'russia'),
  'evisa.imigrasi.go.id':    entry('Indonesia', 'indonesia'),
  'www.evisa.gov.kh':        entry('Cambodia', 'cambodia'),
  'www.thaievisa.go.th':     entry('Thailand', 'thailand'),
  'tdac.immigration.go.th':  entry('Thailand', 'thailand', COMMON_FIELDS), // TDAC arrival card, different field set
  'malaysiavisa.imi.gov.my': entry('Malaysia', 'malaysia'),
  'imigresen-online.imi.gov.my': entry('Malaysia', 'malaysia', COMMON_FIELDS), // MDAC arrival card
  'www.immd.gov.hk':         entry('Hong Kong', 'hong-kong', COMMON_FIELDS),
  'www.evisa.e-gov.kg':      entry('Kyrgyzstan', 'kyrgyzstan'),
  'www.evisa.tj':            entry('Tajikistan', 'tajikistan'),
  'e-visa.gov.uz':           entry('Uzbekistan', 'uzbekistan'),
  'eta.gov.lk':              entry('Sri Lanka', 'sri-lanka'),
  'www.evisa.gov.mn':        entry('Mongolia', 'mongolia'),
  'laoevisa.gov.la':         entry('Laos', 'laos'),
  'evisa.mfa.am':            entry('Armenia', 'armenia'),
  'evisa.gov.az':            entry('Azerbaijan', 'azerbaijan'),
  'evisa.mfa.gov.ua':        entry('Ukraine', 'ukraine'),
  'evisa.ica.gov.pg':        entry('Papua New Guinea', 'papua-new-guinea'),

  // ── Africa ───────────────────────────────────────────────
  'visa2egypt.gov.eg':       entry('Egypt', 'egypt'),
  'evis.ma':                 entry('Morocco', 'morocco'),
  'www.evisa.gov.et':        entry('Ethiopia', 'ethiopia'),
  'visas.immigration.go.ug': entry('Uganda', 'uganda'),
  'www.evisa.gov.zw':        entry('Zimbabwe', 'zimbabwe'),
  'etakenya.go.ke':          entry('Kenya', 'kenya'),
  'eservices.immigration.go.tz': entry('Tanzania', 'tanzania'),
  'eta.dha.gov.za':          entry('South Africa', 'south-africa'),
  'eservices.zambiaimmigration.gov.zm': entry('Zambia', 'zambia'),
  'evisamada.gov.mg':        entry('Madagascar', 'madagascar'),

  // ── Americas ─────────────────────────────────────────────
  // Argentina's AVE portal domain wasn't confidently identified in research
  // (only the embassy info page was found) — left out until that's found.
};

if (typeof module !== 'undefined') module.exports = PORTAL_MAPPINGS;
