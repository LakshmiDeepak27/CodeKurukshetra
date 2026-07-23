#include "judge.h"
#include "comparator.h"
#include "executor.h"

JudgeResult judgeSampleCases(const std::string &workspacePath,
                             const std::vector<TestCase> &cases,
                             int timeLimitMs, int memoryLimitMb,
                             const std::string &language) {
  json results = json::array();
  bool allPassed = true;
  ExecStatus failureStatus = ExecStatus::PASS;

  int idx = 1;
  for (const auto &tc : cases) {
    ExecResult exec = executeProgram(workspacePath, tc.input, timeLimitMs, memoryLimitMb, language);

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
      if (failureStatus == ExecStatus::PASS) failureStatus = ExecStatus::TLE;
      break;

    case ExecStatus::RE:
      statusStr = "RE";
      allPassed = false;
      if (failureStatus == ExecStatus::PASS) failureStatus = ExecStatus::RE;
      break;
    case ExecStatus::MLE:
      statusStr = "MLE";
      allPassed = false;
      if (failureStatus == ExecStatus::PASS) failureStatus = ExecStatus::MLE;
      break;
    }

    if (!passed && exec.status == ExecStatus::PASS)
      allPassed = false;

    std::string status;

    if (exec.status == ExecStatus::TLE)
      status = "TLE";
    else if (exec.status == ExecStatus::RE)
      status = "RE";
    else if (exec.status == ExecStatus::MLE)
      status = "MLE";
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

  return {allPassed, results, failureStatus};
}

ExecStatus judgeHiddenCases(const std::string &workspacePath,
                      const std::vector<TestCase> &cases, int timeLimitMs, int memoryLimitMb,
                      const std::string &language) {
  for (const auto &tc : cases) {
    ExecResult exec = executeProgram(workspacePath, tc.input, timeLimitMs, memoryLimitMb, language);

    if (exec.status != ExecStatus::PASS)
      return exec.status;

    if (!compareOutput(exec.output, tc.expected))
      return ExecStatus::WA;
  }
  return ExecStatus::PASS;
}
