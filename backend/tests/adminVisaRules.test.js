const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
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
  ruleVersion: '2026.08', status: 'DRAFT', verificationStatus: 'OFFICIAL_VERIFICATION_REQUIRED',
};

async function loginAsAdmin() {
  await User.create({ name: 'Admin', email: 'admin@example.com', password: 'password123', role: 'admin' });
  const res = await request(app).post('/api/auth/login').send({ email: 'admin@example.com', password: 'password123' });
  return res.body.token;
}
async function loginAsAgent() {
  await User.create({ name: 'Agent', email: 'agent@example.com', password: 'password123', role: 'agent', isApproved: true });
  const res = await request(app).post('/api/auth/login').send({ email: 'agent@example.com', password: 'password123' });
  return res.body.token;
}

describe('Admin Visa Rules workspace', () => {
  it('rejects non-admin access to GET /api/admin/visa-rules', async () => {
    const agentToken = await loginAsAgent();
    const res = await request(app).get('/api/admin/visa-rules').set('Authorization', `Bearer ${agentToken}`);
    expect(res.status).toBe(403);
  });

  it('rejects unauthenticated access', async () => {
    const res = await request(app).get('/api/admin/visa-rules');
    expect(res.status).toBe(401);
  });

  it('lists every rule regardless of status for admin', async () => {
    await VisaRule.create(baseRule);
    const adminToken = await loginAsAdmin();
    const res = await request(app).get('/api/admin/visa-rules').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].status).toBe('DRAFT');
  });

  it('PATCH .../verify promotes a rule to ACTIVE + HUMAN_REVIEWED and makes it public', async () => {
    const rule = await VisaRule.create(baseRule);
    const adminToken = await loginAsAdmin();

    const verifyRes = await request(app)
      .patch(`/api/admin/visa-rules/${rule._id}/verify`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ verifiedBy: 'Manual check by owner' });
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.status).toBe('ACTIVE');
    expect(verifyRes.body.data.verificationStatus).toBe('HUMAN_REVIEWED');

    const publicRes = await request(app).get('/api/visa-rules/oman');
    expect(publicRes.body.data).toHaveLength(1);
  });

  it('PATCH .../unpublish pulls an ACTIVE rule back out of public view', async () => {
    const rule = await VisaRule.create({ ...baseRule, status: 'ACTIVE', verificationStatus: 'HUMAN_REVIEWED' });
    const adminToken = await loginAsAdmin();

    await request(app).patch(`/api/admin/visa-rules/${rule._id}/unpublish`).set('Authorization', `Bearer ${adminToken}`);

    const publicRes = await request(app).get('/api/visa-rules/oman');
    expect(publicRes.body.data).toHaveLength(0);
  });

  it('PUT allows correcting a government fee after manual verification', async () => {
    const rule = await VisaRule.create(baseRule);
    const adminToken = await loginAsAdmin();

    const res = await request(app)
      .put(`/api/admin/visa-rules/${rule._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ governmentFee: { amount: 6, currency: 'OMR', status: 'VERIFIED' } });

    expect(res.status).toBe(200);
    expect(res.body.data.governmentFee.amount).toBe(6);
    expect(res.body.data.governmentFee.status).toBe('VERIFIED');
  });
});
