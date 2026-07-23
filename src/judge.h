#ifndef JUDGE_H
#define JUDGE_H

#include "json.hpp"
#include "executor.h"
#include "testcase.h"
#include <string>
#include <vector>

using json = nlohmann::json;

struct JudgeResult {
  bool allPassed;
  json results;
  ExecStatus failureStatus;
};

JudgeResult judgeSampleCases(const std::string &workspacePath,
                             const std::vector<TestCase> &cases,
                             int timeLimitMs, int memoryLimitMb,
                             const std::string &language);

ExecStatus judgeHiddenCases(const std::string &workspacePath,
                      const std::vector<TestCase> &cases, int timeLimitMs, int memoryLimitMb,
                      const std::string &language);

#endif
