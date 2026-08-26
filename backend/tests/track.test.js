const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Country = require('../models/Country');
const Visa = require('../models/Visa');
const Application = require('../models/Application');

async function seedApplication(overrides = {}) {
  const user = await User.create({ name: 'Applicant', email: 'applicant@example.com', password: 'password123', role: 'user' });
  const country = await Country.create({ name: 'Testland', flag: '🏳️', continent: 'others' });
  const visa = await Visa.create({
    country: 'Testland', slug: 'testland', flag: '🏳️', region: 'others', countryRef: country._id,
    plans: [{ label: 'Standard', basePrice: 1000, agentPrice: 1100, publicPrice: 1200 }],
    processingTime: '3-5 days', visaType: 'E-Visa',
  });
  const app_ = await Application.create({
    userId: user._id, visaId: visa._id,
    applicantName: 'John Traveller', applicantEmail: 'applicant@example.com', applicantPhone: '9999999999',
    planLabel: 'Standard', pricePaid: 1200,
    ...overrides,
  });
  return { user, visa, application: app_ };
}

describe('GET /api/applications/track', () => {
  it('returns the application status for a matching ID + email, case-insensitively', async () => {
    const { application } = await seedApplication();
    const res = await request(app).get('/api/applications/track').query({
      applicationId: application.applicationId.toLowerCase(),
      email: 'APPLICANT@EXAMPLE.COM',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.applicationId).toBe(application.applicationId);
    expect(res.body.data.status).toBe('pending');
  });

  it('never leaks documents, payment, or admin notes in the track response', async () => {
    const { application } = await seedApplication({
      adminNotes: 'internal secret note', paymentMethod: 'razorpay', amountPaid: 1200,
    });
    const res = await request(app).get('/api/applications/track').query({
      applicationId: application.applicationId, email: 'applicant@example.com',
    });
    expect(res.body.data.adminNotes).toBeUndefined();
    expect(res.body.data.paymentMethod).toBeUndefined();
    expect(res.body.data.amountPaid).toBeUndefined();
    expect(res.body.data.documents).toBeUndefined();
  });

  it('404s for a wrong email on a real application ID (no user enumeration)', async () => {
    const { application } = await seedApplication();
    const res = await request(app).get('/api/applications/track').query({
      applicationId: application.applicationId, email: 'wrong@example.com',
    });
    expect(res.status).toBe(404);
  });

  it('400s when applicationId or email is missing', async () => {
    const res = await request(app).get('/api/applications/track').query({ applicationId: 'VYT12345678' });
    expect(res.status).toBe(400);
  });

  it('only includes rejectionReason when status is rejected', async () => {
    const { application } = await seedApplication({ status: 'rejected', rejectionReason: 'Missing documents' });
    const res = await request(app).get('/api/applications/track').query({
      applicationId: application.applicationId, email: 'applicant@example.com',
    });
    expect(res.body.data.rejectionReason).toBe('Missing documents');
  });

  it('omits rejectionReason for a non-rejected application even if one is set on the record', async () => {
    const { application } = await seedApplication({ status: 'pending', rejectionReason: 'stale leftover value' });
    const res = await request(app).get('/api/applications/track').query({
      applicationId: application.applicationId, email: 'applicant@example.com',
    });
    expect(res.body.data.rejectionReason).toBeUndefined();
  });
});
