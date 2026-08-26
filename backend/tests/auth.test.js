const request = require('supertest');
const app = require('../app');
const User = require('../models/User');

describe('Auth', () => {
  describe('POST /api/auth/register', () => {
    it('creates a new user and returns a token + referral code', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test User', email: 'test1@example.com', password: 'password123',
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeTruthy();
      expect(res.body.user.email).toBe('test1@example.com');
      expect(res.body.user.referralCode).toMatch(/^VY[A-Z0-9]{6}$/);
    });

    it('rejects a duplicate email', async () => {
      await request(app).post('/api/auth/register').send({
        name: 'First', email: 'dupe@example.com', password: 'password123',
      });
      const res = await request(app).post('/api/auth/register').send({
        name: 'Second', email: 'dupe@example.com', password: 'password123',
      });
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('rejects a password under 6 characters', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Short Pw', email: 'short@example.com', password: '123',
      });
      expect(res.status).toBe(400);
    });

    it('attributes referredBy when a valid referral code is supplied', async () => {
      const referrer = await request(app).post('/api/auth/register').send({
        name: 'Referrer', email: 'referrer@example.com', password: 'password123',
      });
      const referralCode = referrer.body.user.referralCode;

      const referee = await request(app).post('/api/auth/register').send({
        name: 'Referee', email: 'referee@example.com', password: 'password123', referralCode,
      });
      expect(referee.status).toBe(201);

      const refereeInDb = await User.findOne({ email: 'referee@example.com' });
      const referrerInDb = await User.findOne({ email: 'referrer@example.com' });
      expect(refereeInDb.referredBy?.toString()).toBe(referrerInDb._id.toString());
    });

    it('silently ignores an unknown referral code instead of failing registration', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test', email: 'unknownref@example.com', password: 'password123', referralCode: 'VYNOPE00',
      });
      expect(res.status).toBe(201);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send({
        name: 'Login Test', email: 'login@example.com', password: 'password123',
      });
    });

    it('logs in with correct credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'login@example.com', password: 'password123',
      });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeTruthy();
    });

    it('rejects the wrong password without leaking whether the email exists', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'login@example.com', password: 'wrongpassword',
      });
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid email or password.');
    });

    it('rejects an unknown email with the same generic message', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nobody@example.com', password: 'password123',
      });
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid email or password.');
    });

    it('backfills a referralCode for a user that predates the referral program', async () => {
      const user = await User.findOne({ email: 'login@example.com' });
      user.referralCode = undefined;
      await user.save({ validateBeforeSave: false });

      await request(app).post('/api/auth/login').send({
        email: 'login@example.com', password: 'password123',
      });

      const after = await User.findOne({ email: 'login@example.com' });
      expect(after.referralCode).toMatch(/^VY[A-Z0-9]{6}$/);
    });
  });
});
