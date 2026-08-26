/**
 * Global test setup — spins up an in-memory MongoDB for the whole test
 * run (never touches the real Atlas database) and sets the env vars the
 * app needs before any test file requires server code.
 */
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.JWT_SECRET = 'test-secret-do-not-use-in-production';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.NODE_ENV = 'test';
  await mongoose.connect(process.env.MONGODB_URI);
}, 60000);

afterEach(async () => {
  // Wipe all collections between tests so they don't leak state into each other.
  const collections = await mongoose.connection.db.collections();
  for (const c of collections) await c.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongod) await mongod.stop();
});
