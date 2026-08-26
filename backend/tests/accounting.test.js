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

async function seedPaidBooking(overrides = {}) {
  const user = await User.create({ name: 'Buyer', email: `buyer${Date.now()}${Math.random()}@example.com`, password: 'password123', role: 'user' });
  const country = await Country.create({ name: `C${Date.now()}${Math.random()}`, flag: '🏳️', continent: 'others' });
  const visa = await Visa.create({
    country: 'Testland', slug: `testland-${Date.now()}-${Math.random()}`, flag: '🏳️', region: 'others', countryRef: country._id,
    plans: [{ label: 'Standard', basePrice: 1000, agentPrice: 1100, publicPrice: 1200 }],
    processingTime: '3-5 days', visaType: 'E-Visa',
  });
  return Application.create({
    userId: user._id, visaId: visa._id,
    applicantName: 'Buyer', applicantEmail: user.email, applicantPhone: '9999999999',
    planLabel: 'Standard', pricePaid: 1799, serviceFee: 599, amountPaid: 1799, paymentStatus: 'paid',
    ...overrides,
  });
}

describe('GET /api/admin/accounting', () => {
  it('requires admin auth', async () => {
    const res = await request(app).get('/api/admin/accounting');
    expect(res.status).toBe(401);
  });

  it('sums revenue and service fees only across paid bookings', async () => {
    await seedPaidBooking({ amountPaid: 1799, serviceFee: 599 });
    await seedPaidBooking({ amountPaid: 2399, serviceFee: 599 });
    await seedPaidBooking({ paymentStatus: 'pending', amountPaid: 0, serviceFee: 599 }); // unpaid — must be excluded

    const token = await loginAsAdmin();
    const res = await request(app).get('/api/admin/accounting').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.summary.totalBookings).toBe(2);
    expect(res.body.summary.totalRevenue).toBe(1799 + 2399);
    expect(res.body.summary.totalServiceFees).toBe(599 + 599);
    expect(res.body.total).toBe(3); // the booking list itself includes the unpaid one too
  });

  it('filters by date range', async () => {
    // Mongoose's `timestamps: true` re-derives createdAt on update
    // operations, so backdating via updateOne() after the fact doesn't
    // stick — set it directly at creation time instead.
    await seedPaidBooking({ amountPaid: 1000, serviceFee: 500, createdAt: new Date('2020-01-01') });
    await seedPaidBooking({ amountPaid: 2000, serviceFee: 500 });

    const token = await loginAsAdmin();
    const res = await request(app)
      .get('/api/admin/accounting')
      .query({ from: '2026-01-01', to: '2026-12-31' })
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.summary.totalBookings).toBe(1);
    expect(res.body.summary.totalRevenue).toBe(2000);
  });

  it('returns zeroed summary with no bookings', async () => {
    const token = await loginAsAdmin();
    const res = await request(app).get('/api/admin/accounting').set('Authorization', `Bearer ${token}`);
    expect(res.body.summary).toEqual({
      totalRevenue: 0, totalServiceFees: 0, totalBookings: 0, thisMonthRevenue: 0, thisMonthBookings: 0,
    });
  });
});
