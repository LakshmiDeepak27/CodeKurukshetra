const { Judge0Provider } = require("./judge0.provider");

const judge0Provider = new Judge0Provider();

/**
 * Returns the Judge0 execution provider.
 * All code execution is strictly routed to Judge0 API containers.
 */
function getExecutionProvider() {
  return judge0Provider;
}

module.exports = {
  getExecutionProvider,
  Judge0Provider,
};
