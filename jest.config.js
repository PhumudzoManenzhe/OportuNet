module.exports = {
  collectCoverage: true,
  coverageProvider: "v8",
  collectCoverageFrom: [
    "**/*.js",
    "!**/node_modules/**",
    "!**/coverage/**"
  ],
  coveragePathIgnorePatterns: [
    "\\\\node_modules\\\\",
    "\\\\coverage\\\\"
  ]
};
