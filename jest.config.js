module.exports = {
  collectCoverage: true,
  coverageProvider: "v8",
  collectCoverageFrom: [
    "**/*.js",
    "!jest.config.js",
    "!FireStore_db/firebase.js",
    "!**/node_modules/**",
    "!**/coverage/**"
  ],
  coveragePathIgnorePatterns: [
    "\\\\node_modules\\\\",
    "\\\\coverage\\\\"
  ],
  coverageThreshold: {
    "./SignUp_LogIn_pages/": {
      branches: 85,
      functions: 100,
      lines: 85,
      statements: 85
    }
  }
};
