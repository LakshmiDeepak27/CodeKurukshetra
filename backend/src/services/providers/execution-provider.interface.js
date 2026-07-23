/**
 * Standard telemetry object returned by all Execution Providers.
 * Execution Providers MUST NOT calculate correctness or determine verdicts (Accepted/Wrong Answer).
 *
 * @typedef {Object} ExecutionResult
 * @property {string} stdout - Raw standard output from process execution
 * @property {string} stderr - Raw standard error from process execution
 * @property {string} compileOutput - Raw compiler output (if applicable)
 * @property {number} timeMs - Execution wall/CPU time in milliseconds
 * @property {number} memoryKb - Peak memory usage in Kilobytes
 * @property {number|null} exitCode - Process exit code
 * @property {number} statusId - Raw provider status identifier
 * @property {boolean} isTimeLimitExceeded - Provider execution timeout flag
 * @property {boolean} isMemoryLimitExceeded - Provider memory limit exceeded flag
 * @property {boolean} isCompilationError - Provider compilation failure flag
 * @property {boolean} isRuntimeError - Provider runtime crash flag
 */

class AbstractExecutionProvider {
  constructor(name) {
    if (new.target === AbstractExecutionProvider) {
      throw new TypeError("Cannot instantiate AbstractExecutionProvider directly.");
    }
    this.name = name;
  }

  /**
   * Executes a batch of test inputs against user source code.
   *
   * @param {Object} payload
   * @param {string} payload.code - User source code (or driver wrapped code)
   * @param {string} payload.language - Target programming language (cpp, python, java, js)
   * @param {number} payload.timeLimitMs - Time limit in milliseconds
   * @param {number} payload.memoryLimitMb - Memory limit in Megabytes
   * @param {Array<{input: string}>} payload.testCases - Test inputs to execute
   * @returns {Promise<ExecutionResult[]>}
   */
  async executeBatch(_payload) {
    throw new Error("executeBatch() must be implemented by subclass.");
  }
}

module.exports = { AbstractExecutionProvider };
