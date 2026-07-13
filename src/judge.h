#ifndef JUDGE_H
#define JUDGE_H

#include "json.hpp"
#include "testcase.h"
#include <string>
#include <vector>

using json = nlohmann::json;

struct JudgeResult {
  bool allPassed;
  json results;
};

JudgeResult judgeSampleCases(const std::string &workspacePath,
                             const std::vector<TestCase> &cases,
                             int timeLimitMs,
                             const std::string &language);

bool judgeHiddenCases(const std::string &workspacePath,
                      const std::vector<TestCase> &cases, int timeLimitMs,
                      const std::string &language);

#endif
