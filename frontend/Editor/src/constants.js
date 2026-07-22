export const LANGUAGES = [
    { id: "cpp", label: "C++17", monacoId: "cpp", extension: "cpp" },
    { id: "python", label: "Python 3", monacoId: "python", extension: "py" },
    { id: "java", label: "Java 17", monacoId: "java", extension: "java" },
    { id: "js", label: "JavaScript", monacoId: "javascript", extension: "js" },
    { id: "go", label: "Go", monacoId: "go", extension: "go", disabled: true },
    { id: "rust", label: "Rust", monacoId: "rust", extension: "rs", disabled: true },
    { id: "csharp", label: "C#", monacoId: "csharp", extension: "cs", disabled: true },
];

export const DEFAULT_CODE = {
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n    // Write your solution here\n\n    return 0;\n}`,
    python: `import sys\n\ndef solve():\n    # Write your solution here\n    s = sys.stdin.readline().strip()\n    if s:\n        print(0)\n\nif __name__ == "__main__":\n    solve()`,
    java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        if (scanner.hasNext()) {\n            String s = scanner.next();\n            // Write your solution here\n            System.out.println(0);\n        }\n    }\n}`,
    js: `const input = require("fs").readFileSync(0, "utf8").trim();\nif (input) {\n    // Write your solution here\n    console.log(0);\n}`,
};
