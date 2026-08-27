const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Country = require('../models/Country');
const Visa = require('../models/Visa');
const Application = require('../models/Application');
const Settings = require('../models/Settings');

async function loginAsAdmin() {
  await User.create({ name: 'Admin', email: 'admin@example.com', password: 'password123', role: 'admin' });
  const res = await request(app).post('/api/auth/login').send({ email: 'admin@example.com', password: 'password123' });
  return res.body.token;
}

async function seedApplication() {
  const user = await User.create({ name: 'Applicant', email: `applicant${Date.now()}${Math.random()}@example.com`, password: 'password123', role: 'user' });
  const country = await Country.create({ name: `C${Date.now()}${Math.random()}`, flag: '🏳️', continent: 'others' });
  const visa = await Visa.create({
    country: 'Testland', slug: `testland-${Date.now()}-${Math.random()}`, flag: '🏳️', region: 'others', countryRef: country._id,
    plans: [{ label: 'Standard', basePrice: 1000, agentPrice: 1100, publicPrice: 1200 }],
    processingTime: '3-5 days', visaType: 'E-Visa',
  });
  return Application.create({
    userId: user._id, visaId: visa._id, applicantName: 'Test Applicant', applicantEmail: user.email, applicantPhone: '9999999999',
    planLabel: 'Standard', pricePaid: 1200,
  });
}

describe('WhatsApp notifications on/off toggle (Settings)', () => {
  it('returns a whatsappLink by default (no settings doc yet — defaults to enabled)', async () => {
    const token = await loginAsAdmin();
    const application = await seedApplication();

    const res = await request(app)
      .put(`/api/applications/${application._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'in_review' });

    expect(res.body.whatsappLink).toBeTruthy();
  });

  it('omits whatsappLink when whatsappNotificationsEnabled is off, but still updates status', async () => {
    await Settings.create({ whatsappNotificationsEnabled: false });
    const token = await loginAsAdmin();
    const application = await seedApplication();

    const res = await request(app)
      .put(`/api/applications/${application._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'in_review' });

    expect(res.status).toBe(200);
    expect(res.body.whatsappLink).toBeNull();
    expect(res.body.data.status).toBe('in_review');
  });

  it('omits whatsappLink on approval when disabled too, but the approval email still fires', async () => {
    await Settings.create({ whatsappNotificationsEnabled: false });
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const token = await loginAsAdmin();
    const application = await seedApplication();

    const res = await request(app)
      .put(`/api/applications/${application._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'approved' });

    expect(res.body.whatsappLink).toBeNull();
    const loggedSubjects = logSpy.mock.calls.map(c => c[0]);
    expect(loggedSubjects.some(l => l.includes('has been approved'))).toBe(true);
    logSpy.mockRestore();
  });

  it('admin can toggle the setting via PUT /api/admin/settings', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .put('/api/admin/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ whatsappNotificationsEnabled: false });

    expect(res.status).toBe(200);
    expect(res.body.data.whatsappNotificationsEnabled).toBe(false);
  });
});
