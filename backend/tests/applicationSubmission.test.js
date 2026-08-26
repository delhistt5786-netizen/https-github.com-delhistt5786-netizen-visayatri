const fs = require('fs');
const path = require('path');
const os = require('os');
const request = require('supertest');
const app = require('../app');
const Country = require('../models/Country');
const Visa = require('../models/Visa');
const User = require('../models/User');
const mailer = require('../utils/mailer');

async function seedVisa() {
  const country = await Country.create({ name: `C${Date.now()}${Math.random()}`, flag: '🏳️', continent: 'others' });
  return Visa.create({
    country: 'Testland', slug: `testland-${Date.now()}-${Math.random()}`, flag: '🏳️', region: 'others', countryRef: country._id,
    plans: [{ label: 'Standard', basePrice: 1000, agentPrice: 1100, publicPrice: 1200 }],
    processingTime: '3-5 days', visaType: 'E-Visa',
  });
}

describe('Application submission — backup email (best-effort)', () => {
  let tmpFile;
  beforeAll(() => {
    tmpFile = path.join(os.tmpdir(), 'vy-test-doc.jpg');
    fs.writeFileSync(tmpFile, Buffer.from([0xff, 0xd8, 0xff, 0xdb]));
  });
  afterAll(() => { fs.unlinkSync(tmpFile); });

  it('creates a B2C application successfully even though SMTP is unconfigured in tests', async () => {
    const visa = await seedVisa();
    const res = await request(app).post('/api/applications').send({
      visaId: visa._id, planLabel: 'Standard',
      applicantName: 'Backup Test', applicantEmail: 'backup-test@example.com', applicantPhone: '9999999999',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.applicationId).toBeTruthy();
    expect(res.body.token).toBeTruthy(); // guest account auto-issued token
  });

  it('uploads a document successfully even though SMTP is unconfigured in tests', async () => {
    const visa = await seedVisa();
    const createRes = await request(app).post('/api/applications').send({
      visaId: visa._id, planLabel: 'Standard',
      applicantName: 'Doc Backup Test', applicantEmail: 'doc-backup-test@example.com', applicantPhone: '9999999999',
    });
    const { token } = createRes.body;
    const appId = createRes.body.data._id;

    const uploadRes = await request(app)
      .post(`/api/applications/${appId}/documents`)
      .set('Authorization', `Bearer ${token}`)
      .field('docTypes', JSON.stringify(['passport']))
      .attach('documents', tmpFile);

    expect(uploadRes.status).toBe(200);
    expect(uploadRes.body.uploaded).toBe(1);
  });

  it('sends the agent code + application ID in an agent submission (via mailer function shape)', async () => {
    const agent = await User.create({
      name: 'Agent Backup', email: 'agent-backup@example.com', password: 'password123',
      role: 'agent', isApproved: true, agentCode: 'AGT999999',
    });
    const login = await request(app).post('/api/auth/login').send({ email: 'agent-backup@example.com', password: 'password123' });
    const visa = await seedVisa();

    const res = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({
        visaId: visa._id, planLabel: 'Standard',
        applicantName: 'Client Of Agent', applicantEmail: 'client-of-agent@example.com', applicantPhone: '9999999999',
        paymentMethod: 'whatsapp',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.agentId).toBeTruthy();
  });

  it('mailer.mailApplicationSubmitted resolves without throwing when SMTP is unconfigured', async () => {
    const fakeApp = { applicationId: 'VYT-TEST', applicantName: 'X', visaId: { country: 'Testland' }, planLabel: 'Standard' };
    const result = await mailer.mailApplicationSubmitted(fakeApp, 'nobody@example.com', Buffer.from('pdf'), false);
    expect(result.sent).toBe(false);
  });

  it('mailer.mailDocumentsBackup resolves without throwing when SMTP is unconfigured', async () => {
    const fakeApp = { applicationId: 'VYT-TEST', applicantName: 'X' };
    const result = await mailer.mailDocumentsBackup(fakeApp, 'nobody@example.com', [
      { docType: 'passport', originalName: 'p.jpg', path: '/tmp/nope.jpg', mimetype: 'image/jpeg', size: 100 },
    ], false);
    expect(result.sent).toBe(false);
  });
});
