const fs = require('fs');
const path = require('path');
const os = require('os');
const request = require('supertest');
const app = require('../app');
const User = require('../models/User');

async function loginAsAdmin() {
  await User.create({ name: 'Admin', email: 'admin@example.com', password: 'password123', role: 'admin' });
  const res = await request(app).post('/api/auth/login').send({ email: 'admin@example.com', password: 'password123' });
  return res.body.token;
}

describe('Agent registration — business KYC', () => {
  let tmpFile;
  beforeAll(() => {
    tmpFile = path.join(os.tmpdir(), 'vy-test-pan.jpg');
    fs.writeFileSync(tmpFile, Buffer.from([0xff, 0xd8, 0xff, 0xdb]));
  });
  afterAll(() => { fs.unlinkSync(tmpFile); });

  it('rejects agent registration without a company name', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'No Company', email: 'nocompany@example.com', password: 'password123', role: 'agent', panNumber: 'ABCDE1234F',
    });
    expect(res.status).toBe(400);
  });

  it('rejects agent registration without a PAN number', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'No Pan', email: 'nopan@example.com', password: 'password123', role: 'agent', companyName: 'Test Travels',
    });
    expect(res.status).toBe(400);
  });

  it('registers an agent (JSON, no files) with KYC text fields saved', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Agent One', email: 'agent1@example.com', password: 'password123', role: 'agent',
      companyName: 'Sharma Travels', companyType: 'Proprietorship', officeAddress: '123 MG Road',
      city: 'Delhi', panNumber: 'ABCDE1234F', aadharNumber: '123456789012', gstNumber: '',
    });
    expect(res.status).toBe(201);
    expect(res.body.user.isApproved).toBe(false);

    const inDb = await User.findOne({ email: 'agent1@example.com' });
    expect(inDb.companyName).toBe('Sharma Travels');
    expect(inDb.companyType).toBe('Proprietorship');
    expect(inDb.panNumber).toBe('ABCDE1234F');
  });

  it('registers an agent with KYC documents attached and admin can view them via signed URL', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .field('name', 'Agent Two')
      .field('email', 'agent2@example.com')
      .field('password', 'password123')
      .field('role', 'agent')
      .field('companyName', 'Verma Visas')
      .field('companyType', 'Individual')
      .field('officeAddress', '45 Park Street')
      .field('city', 'Kolkata')
      .field('panNumber', 'PQRSX5678Z')
      .field('aadharNumber', '987654321098')
      .attach('panCard', tmpFile)
      .attach('aadharCard', tmpFile);

    expect(res.status).toBe(201);

    const agentInDb = await User.findOne({ email: 'agent2@example.com' });
    expect(agentInDb.kycDocuments.panCard).toBeTruthy();
    expect(agentInDb.kycDocuments.aadharCard).toBeTruthy();
    expect(agentInDb.kycDocuments.gstCertificate).toBeFalsy();

    const adminToken = await loginAsAdmin();

    // Admin list shows submitted/not-submitted booleans, never raw paths
    const listRes = await request(app).get('/api/agents/list').set('Authorization', `Bearer ${adminToken}`);
    const listed = listRes.body.data.find(a => a.email === 'agent2@example.com');
    expect(listed.kycDocuments.panCard).toBe(true);
    expect(listed.kycDocuments.gstCertificate).toBe(false);

    // Admin can mint a signed URL for a submitted document
    const urlRes = await request(app)
      .get(`/api/agents/${agentInDb._id}/kyc-documents/panCard/signed-url`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(urlRes.status).toBe(200);
    expect(urlRes.body.url).toMatch(/^\/api\/files\/serve\//);

    // 404 for a document that was never submitted
    const missingRes = await request(app)
      .get(`/api/agents/${agentInDb._id}/kyc-documents/gstCertificate/signed-url`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(missingRes.status).toBe(404);
  });

  it('still registers a traveler (JSON, no KYC fields required)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Traveler', email: 'traveler1@example.com', password: 'password123',
    });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('user');
  });
});
