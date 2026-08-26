const Visa = require('../models/Visa');

async function makeVisa() {
  return Visa.create({
    country: 'Armenia', slug: `armenia-${Date.now()}-${Math.random()}`,
    flag: '🇦🇲', region: 'others',
    plans: [
      { label: '21 Days', basePrice: 1000, agentPrice: 1200, publicPrice: 1500 },
      { label: '21 Days Sureshot', basePrice: 25000, agentPrice: 27000, publicPrice: 30000, agentOnly: true },
    ],
    processingTime: '3-5 days', visaType: 'E-Visa',
  });
}

describe('Visa.forRole — agentOnly plan visibility', () => {
  it('excludes agentOnly plans for public role', async () => {
    const visa = await makeVisa();
    const shaped = visa.forRole('public');
    expect(shaped.plans.map(p => p.label)).toEqual(['21 Days']);
  });

  it('excludes agentOnly plans for a logged-in user role', async () => {
    const visa = await makeVisa();
    const shaped = visa.forRole('user');
    expect(shaped.plans.map(p => p.label)).toEqual(['21 Days']);
  });

  it('includes agentOnly plans for agent role', async () => {
    const visa = await makeVisa();
    const shaped = visa.forRole('agent');
    expect(shaped.plans.map(p => p.label)).toEqual(['21 Days', '21 Days Sureshot']);
  });

  it('includes agentOnly plans for admin role, with agentOnly flag exposed', async () => {
    const visa = await makeVisa();
    const shaped = visa.forRole('admin');
    expect(shaped.plans.map(p => p.label)).toEqual(['21 Days', '21 Days Sureshot']);
    expect(shaped.plans[1].agentOnly).toBe(true);
  });
});
