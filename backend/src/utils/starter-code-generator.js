/**
 * Utility to parse Python starter code / function signatures and generate
 * standard, production-grade starter code & driver metadata for C++, Python 3, Java, and JavaScript.
 */

function pyTypeToCpp(typeStr = "") {
  let t = typeStr.trim();
  if (!t || t === "None") return "void";
  if (t === "int") return "int";
  if (t === "str") return "string";
  if (t === "bool") return "bool";
  if (t === "float") return "double";
  if (t.startsWith("List[List[")) {
    const inner = t.replace(/^List\[List\[/, "").replace(/\]\]$/, "");
    return `vector<vector<${pyTypeToCpp(inner)}>>`;
  }
  if (t.startsWith("List[")) {
    const inner = t.replace(/^List\[/, "").replace(/\]$/, "");
    return `vector<${pyTypeToCpp(inner)}>`;
  }
  if (t.includes("ListNode")) return "ListNode*";
  if (t.includes("TreeNode")) return "TreeNode*";
  return "auto";
}

function pyTypeToJava(typeStr = "") {
  let t = typeStr.trim();
  if (!t || t === "None") return "void";
  if (t === "int") return "int";
  if (t === "str") return "String";
  if (t === "bool") return "boolean";
  if (t === "float") return "double";
  if (t.startsWith("List[List[")) {
    const inner = t.replace(/^List\[List\[/, "").replace(/\]\]$/, "");
    return `${pyTypeToJava(inner)}[][]`;
  }
  if (t.startsWith("List[")) {
    const inner = t.replace(/^List\[/, "").replace(/\]$/, "");
    return `${pyTypeToJava(inner)}[]`;
  }
  if (t.includes("ListNode")) return "ListNode";
  if (t.includes("TreeNode")) return "TreeNode";
  return "Object";
}

function pyTypeToJsDoc(typeStr = "") {
  let t = typeStr.trim();
  if (!t || t === "None") return "void";
  if (t === "int" || t === "float") return "number";
  if (t === "str") return "string";
  if (t === "bool") return "boolean";
  if (t.startsWith("List[List[")) {
    const inner = t.replace(/^List\[List\[/, "").replace(/\]\]$/, "");
    return `${pyTypeToJsDoc(inner)}[][]`;
  }
  if (t.startsWith("List[")) {
    const inner = t.replace(/^List\[/, "").replace(/\]$/, "");
    return `${pyTypeToJsDoc(inner)}[]`;
  }
  return "any";
}

function parsePythonStarterCode(starterCode = "", entryPoint = "") {
  let funcName = "solve";
  if (entryPoint && entryPoint.includes(".")) {
    funcName = entryPoint.split(".").pop();
  } else {
    const nameMatch = starterCode.match(/def\s+([a-zA-Z0-9_]+)\s*\(/);
    if (nameMatch) funcName = nameMatch[1];
  }

  // Extract parameters and return type from Python signature
  // e.g., def twoSum(self, nums: List[int], target: int) -> List[int]:
  const sigMatch = starterCode.match(/def\s+[a-zA-Z0-9_]+\s*\(([^)]*)\)(?:\s*->\s*([^:]+))?:/);

  const params = [];
  let pyReturnType = "int";

  if (sigMatch) {
    const rawParams = sigMatch[1];
    if (sigMatch[2]) {
      pyReturnType = sigMatch[2].trim();
    }

    const paramTokens = rawParams.split(",").map((p) => p.trim()).filter((p) => p && p !== "self");
    paramTokens.forEach((token) => {
      const parts = token.split(":").map((s) => s.trim());
      const pName = parts[0];
      const pType = parts[1] || "int";
      params.push({ name: pName, pyType: pType });
    });
  }

  if (params.length === 0) {
    params.push({ name: "nums", pyType: "List[int]" });
  }

  // Build Language Starter Codes
  const cppType = pyTypeToCpp(pyReturnType);
  const cppParams = params.map((p) => {
    const cType = pyTypeToCpp(p.pyType);
    const isRef = cType.startsWith("vector") || cType === "string";
    return `${cType}${isRef ? "&" : ""} ${p.name}`;
  }).join(", ");

  const cppStarterCode = `class Solution {\npublic:\n    ${cppType} ${funcName}(${cppParams}) {\n        \n    }\n};\n`;

  const pyParams = params.map((p) => `${p.name}: ${p.pyType}`).join(", ");
  const pyReturnHint = pyReturnType && pyReturnType !== "None" ? ` -> ${pyReturnType}` : "";
  const pythonStarterCode = `class Solution:\n    def ${funcName}(self${pyParams ? ", " + pyParams : ""})${pyReturnHint}:\n        pass\n`;

  const javaType = pyTypeToJava(pyReturnType);
  const javaParams = params.map((p) => `${pyTypeToJava(p.pyType)} ${p.name}`).join(", ");
  const javaDefaultReturn = javaType === "void" ? "" : javaType === "int" || javaType === "double" ? "        return 0;\n" : javaType.endsWith("[]") ? "        return new " + javaType + "{};\n" : "        return null;\n";
  const javaStarterCode = `class Solution {\n    public ${javaType} ${funcName}(${javaParams}) {\n${javaDefaultReturn}    }\n}\n`;

  const jsParamNames = params.map((p) => p.name).join(", ");
  const jsDocParams = params.map((p) => `   * @param {${pyTypeToJsDoc(p.pyType)}} ${p.name}`).join("\n");
  const jsDocReturn = `   * @return {${pyTypeToJsDoc(pyReturnType)}}`;
  const jsStarterCode = `class Solution {\n  /**\n${jsDocParams}\n${jsDocReturn}\n   */\n  ${funcName}(${jsParamNames}) {\n    \n  }\n}\n`;

  return {
    functionName: funcName,
    returnType: cppType,
    parameters: params.map((p) => ({ name: p.name, type: pyTypeToCpp(p.pyType) })),
    languages: {
      cpp: {
        starterCode: cppStarterCode,
        inputParser: "string input; cin >> input;",
        outputFormatter: "cout << answer << '\\n';",
        driverTemplate: "#include <bits/stdc++.h>\nusing namespace std;\n\n{{solution}}\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    Solution solution;\n    // driver invocation\n    return 0;\n}\n",
      },
      python: {
        starterCode: pythonStarterCode,
        inputParser: "import sys\ndata = sys.stdin.read()",
        outputFormatter: "print(answer)",
        driverTemplate: "import sys\n\n{{solution}}\n",
      },
      java: {
        starterCode: javaStarterCode,
        inputParser: "Scanner scanner = new Scanner(System.in);",
        outputFormatter: "System.out.println(answer);",
        driverTemplate: "import java.util.*;\n\n{{solution}}\n\npublic class Main {\n    public static void main(String[] args) {\n        Solution solution = new Solution();\n    }\n}\n",
      },
      js: {
        starterCode: jsStarterCode,
        inputParser: "const input = require('fs').readFileSync(0, 'utf8');",
        outputFormatter: "console.log(answer);",
        driverTemplate: "{{solution}}\n",
      },
    },
  };
}

module.exports = { parsePythonStarterCode };
