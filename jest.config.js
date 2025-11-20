// jest.config.js
module.exports = {
  testEnvironment: "node",
  verbose: true,
  forceExit: true,            // force process exit
  detectOpenHandles: false,   // explicitly disable warnings
  silent: true,               // suppress worker chatter
  testMatch: ["**/tests/**/*.test.js"]
};
