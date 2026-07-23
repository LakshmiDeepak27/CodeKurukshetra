const test = require("node:test");
const assert = require("node:assert");
const { getExecutionProvider, Judge0Provider, NativeProvider } = require("../src/services/providers");
const { AbstractExecutionProvider } = require("../src/services/providers/execution-provider.interface");

test("AbstractExecutionProvider cannot be instantiated directly", () => {
  assert.throws(() => new AbstractExecutionProvider("test"), /Cannot instantiate AbstractExecutionProvider directly/);
});

test("getExecutionProvider returns Judge0Provider for 'judge0'", () => {
  const provider = getExecutionProvider("judge0");
  assert.strictEqual(provider instanceof Judge0Provider, true);
  assert.strictEqual(provider.name, "judge0");
});

test("getExecutionProvider returns NativeProvider for 'native'", () => {
  const provider = getExecutionProvider("native");
  assert.strictEqual(provider instanceof NativeProvider, true);
  assert.strictEqual(provider.name, "native");
});

test("getExecutionProvider throws on unknown provider name", () => {
  assert.throws(() => getExecutionProvider("unknown_engine"), /Unknown or unsupported execution engine provider/);
});

test("Judge0Provider normalizes telemetry without calculating verdict", () => {
  const provider = new Judge0Provider();
  const rawItem = {
    status: { id: 3, description: "Accepted" },
    stdout: Buffer.from("Hello World\n").toString("base64"),
    stderr: "",
    compile_output: "",
    time: "0.045",
    memory: 2048,
    exit_code: 0,
  };

  const telemetry = provider.normalizeTelemetry(rawItem, 256);
  assert.strictEqual(telemetry.stdout, "Hello World\n");
  assert.strictEqual(telemetry.timeMs, 45);
  assert.strictEqual(telemetry.memoryKb, 2048);
  assert.strictEqual(telemetry.exitCode, 0);
  assert.strictEqual(telemetry.isCompilationError, false);
  assert.strictEqual(telemetry.isTimeLimitExceeded, false);
  assert.strictEqual(telemetry.isMemoryLimitExceeded, false);
});
