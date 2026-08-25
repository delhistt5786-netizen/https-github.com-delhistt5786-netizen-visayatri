/**
 * Portal mappings — the ONLY place field selectors live (section 30: "Store
 * mappings in configuration. Do not hard-code mappings throughout extension
 * code."). Add a new country by adding an entry here; content.js and
 * background.js never hard-code a selector.
 *
 * ⚠️ IMPORTANT — READ BEFORE USING ⚠️
 * The Vietnam selectors below are BEST-GUESS PLACEHOLDERS, not verified
 * against the live evisa.xuatnhapcanh.gov.vn DOM. They were written without
 * being able to inspect the real page (no live browser access when this was
 * built). The extension's own portal-change-detection (content.js,
 * `findField`) is specifically designed to make this safe: if a selector
 * doesn't match anything on the real page, that field is SKIPPED and
 * reported as "not found" rather than silently failing or filling the
 * wrong element — but the assistant will be close to useless on Vietnam's
 * real form until someone opens the actual portal, inspects the real field
 * names/ids with browser devtools, and updates the selectors below.
 *
 * How to verify/update a mapping:
 *   1. Open the live portal, right-click the field → Inspect.
 *   2. Note its `name`, `id`, or a stable CSS selector.
 *   3. Replace the `selector` value below. Prefer `name`/`id` attributes
 *      over generated class names, which change on every framework rebuild.
 */

const PORTAL_MAPPINGS = {
  'evisa.xuatnhapcanh.gov.vn': {
    country: 'Vietnam',
    countrySlug: 'vietnam',
    verified: false, // flip to true only after a real inspection pass confirms every selector below
    fields: [
      // Visayatri field  → { selector, type, source: applicant field name on Application }
      { visayatriField: 'firstName',       selector: 'input[name="firstName"], input[name="givenName"], #firstName',   type: 'text', appField: 'applicantName' /* split needed */ },
      { visayatriField: 'lastName',        selector: 'input[name="lastName"], input[name="surname"], #lastName',       type: 'text', appField: 'applicantName' /* split needed */ },
      { visayatriField: 'passportNumber',  selector: 'input[name="passportNumber"], #passportNumber',                  type: 'text', appField: 'passportNumber' },
      { visayatriField: 'dateOfBirth',     selector: 'input[name="dateOfBirth"], #dateOfBirth',                        type: 'date', appField: 'dateOfBirth' },
      { visayatriField: 'nationality',     selector: 'select[name="nationality"], #nationality',                       type: 'select', appField: 'nationality' },
      { visayatriField: 'passportExpiry',  selector: 'input[name="passportExpiry"], #passportExpiryDate',              type: 'date', appField: 'passportExpiry' },
      { visayatriField: 'email',           selector: 'input[name="email"], #email',                                    type: 'text', appField: 'applicantEmail' },
      { visayatriField: 'phone',           selector: 'input[name="phone"], #phoneNumber',                              type: 'text', appField: 'applicantPhone' },
      { visayatriField: 'travelDate',      selector: 'input[name="intendedEntryDate"], #entryDate',                    type: 'date', appField: 'travelDate' },
      { visayatriField: 'purposeOfVisit',  selector: 'select[name="purposeOfEntry"], #purpose',                        type: 'select', appField: 'purposeOfVisit' },
    ],
    // Heuristics for detecting a stop-condition on THIS portal. Generic
    // heuristics also run (see content.js STOP_CONDITION_HEURISTICS) — these
    // are portal-specific additions/overrides if the generic ones miss
    // something on this particular site.
    stopConditionSelectors: {
      captcha: 'iframe[src*="recaptcha"], .g-recaptcha, [class*="captcha" i]',
      otp: 'input[name*="otp" i], input[placeholder*="otp" i], input[name*="verification" i]',
      payment: 'iframe[src*="payment"], [class*="payment" i] button[type="submit"]',
    },
  },

  // Add the next portal here, e.g.:
  // 'evisa.rop.gov.om': { country: 'Oman', countrySlug: 'oman', verified: false, fields: [...] },
};

if (typeof module !== 'undefined') module.exports = PORTAL_MAPPINGS;
