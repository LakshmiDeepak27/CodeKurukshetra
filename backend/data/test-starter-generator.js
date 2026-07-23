const { parsePythonStarterCode } = require("../src/utils/starter-code-generator");

const sample1 = `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        pass`;

const sample2 = `class Solution:
    def reverseString(self, s: List[str]) -> None:
        pass`;

const sample3 = `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        pass`;

console.log("=== Sample 1: Two Sum ===");
console.log("C++:\n", parsePythonStarterCode(sample1).languages.cpp.starterCode);
console.log("Python:\n", parsePythonStarterCode(sample1).languages.python.starterCode);
console.log("Java:\n", parsePythonStarterCode(sample1).languages.java.starterCode);
console.log("JS:\n", parsePythonStarterCode(sample1).languages.js.starterCode);

console.log("=== Sample 2: Reverse String ===");
console.log("C++:\n", parsePythonStarterCode(sample2).languages.cpp.starterCode);

console.log("=== Sample 3: Longest Substring ===");
console.log("C++:\n", parsePythonStarterCode(sample3).languages.cpp.starterCode);
