/**
 * One-off: mark "Sureshot"-labeled plans as agentOnly so they're hidden
 * from the public/B2C panel and only visible to logged-in agents/admin.
 * Run: MONGODB_URI="..." node utils/markAgentOnlyPlans.js
 */
const mongoose = require('mongoose');
const Visa = require('../models/Visa');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const visas = await Visa.find({ 'plans.label': /sureshot/i });
  let updated = 0;
  for (const visa of visas) {
    let changed = false;
    for (const plan of visa.plans) {
      if (/sureshot/i.test(plan.label) && !plan.agentOnly) {
        plan.agentOnly = true;
        changed = true;
      }
    }
    if (changed) {
      await visa.save();
      updated++;
      console.log(`Updated ${visa.country}: marked Sureshot plan(s) agentOnly`);
    }
  }
  console.log(`Done. ${updated} visa(s) updated.`);
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
