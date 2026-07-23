// g++/clang: "main.cpp:8:5: error: expected ';' before '}' token"
const GPP_LINE_RE = /(?:^|\n)(.*?):(\d+):(\d+):\s*(error|warning|note):/g;
// g++/clang code snippet line numbers: "    8 |     }"
const GPP_SNIPPET_LINE_RE = /(^|\n)(\s*)(\d+)(\s*\|)/g;

// javac: "Main.java:12: error: ';' expected"
const JAVAC_LINE_RE = /(?:^|\n)(.*?):(\d+):\s*(error|warning):/g;

// Python traceback: '  File "solution.py", line 14, in <module>'
const PYTHON_LINE_RE = /File "([^"]+)", line (\d+)/g;

// Node.js: 'solution.js:9' or 'Main.js:9:3' or '    at Object.<anonymous> (/path/solution.js:9:3)'
const NODE_LINE_RE = /(?:^|\s|\()([a-zA-Z0-9_\-\./\\]+\.js):(\d+)(?::(\d+))?/g;

function remapErrorLineNumbers(rawMessage, language, offset) {
  if (!rawMessage || typeof rawMessage !== "string" || !offset || offset <= 0) {
    return rawMessage;
  }

  let touchedInternalCode = false;

  let remapped = rawMessage;

  switch (language) {
    case "cpp":
      remapped = rawMessage.replace(GPP_LINE_RE, (full, file, line, col, kind) => {
        const lineNum = Number(line);
        const userLine = lineNum - offset;
        if (userLine < 1) {
          touchedInternalCode = true;
          return full;
        }
        const leadingNewline = full.startsWith("\n") ? "\n" : "";
        return `${leadingNewline}${file}:${userLine}:${col}: ${kind}:`;
      });
      remapped = remapped.replace(GPP_SNIPPET_LINE_RE, (full, newline, indent, line, pipe) => {
        const lineNum = Number(line);
        const userLine = lineNum - offset;
        if (userLine < 1) {
          touchedInternalCode = true;
          return full;
        }
        return `${newline}${indent}${userLine}${pipe}`;
      });
      break;

    case "java":
      remapped = rawMessage.replace(JAVAC_LINE_RE, (full, file, line, kind) => {
        const lineNum = Number(line);
        const userLine = lineNum - offset;
        if (userLine < 1) {
          touchedInternalCode = true;
          return full;
        }
        const leadingNewline = full.startsWith("\n") ? "\n" : "";
        return `${leadingNewline}${file}:${userLine}: ${kind}:`;
      });
      break;

    case "python":
      remapped = rawMessage.replace(PYTHON_LINE_RE, (full, file, line) => {
        const lineNum = Number(line);
        const userLine = lineNum - offset;
        if (userLine < 1) {
          touchedInternalCode = true;
          return full;
        }
        return `File "${file}", line ${userLine}`;
      });
      break;

    case "js":
      remapped = rawMessage.replace(NODE_LINE_RE, (full, file, line, col) => {
        const lineNum = Number(line);
        const userLine = lineNum - offset;
        if (userLine < 1) {
          touchedInternalCode = true;
          return full;
        }
        const leading = full.slice(0, full.indexOf(file));
        return col ? `${leading}${file}:${userLine}:${col}` : `${leading}${file}:${userLine}`;
      });
      break;

    default:
      return rawMessage;
  }

  if (touchedInternalCode) {
    return "Internal judge error in this problem's test harness — please report it (ref: template bug).";
  }

  return remapped;
}

module.exports = { remapErrorLineNumbers };
