const { AbstractExecutionProvider } = require("./execution-provider.interface");
const config = require("../../config/env");

const LANGUAGE_MAP = {
  cpp: 54,
  "c++": 54,
  python: 71,
  python3: 71,
  py: 71,
  java: 62,
  javascript: 63,
  js: 63,
};

const MAX_BATCH_SIZE = 20;

function getLanguageId(lang) {
  const normalized = (lang || "").toLowerCase().trim();
  const id = LANGUAGE_MAP[normalized];
  if (!id) {
    throw new Error(`Unsupported language for Judge0: '${lang}'`);
  }
  return id;
}

function decodeBase64(str) {
  if (!str) return "";
  return Buffer.from(str, "base64").toString("utf-8");
}

function encodeBase64(str) {
  return Buffer.from(str || "", "utf-8").toString("base64");
}

class Judge0Provider extends AbstractExecutionProvider {
  constructor() {
    super("judge0");
  }

  async sendBatchSubmissions(submissions) {
    const baseUrl = config.judge0ApiUrl.replace(/\/$/, "");
    const headers = { "Content-Type": "application/json" };
    if (config.judge0ApiKey) {
      headers["X-Auth-Token"] = config.judge0ApiKey;
      headers["X-RapidAPI-Key"] = config.judge0ApiKey;
    }

    let res;
    try {
      res = await fetch(`${baseUrl}/submissions/batch?wait=true&base64_encoded=true`, {
        method: "POST",
        headers,
        body: JSON.stringify({ submissions }),
      });
    } catch (err) {
      throw new Error(`Judge0 server unreachable at ${config.judge0ApiUrl}: ${err.message}`);
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Judge0 API error (${res.status}): ${errText || res.statusText}`);
    }

    const data = await res.json();
    let items = Array.isArray(data) ? data : (data.submissions || []);

    // If returned items only contain tokens, poll GET /submissions/batch?tokens=...
    if (items.length > 0 && items[0].token && !items[0].status) {
      const tokens = items.map((i) => i.token).join(",");
      const pollUrl = `${baseUrl}/submissions/batch?tokens=${tokens}&base64_encoded=true`;

      for (let attempt = 0; attempt < 20; attempt++) {
        await new Promise((r) => setTimeout(r, 500));
        const pollRes = await fetch(pollUrl, { headers });
        if (pollRes.ok) {
          const pollData = await pollRes.json();
          const polledItems = pollData.submissions || (Array.isArray(pollData) ? pollData : []);
          const allFinished = polledItems.length > 0 && polledItems.every((item) => item.status && item.status.id > 2);
          if (allFinished || attempt === 19) {
            return polledItems;
          }
        }
      }
    }

    return items;
  }

  normalizeTelemetry(item, memoryLimitMb) {
    const statusId = item.status?.id || 0;
    const memoryKb = item.memory || 0;
    const memoryLimitKb = memoryLimitMb * 1024;
    const stdout = decodeBase64(item.stdout);
    const stderr = decodeBase64(item.stderr);
    const compileOutput = decodeBase64(item.compile_output);
    const timeMs = Math.round(parseFloat(item.time || "0") * 1000);

    const isCompilationError = statusId === 6 || Boolean(compileOutput);
    const isMemoryLimitExceeded = statusId === 12 || memoryKb > memoryLimitKb;
    const isTimeLimitExceeded = statusId === 5;
    const isRuntimeError = [7, 8, 9, 10, 11, 13, 14].includes(statusId);

    return {
      stdout,
      stderr,
      compileOutput,
      timeMs,
      memoryKb,
      exitCode: item.exit_code ?? null,
      statusId,
      isTimeLimitExceeded,
      isMemoryLimitExceeded,
      isCompilationError,
      isRuntimeError,
    };
  }

  async executeChunk(cases, code, languageId, timeLimitMs, memoryLimitMb) {
    const timeLimitSec = (timeLimitMs / 1000).toString();
    const wallTimeSec = ((timeLimitMs + 2000) / 1000).toString();
    const memoryLimitKb = memoryLimitMb * 1024;

    const submissions = cases.map((tc) => ({
      source_code: encodeBase64(code),
      language_id: languageId,
      stdin: encodeBase64(tc.input || ""),
      cpu_time_limit: timeLimitSec,
      wall_time_limit: wallTimeSec,
      memory_limit: memoryLimitKb,
    }));

    const rawResults = await this.sendBatchSubmissions(submissions);
    return rawResults.map((item) => this.normalizeTelemetry(item, memoryLimitMb));
  }

  async executeBatch(payload) {
    const { code, language, timeLimitMs = 2000, memoryLimitMb = 256, testCases = [] } = payload || {};
    const languageId = getLanguageId(language);

    const allResults = [];
    for (let i = 0; i < testCases.length; i += MAX_BATCH_SIZE) {
      const chunk = testCases.slice(i, i + MAX_BATCH_SIZE);
      const chunkResults = await this.executeChunk(chunk, code, languageId, timeLimitMs, memoryLimitMb);
      allResults.push(...chunkResults);

      if (chunkResults.some((r) => r.isCompilationError)) {
        break;
      }
    }

    return allResults;
  }
}

module.exports = { Judge0Provider, LANGUAGE_MAP, MAX_BATCH_SIZE };
