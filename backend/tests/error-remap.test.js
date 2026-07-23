const test = require("node:test");
const assert = require("node:assert");
const { assembleFunctionSolution, computeSolutionLineOffset } = require("../src/services/function-wrapper.service");
const { remapErrorLineNumbers } = require("../src/services/error-remap.service");

test("computeSolutionLineOffset calculates correct preamble line count", () => {
  const template = "#include <bits/stdc++.h>\nusing namespace std;\n\n{{solution}}\n\nint main() {\n    return 0;\n}\n";
  const offset = computeSolutionLineOffset(template);
  assert.strictEqual(offset, 3);
});

test("assembleFunctionSolution returns assembled code and solutionLineOffset", () => {
  const wrapper = {
    languages: {
      cpp: {
        driverTemplate: "#line1\n#line2\n#line3\n{{solution}}\n#line5\n",
        inputParser: "// input",
        outputFormatter: "// output",
      },
    },
  };
  const result = assembleFunctionSolution(wrapper, "cpp", "int a = 1;");
  assert.strictEqual(result.solutionLineOffset, 3);
  assert.strictEqual(result.code, "#line1\n#line2\n#line3\nint a = 1;\n#line5\n");
});

test("Remaps C++ missing semicolon compile error including GCC source snippet line", () => {
  const rawMsg = "main.cpp:8:5: error: expected ';' before '}' token\n    8 |     }\n      |     ^";
  const offset = 3;
  const remapped = remapErrorLineNumbers(rawMsg, "cpp", offset);
  assert.strictEqual(remapped, "main.cpp:5:5: error: expected ';' before '}' token\n    5 |     }\n      |     ^");
});

test("Remaps C++ multiple errors independently", () => {
  const rawMsg = "main.cpp:8:5: error: expected ';' before '}' token\nmain.cpp:10:2: error: 'x' was not declared in this scope";
  const offset = 3;
  const remapped = remapErrorLineNumbers(rawMsg, "cpp", offset);
  assert.strictEqual(
    remapped,
    "main.cpp:5:5: error: expected ';' before '}' token\nmain.cpp:7:2: error: 'x' was not declared in this scope"
  );
});

test("Remaps Java javac compile error", () => {
  const rawMsg = "Main.java:15: error: ';' expected\n        System.out.println(x)\n                             ^";
  const offset = 10;
  const remapped = remapErrorLineNumbers(rawMsg, "java", offset);
  assert.strictEqual(
    remapped,
    "Main.java:5: error: ';' expected\n        System.out.println(x)\n                             ^"
  );
});

test("Remaps Python runtime IndexError traceback", () => {
  const rawMsg = 'Traceback (most recent call last):\n  File "solution.py", line 14, in <module>\n    print(arr[10])\nIndexError: list index out of range';
  const offset = 9;
  const remapped = remapErrorLineNumbers(rawMsg, "python", offset);
  assert.strictEqual(
    remapped,
    'Traceback (most recent call last):\n  File "solution.py", line 5, in <module>\n    print(arr[10])\nIndexError: list index out of range'
  );
});

test("Remaps JavaScript runtime TypeError stack trace", () => {
  const rawMsg = 'TypeError: Cannot read property "foo" of undefined\n    at Object.<anonymous> (/workspace/solution.js:9:3)';
  const offset = 4;
  const remapped = remapErrorLineNumbers(rawMsg, "js", offset);
  assert.strictEqual(
    remapped,
    'TypeError: Cannot read property "foo" of undefined\n    at Object.<anonymous> (/workspace/solution.js:5:3)'
  );
});

test("Detects internal judge template errors and returns generic message", () => {
  const rawMsg = "main.cpp:2:1: error: invalid preprocessing directive #includee";
  const offset = 3;
  const remapped = remapErrorLineNumbers(rawMsg, "cpp", offset);
  assert.strictEqual(
    remapped,
    "Internal judge error in this problem's test harness — please report it (ref: template bug)."
  );
});

test("Does not modify error message when solutionLineOffset is 0 (stdin/stdout problems)", () => {
  const rawMsg = "main.cpp:8:5: error: expected ';' before '}' token";
  const offset = 0;
  const remapped = remapErrorLineNumbers(rawMsg, "cpp", offset);
  assert.strictEqual(remapped, rawMsg);
});
