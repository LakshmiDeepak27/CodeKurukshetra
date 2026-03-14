#include "judge.h"
#include "comparator.h"
#include "executor.h"

JudgeResult judgeSampleCases(const std::string &workspacePath,
                             const std::vector<TestCase> &cases,
                             int timeLimitMs) {
  json results = json::array();
  bool allPassed = true;

  int idx = 1;
  for (const auto &tc : cases) {
    ExecResult exec = executeProgram(workspacePath, tc.input, timeLimitMs);

    bool passed = false;
    std::string statusStr;

    switch (exec.status) {
    case ExecStatus::PASS:
      passed = compareOutput(exec.output, tc.expected);
      statusStr = passed ? "PASS" : "WA";
      break;

    case ExecStatus::TLE:
      statusStr = "TLE";
      allPassed = false;
      break;

    case ExecStatus::RE:
      statusStr = "RE";
      allPassed = false;
      break;
    }

    if (!passed && exec.status == ExecStatus::PASS)
      allPassed = false;

    std::string status;

    if (exec.status == ExecStatus::TLE)
      status = "TLE";
    else if (exec.status == ExecStatus::RE)
      status = "RE";
    else if (!passed)
      status = "WA";
    else
      status = "PASS";

    results.push_back({{"index", idx++},
                       {"input", tc.input},
                       {"expected", tc.expected},
                       {"output", exec.output},
                       {"passed", passed},
                       {"status", status}});
  }

  return {allPassed, results};
}

bool judgeHiddenCases(const std::string &workspacePath,
                      const std::vector<TestCase> &cases, int timeLimitMs) {
  for (const auto &tc : cases) {
    ExecResult exec = executeProgram(workspacePath, tc.input, timeLimitMs);

    if (exec.status != ExecStatus::PASS)
      return false;

    if (!compareOutput(exec.output, tc.expected))
      return false;
  }
  return true;
}
