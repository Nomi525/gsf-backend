module.exports = {
  transform: {
    '^.+\\.jsx?$': 'babel-jest'
  },
  collectCoverage: true,
  collectCoverageFrom: ['src/controllers/**/*.js', 'src/services/**/*.js'],
  "reporters": [
    "default",
    ["jest-html-reporters", {
      "publicPath": "./test-report",
      "filename": "report.html",
      "openReport": true
    }]],
};
