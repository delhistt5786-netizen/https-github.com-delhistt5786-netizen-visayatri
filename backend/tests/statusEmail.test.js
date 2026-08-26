const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Country = require('../models/Country');
const Visa = require('../models/Visa');
const Application = require('../models/Application');

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

// SMTP is unconfigured in tests, so every send just logs
// `[mailer] SMTP not configured — skipped email to <to>: "<subject>"`
// instead of throwing — that log line is our proof the mail function
// actually ran (destructured imports in applications.js make jest.spyOn
// on the mailer module a no-op, so this is the reliable signal here).
describe('Status change — rejected sends an email (like approved already does)', () => {
  let logSpy;
  beforeEach(() => { logSpy = jest.spyOn(console, 'log').mockImplementation(() => {}); });
  afterEach(() => { logSpy.mockRestore(); });

  it('sends a rejection email with the reason, plus a WhatsApp link', async () => {
    const token = await loginAsAdmin();
    const application = await seedApplication();

    const res = await request(app)
      .put(`/api/applications/${application._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'rejected', rejectionReason: 'Passport photo unclear' });

    expect(res.status).toBe(200);
    expect(res.body.whatsappLink).toBeTruthy();

    const loggedSubjects = logSpy.mock.calls.map(c => c[0]);
    expect(loggedSubjects.some(l => l.includes(`Update on your application ${application.applicationId}`))).toBe(true);

    const inDb = await Application.findById(application._id);
    expect(inDb.rejectionReason).toBe('Passport photo unclear');
  });

  it('does not send a rejection email for a non-rejected status change', async () => {
    const token = await loginAsAdmin();
    const application = await seedApplication();

    await request(app)
      .put(`/api/applications/${application._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'in_review' });

    const loggedSubjects = logSpy.mock.calls.map(c => c[0]);
    expect(loggedSubjects.some(l => l.includes('Update on your application'))).toBe(false);
  });

  it('still sends the approval email (unchanged behavior)', async () => {
    const token = await loginAsAdmin();
    const application = await seedApplication();

    const res = await request(app)
      .put(`/api/applications/${application._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'approved' });

    expect(res.status).toBe(200);
    const loggedSubjects = logSpy.mock.calls.map(c => c[0]);
    expect(loggedSubjects.some(l => l.includes('has been approved'))).toBe(true);
  });
});
