/**
 * Promotes the pilot VisaRule set (Oman, Vietnam, Thailand, Saudi Arabia)
 * from DRAFT to ACTIVE + HUMAN_REVIEWED, making them visible on the public
 * GET /api/visa-rules/:countrySlug endpoint.
 *
 * The owner explicitly chose to launch on the research-pass data now and
 * spot-check afterward rather than blocking on a manual re-verification
 * first (2026-08-26). That decision is recorded in `verifiedBy` on each
 * rule so the audit trail stays honest about what "reviewed" means here.
 *
 * Run manually: MONGODB_URI="..." node utils/promoteVisaRulesToActive.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const VisaRule = require('../models/VisaRule');

const PILOT_COUNTRIES = ['oman', 'vietnam', 'thailand', 'saudi-arabia'];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const result = await VisaRule.updateMany(
    { countrySlug: { $in: PILOT_COUNTRIES }, status: 'DRAFT' },
    {
      $set: {
        status: 'ACTIVE',
        verificationStatus: 'HUMAN_REVIEWED',
        'source.verifiedBy': 'Owner-authorized launch on research-pass data (2026-08-26); spot-check pending',
      },
    },
  );

  console.log(`Promoted ${result.modifiedCount} rules to ACTIVE / HUMAN_REVIEWED.`);
  process.exit(0);
}

run().catch(err => { console.error('Promote failed:', err.message); process.exit(1); });
