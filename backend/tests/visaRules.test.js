const request = require('supertest');
const app = require('../app');
const VisaRule = require('../models/VisaRule');

const baseRule = {
  country: 'Oman', countrySlug: 'oman', productSlug: 'oman-10-day',
  officialVisaName: '10-Day Tourist eVisa', entryType: 'single',
  validityPeriod: { value: 10, unit: 'days' }, maximumStay: { value: 10, unit: 'days' },
  governmentFee: { amount: 5, currency: 'OMR', status: 'VERIFICATION_REQUIRED' },
  source: {
    sourceUrl: 'https://evisa.rop.gov.om/', sourceTitle: 'Royal Oman Police',
    sourceType: 'immigration_department', lastVerifiedAt: new Date(),
  },
  ruleVersion: '2026.08',
};

describe('GET /api/visa-rules/:countrySlug', () => {
  it('never returns a DRAFT / unverified rule — customers only see reviewed data', async () => {
    await VisaRule.create({ ...baseRule, status: 'DRAFT', verificationStatus: 'OFFICIAL_VERIFICATION_REQUIRED' });
    const res = await request(app).get('/api/visa-rules/oman');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it('returns an ACTIVE + HUMAN_REVIEWED rule', async () => {
    await VisaRule.create({ ...baseRule, status: 'ACTIVE', verificationStatus: 'HUMAN_REVIEWED' });
    const res = await request(app).get('/api/visa-rules/oman');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].officialVisaName).toBe('10-Day Tourist eVisa');
  });

  it('does not return a rule marked ACTIVE but still awaiting human review', async () => {
    // Belt-and-braces: both flags must agree, not just `status`.
    await VisaRule.create({ ...baseRule, status: 'ACTIVE', verificationStatus: 'OFFICIAL_VERIFICATION_REQUIRED' });
    const res = await request(app).get('/api/visa-rules/oman');
    expect(res.body.data).toHaveLength(0);
  });

  it('returns an empty array (not a 404) for a country with no rules yet', async () => {
    const res = await request(app).get('/api/visa-rules/nowhereland');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('keeps government fee separate from any Visayatri service price', async () => {
    await VisaRule.create({ ...baseRule, status: 'ACTIVE', verificationStatus: 'HUMAN_REVIEWED', visaYatriServiceFee: 599 });
    const res = await request(app).get('/api/visa-rules/oman');
    expect(res.body.data[0].governmentFee.amount).toBe(5);
    expect(res.body.data[0].governmentFee.currency).toBe('OMR');
    expect(res.body.data[0].visaYatriServiceFee).toBe(599);
  });
});
