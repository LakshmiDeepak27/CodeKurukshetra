const judge0Service = require("./judge0.service");

/**
 * Main Code Execution Entry Point.
 * All submissions (Run and Submit) are compiled and executed exclusively via Judge0 API.
 * No code is compiled or executed locally on the backend server.
 */
async function runJudge(payload) {
  return judge0Service.runJudge(payload);
}

module.exports = { runJudge };
