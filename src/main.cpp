#include <iostream>
#include <vector>

#include "compiler.h"
#include "json.hpp"
#include "judge.h"
#include "verdict.h"
#include "workspace_manager.h"

using json = nlohmann::json;

int main() {
  cleanupAllWorkspaces();

  json input;
  std::cin >> input;

  std::string code = input["code"];
  int timeLimitMs = input["timeLimitMs"];
  std::string language = input.value("language", "cpp");

  std::vector<TestCase> sampleCases;
  std::vector<TestCase> hiddenCases;

  for (auto &tc : input["testCases"]["sample"]) {
    sampleCases.push_back({tc["input"], tc["expected"]});
  }

  for (auto &tc : input["testCases"]["hidden"]) {
    hiddenCases.push_back({tc["input"], tc["expected"]});
  }

  std::string ws = createWorkspace();
  writeSourceCode(ws, code, language);

  json output;

  CompileResult cr = compileCode(ws, language);
  if (!cr.success) {
    output["verdict"] = "Compilation Error";
    output["sampleResults"] = json::array();
    output["hiddenSummary"] = {{"passed", false}};
    cleanupWorkspace(ws);
    std::cout << output.dump();
    return 0;
  }

  JudgeResult sampleResult = judgeSampleCases(ws, sampleCases, timeLimitMs, language);

  bool hiddenPassed = judgeHiddenCases(ws, hiddenCases, timeLimitMs, language);

  Verdict finalVerdict =
      decideFinalVerdict(sampleResult.allPassed, hiddenPassed);

  output["verdict"] = verdictToString(finalVerdict);
  output["sampleResults"] = sampleResult.results;
  output["hiddenSummary"] = {{"passed", hiddenPassed}};

  cleanupWorkspace(ws);
  std::cout << output.dump();
}
