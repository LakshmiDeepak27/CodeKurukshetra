const test = require("node:test");
const assert = require("node:assert");
const {
  normalizeOutput,
  compareOutput,
  getLanguageId,
  statusToVerdict,
  mapResultStatus,
  MAX_BATCH_SIZE,
} = require("../src/services/judge0.service");

test("normalizeOutput strips \\r, trims trailing per line, and drops trailing empty lines", () => {
  const raw = "Hello World  \r\n42 \t\r\n\r\n\r\n";
  const normalized = normalizeOutput(raw);
  assert.strictEqual(normalized, "Hello World\n42");
});

test("compareOutput treats outputs with trailing whitespace or CRLF variations as equal", () => {
  const actual = "1 2 3  \r\n4 5 6   \r\n\r\n";
  const expected = "1 2 3\n4 5 6\n";
  assert.strictEqual(compareOutput(actual, expected), true);
});

test("compareOutput detects actual output mismatch", () => {
  const actual = "1 2 3\n";
  const expected = "1 2 4\n";
  assert.strictEqual(compareOutput(actual, expected), false);
});

test("getLanguageId maps supported languages and throws on unknown", () => {
  assert.strictEqual(getLanguageId("cpp"), 54);
  assert.strictEqual(getLanguageId("C++"), 54);
  assert.strictEqual(getLanguageId("python"), 71);
  assert.strictEqual(getLanguageId("py"), 71);
  assert.strictEqual(getLanguageId("java"), 62);
  assert.strictEqual(getLanguageId("javascript"), 63);
  assert.strictEqual(getLanguageId("js"), 63);

  assert.throws(() => getLanguageId("brainfuck"), /Unsupported language for Judge0/);
});

test("statusToVerdict maps vocabulary correctly", () => {
  assert.strictEqual(statusToVerdict("PASS"), "Accepted");
  assert.strictEqual(statusToVerdict("WA"), "Wrong Answer");
  assert.strictEqual(statusToVerdict("TLE"), "Time Limit Exceeded");
  assert.strictEqual(statusToVerdict("RE"), "Runtime Error");
  assert.strictEqual(statusToVerdict("MLE"), "Memory Limit Exceeded");
  assert.strictEqual(statusToVerdict("Compilation Error"), "Compilation Error");
});

test("mapResultStatus performs explicit MLE check overriding status ID", () => {
  const item = {
    status: { id: 3, description: "Accepted" },
    stdout: Buffer.from("42\n").toString("base64"),
    memory: 300000, // 300 MB in KB
    time: "0.05",
  };
  const result = mapResultStatus(item, 256, { expected: "42" }); // 256 MB limit (262144 KB)
  assert.strictEqual(result.status, "MLE");
  assert.strictEqual(result.passed, false);
});

test("mapResultStatus extracts compilation error message", () => {
  const item = {
    status: { id: 6, description: "Compilation Error" },
    compile_output: Buffer.from("main.cpp:5: error: expected ';'").toString("base64"),
    time: "0.0",
  };
  const result = mapResultStatus(item, 256, { expected: "42" });
  assert.strictEqual(result.status, "Compilation Error");
  assert.strictEqual(result.errorMessage, "main.cpp:5: error: expected ';'");
  assert.strictEqual(result.passed, false);
});

test("mapResultStatus converts runtime seconds string to rounded milliseconds", () => {
  const item = {
    status: { id: 3, description: "Accepted" },
    stdout: Buffer.from("hello").toString("base64"),
    time: "0.1428",
    memory: 1000,
  };
  const result = mapResultStatus(item, 256, { expected: "hello" });
  assert.strictEqual(result.runtimeMs, 143);
  assert.strictEqual(result.status, "PASS");
  assert.strictEqual(result.passed, true);
});

test("MAX_BATCH_SIZE is set to 20 for chunking >20 test cases", () => {
  assert.strictEqual(MAX_BATCH_SIZE, 20);
});
