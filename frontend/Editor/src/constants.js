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
    cpp: `class Solution {\npublic:\n    int solve() {\n        // Write your solution here\n        return 0;\n    }\n};\n`,
    python: `class Solution:\n    def solve(self):\n        # Write your solution here\n        pass\n`,
    java: `class Solution {\n    public int solve() {\n        // Write your solution here\n        return 0;\n    }\n}\n`,
    js: `class Solution {\n  solve() {\n    // Write your solution here\n    return 0;\n  }\n}\n`,
};
