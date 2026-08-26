module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 30000, // mongodb-memory-server's first boot downloads a binary — give it room
  forceExit: true,
  // `archiver` is ESM-only; Jest's CJS require() can't load it even though
  // plain Node can (native require(esm)). See tests/__mocks__/archiver.js.
  moduleNameMapper: { '^archiver$': '<rootDir>/tests/__mocks__/archiver.js' },
};
