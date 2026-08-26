const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Country = require('../models/Country');
const Visa = require('../models/Visa');
const Application = require('../models/Application');
const Transaction = require('../models/Transaction');

describe('Referral reward on first approval', () => {
  let admin, adminToken, referrer, referee, visa;

  beforeEach(async () => {
    admin = await User.create({ name: 'Admin', email: 'admin@example.com', password: 'password123', role: 'admin' });
    const adminLogin = await request(app).post('/api/auth/login').send({ email: 'admin@example.com', password: 'password123' });
    adminToken = adminLogin.body.token;

    const referrerReg = await request(app).post('/api/auth/register').send({
      name: 'Referrer', email: 'referrer@example.com', password: 'password123',
    });
    referrer = await User.findById(referrerReg.body.user.id);

    const refereeReg = await request(app).post('/api/auth/register').send({
      name: 'Referee', email: 'referee@example.com', password: 'password123', referralCode: referrer.referralCode,
    });
    referee = await User.findById(refereeReg.body.user.id);

    const country = await Country.create({ name: 'Testland', flag: '🏳️', continent: 'others' });
    visa = await Visa.create({
      country: 'Testland', slug: 'testland', flag: '🏳️', region: 'others', countryRef: country._id,
      plans: [{ label: 'Standard', basePrice: 1000, agentPrice: 1100, publicPrice: 1200 }],
      processingTime: '3-5 days', visaType: 'E-Visa',
    });
  });

  it("credits the referrer's wallet ₹200 the first time the referee's application is approved", async () => {
    const application = await Application.create({
      userId: referee._id, visaId: visa._id,
      applicantName: 'Referee', applicantEmail: 'referee@example.com', applicantPhone: '9999999999',
      planLabel: 'Standard', pricePaid: 1200,
    });

    const res = await request(app)
      .put(`/api/applications/${application._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' });

    expect(res.status).toBe(200);

    const referrerAfter = await User.findById(referrer._id);
    expect(referrerAfter.walletBalance).toBe(200);

    const refereeAfter = await User.findById(referee._id);
    expect(refereeAfter.referralRewardGiven).toBe(true);

    const txn = await Transaction.findOne({ agentId: referrer._id, category: 'referral_bonus' });
    expect(txn).toBeTruthy();
    expect(txn.amount).toBe(200);
  });

  it('does not pay the referral reward twice for a second approved application', async () => {
    const app1 = await Application.create({
      userId: referee._id, visaId: visa._id,
      applicantName: 'Referee', applicantEmail: 'referee@example.com', applicantPhone: '9999999999',
      planLabel: 'Standard', pricePaid: 1200,
    });
    const app2 = await Application.create({
      userId: referee._id, visaId: visa._id,
      applicantName: 'Referee', applicantEmail: 'referee@example.com', applicantPhone: '9999999999',
      planLabel: 'Standard', pricePaid: 1200,
    });

    await request(app).put(`/api/applications/${app1._id}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'approved' });
    await request(app).put(`/api/applications/${app2._id}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'approved' });

    const referrerAfter = await User.findById(referrer._id);
    expect(referrerAfter.walletBalance).toBe(200); // not 400

    const txnCount = await Transaction.countDocuments({ agentId: referrer._id, category: 'referral_bonus' });
    expect(txnCount).toBe(1);
  });

  it('does not credit anything when the applicant has no referrer', async () => {
    const noRefUser = await User.create({ name: 'NoRef', email: 'noref@example.com', password: 'password123', role: 'user' });
    const application = await Application.create({
      userId: noRefUser._id, visaId: visa._id,
      applicantName: 'NoRef', applicantEmail: 'noref@example.com', applicantPhone: '9999999999',
      planLabel: 'Standard', pricePaid: 1200,
    });

    await request(app).put(`/api/applications/${application._id}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'approved' });

    const txnCount = await Transaction.countDocuments({ category: 'referral_bonus' });
    expect(txnCount).toBe(0);
  });
});
