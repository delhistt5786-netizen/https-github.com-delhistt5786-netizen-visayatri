const fs = require('fs');
const path = require('path');
const os = require('os');
const request = require('supertest');
const app = require('../app');
const User = require('../models/User');

async function registerAndLogin(email) {
  const res = await request(app).post('/api/auth/register').send({ name: 'Vault User', email, password: 'password123' });
  return { token: res.body.token, userId: res.body.user.id };
}

describe('Document Vault', () => {
  let tmpFile;
  beforeAll(() => {
    tmpFile = path.join(os.tmpdir(), 'vy-test-passport.jpg');
    fs.writeFileSync(tmpFile, Buffer.from([0xff, 0xd8, 0xff, 0xdb])); // minimal JPEG-ish header, content doesn't matter for this test
  });
  afterAll(() => { fs.unlinkSync(tmpFile); });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/documents');
    expect(res.status).toBe(401);
  });

  it('starts empty for a new user', async () => {
    const { token } = await registerAndLogin('vault1@example.com');
    const res = await request(app).get('/api/documents').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('uploads a document and lists it back', async () => {
    const { token } = await registerAndLogin('vault2@example.com');

    const uploadRes = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
      .field('documentType', 'passport')
      .attach('document', tmpFile);

    expect(uploadRes.status).toBe(201);
    expect(uploadRes.body.data.documentType).toBe('passport');

    const listRes = await request(app).get('/api/documents').set('Authorization', `Bearer ${token}`);
    expect(listRes.body.data).toHaveLength(1);
  });

  it('rejects an upload with no documentType', async () => {
    const { token } = await registerAndLogin('vault3@example.com');
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
      .attach('document', tmpFile);
    expect(res.status).toBe(400);
  });

  it("a user cannot see or delete another user's documents", async () => {
    const userA = await registerAndLogin('vaulta@example.com');
    const userB = await registerAndLogin('vaultb@example.com');

    const uploadRes = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${userA.token}`)
      .field('documentType', 'photo')
      .attach('document', tmpFile);
    const docId = uploadRes.body.data._id;

    const bListRes = await request(app).get('/api/documents').set('Authorization', `Bearer ${userB.token}`);
    expect(bListRes.body.data).toHaveLength(0);

    const deleteRes = await request(app).delete(`/api/documents/${docId}`).set('Authorization', `Bearer ${userB.token}`);
    expect(deleteRes.status).toBe(404); // not found *for this user*, not a 403 that would confirm the doc's existence
  });

  it('deletes a document the owner uploaded', async () => {
    const { token } = await registerAndLogin('vault4@example.com');
    const uploadRes = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
      .field('documentType', 'bank_statement')
      .attach('document', tmpFile);

    const deleteRes = await request(app).delete(`/api/documents/${uploadRes.body.data._id}`).set('Authorization', `Bearer ${token}`);
    expect(deleteRes.status).toBe(200);

    const listRes = await request(app).get('/api/documents').set('Authorization', `Bearer ${token}`);
    expect(listRes.body.data).toHaveLength(0);
  });
});
