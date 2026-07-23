const { getExecutionProvider } = require("./providers");
const { LANGUAGE_MAP, MAX_BATCH_SIZE } = require("./providers/judge0.provider");

function getLanguageId(lang) {
  const normalized = (lang || "").toLowerCase().trim();
  const id = LANGUAGE_MAP[normalized];
  if (!id) {
    throw new Error(`Unsupported language for Judge0: '${lang}'`);
  }
  return id;
}

function normalizeOutput(str) {
  if (typeof str !== "string") str = "";
  const lines = str.replace(/\r/g, "").split("\n");
  const trimmed = lines.map((line) => line.replace(/[ \t]+$/, ""));
  while (trimmed.length > 0 && trimmed[trimmed.length - 1] === "") {
    trimmed.pop();
  }
  return trimmed.join("\n");
}

function compareOutput(actual, expected) {
  return normalizeOutput(actual) === normalizeOutput(expected);
}

function decodeBase64(str) {
  if (!str) return "";
  return Buffer.from(str, "base64").toString("utf-8");
}

function statusToVerdict(status) {
  switch (status) {
    case "PASS":
      return "Accepted";
    case "WA":
      return "Wrong Answer";
    case "TLE":
      return "Time Limit Exceeded";
    case "RE":
      return "Runtime Error";
    case "MLE":
      return "Memory Limit Exceeded";
    case "Compilation Error":
      return "Compilation Error";
    default:
      return "Runtime Error";
  }
}

function mapResultStatus(item, memoryLimitMb, expectedInputOutput) {
  const statusId = item.status?.id;
  const memoryKb = item.memory || 0;
  const memoryLimitKb = memoryLimitMb * 1024;

  const stdout = typeof item.stdout === "string" && !item.stdout.includes("\n") && !item.stdout.includes(" ")
    ? decodeBase64(item.stdout)
    : (item.stdout || "");
  const stderr = typeof item.stderr === "string" && !item.stderr.includes("\n") && !item.stderr.includes(" ")
    ? decodeBase64(item.stderr)
    : (item.stderr || "");
  const compileOutput = typeof item.compile_output === "string" && !item.compile_output.includes("\n") && !item.compile_output.includes(" ")
    ? decodeBase64(item.compile_output)
    : (item.compile_output || "");
  const runtimeMs = Math.round(parseFloat(item.time || "0") * 1000);

  // Compilation Error
  if (statusId === 6 || compileOutput) {
    return {
      status: "Compilation Error",
      output: "",
      errorMessage: compileOutput || stderr || item.status?.description || "Compilation Error",
      runtimeMs,
      passed: false,
    };
  }

  // Explicit MLE Check
  if (memoryKb > memoryLimitKb) {
    return {
      status: "MLE",
      output: stdout,
      errorMessage: null,
      runtimeMs,
      passed: false,
    };
  }

  let status = "RE";
  let passed = false;

  switch (statusId) {
    case 3: {
      passed = compareOutput(stdout, expectedInputOutput?.expected || "");
      status = passed ? "PASS" : "WA";
      break;
    }
    case 4:
      status = "WA";
      break;
    case 5:
      status = "TLE";
      break;
    case 7:
    case 8:
    case 9:
    case 10:
    case 11:
    case 13:
    case 14:
      status = "RE";
      break;
    case 12:
      status = "RE";
      break;
    default:
      status = "RE";
  }

  return {
    status,
    output: stdout,
    errorMessage: status === "RE" ? stderr || item.status?.description || null : null,
    runtimeMs,
    passed,
  };
}

async function runJudge(payload) {
  const provider = getExecutionProvider("judge0");
  const { language, code, timeLimitMs = 2000, memoryLimitMb = 256, mode = "submit", testCases } = payload || {};

  const sampleCases = testCases?.sample || [];
  const hiddenCases = mode === "run" ? [] : testCases?.hidden || [];
  const allCases = [...sampleCases, ...hiddenCases];

  const telemetryResults = await provider.executeBatch({
    code,
    language,
    timeLimitMs,
    memoryLimitMb,
    testCases: allCases,
  });

  const sampleResults = [];
  let allSamplePassed = true;
  let sampleFailureStatus = null;

  for (let i = 0; i < sampleCases.length; i++) {
    const telemetry = telemetryResults[i];
    const tc = sampleCases[i];

    if (telemetry.isCompilationError) {
      return {
        verdict: "Compilation Error",
        sampleResults: [],
        hiddenSummary: { passed: false },
        errorMessage: telemetry.compileOutput || telemetry.stderr || "Compilation Error",
      };
    }

    let status = "RE";
    let passed = false;

    if (telemetry.isTimeLimitExceeded) status = "TLE";
    else if (telemetry.isMemoryLimitExceeded) status = "MLE";
    else if (telemetry.isRuntimeError) status = "RE";
    else {
      passed = compareOutput(telemetry.stdout, tc.expected);
      status = passed ? "PASS" : "WA";
    }

    if (!passed && allSamplePassed) {
      allSamplePassed = false;
      sampleFailureStatus = status;
    }

    sampleResults.push({
      index: i + 1,
      input: tc.input,
      expected: tc.expected,
      output: telemetry.stdout,
      passed,
      status,
      runtimeMs: telemetry.timeMs,
    });
  }

  let hiddenPassed = true;
  let hiddenFailureStatus = null;

  if (mode === "submit" && hiddenCases.length > 0) {
    if (!allSamplePassed) {
      hiddenPassed = false;
    } else {
      for (let i = 0; i < hiddenCases.length; i++) {
        const telemetry = telemetryResults[sampleCases.length + i];
        const tc = hiddenCases[i];

        if (telemetry.isCompilationError) {
          return {
            verdict: "Compilation Error",
            sampleResults,
            hiddenSummary: { passed: false },
            errorMessage: telemetry.compileOutput || telemetry.stderr || "Compilation Error",
          };
        }

        let passed = false;
        let status = "RE";

        if (telemetry.isTimeLimitExceeded) status = "TLE";
        else if (telemetry.isMemoryLimitExceeded) status = "MLE";
        else if (telemetry.isRuntimeError) status = "RE";
        else {
          passed = compareOutput(telemetry.stdout, tc.expected);
          status = passed ? "PASS" : "WA";
        }

        if (!passed) {
          hiddenPassed = false;
          hiddenFailureStatus = status;
          break;
        }
      }
    }
  }

  let finalStatus = "PASS";
  if (!allSamplePassed) {
    finalStatus = sampleFailureStatus || "WA";
  } else if (!hiddenPassed) {
    finalStatus = hiddenFailureStatus || "WA";
  }

  return {
    verdict: statusToVerdict(finalStatus),
    sampleResults,
    hiddenSummary: { passed: hiddenPassed },
    errorMessage: null,
  };
}

module.exports = {
  runJudge,
  normalizeOutput,
  compareOutput,
  getLanguageId,
  statusToVerdict,
  mapResultStatus,
  LANGUAGE_MAP,
  MAX_BATCH_SIZE,
};
