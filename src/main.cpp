#include <iostream>
#include <vector>

#include "compiler.h"
#include "json.hpp"
#include "judge.h"
#include "verdict.h"
#include "workspace_manager.h"

using json = nlohmann::json;

int main() {
  json output;
  try {
    cleanupAllWorkspaces();

    json input;
    if (!(std::cin >> input)) {
      output["verdict"] = "Runtime Error";
      output["sampleResults"] = json::array();
      output["hiddenSummary"] = {{"passed", false}};
      output["errorMessage"] = "Invalid judge input.";
      std::cout << output.dump();
      return 0;
    }

    std::string code = input.at("code").get<std::string>();
    int timeLimitMs = input.at("timeLimitMs").get<int>();
    int memoryLimitMb = input.value("memoryLimitMb", 256);
    std::string language = input.value("language", "cpp");

    if (timeLimitMs <= 0 || memoryLimitMb <= 0 || !input.contains("testCases") ||
        !input["testCases"].contains("sample") || !input["testCases"].contains("hidden")) {
      output["verdict"] = "Runtime Error";
      output["sampleResults"] = json::array();
      output["hiddenSummary"] = {{"passed", false}};
      output["errorMessage"] = "Invalid judge configuration.";
      std::cout << output.dump();
      return 0;
    }

    std::vector<TestCase> sampleCases;
    std::vector<TestCase> hiddenCases;

    for (auto &tc : input["testCases"]["sample"]) {
      sampleCases.push_back({tc.at("input").get<std::string>(), tc.at("expected").get<std::string>()});
    }

    for (auto &tc : input["testCases"]["hidden"]) {
      hiddenCases.push_back({tc.at("input").get<std::string>(), tc.at("expected").get<std::string>()});
    }

    std::string ws = createWorkspace();
    if (!writeSourceCode(ws, code, language)) {
      output["verdict"] = "Runtime Error";
      output["sampleResults"] = json::array();
      output["hiddenSummary"] = {{"passed", false}};
      output["errorMessage"] = "Could not create the submission workspace.";
      cleanupWorkspace(ws);
      std::cout << output.dump();
      return 0;
    }

    CompileResult cr = compileCode(ws, language);
    if (!cr.success) {
      output["verdict"] = "Compilation Error";
      output["sampleResults"] = json::array();
      output["hiddenSummary"] = {{"passed", false}};
      output["errorMessage"] = cr.errorMessage;
      cleanupWorkspace(ws);
      std::cout << output.dump();
      return 0;
    }

    JudgeResult sampleResult = judgeSampleCases(ws, sampleCases, timeLimitMs, memoryLimitMb, language);

    ExecStatus hiddenStatus = judgeHiddenCases(ws, hiddenCases, timeLimitMs, memoryLimitMb, language);
    bool hiddenPassed = hiddenStatus == ExecStatus::PASS;

    Verdict finalVerdict = decideFinalVerdict(sampleResult.allPassed, hiddenPassed);
    ExecStatus failure = sampleResult.failureStatus != ExecStatus::PASS
        ? sampleResult.failureStatus : hiddenStatus;
    if (failure == ExecStatus::TLE) finalVerdict = Verdict::TLE;
    else if (failure == ExecStatus::MLE) finalVerdict = Verdict::MLE;
    else if (failure == ExecStatus::RE) finalVerdict = Verdict::RE;

    output["verdict"] = verdictToString(finalVerdict);
    output["sampleResults"] = sampleResult.results;
    output["hiddenSummary"] = {{"passed", hiddenPassed}};

    cleanupWorkspace(ws);
    std::cout << output.dump();
  } catch (const std::exception &error) {
    output["verdict"] = "Runtime Error";
    output["sampleResults"] = json::array();
    output["hiddenSummary"] = {{"passed", false}};
    output["errorMessage"] = std::string("Invalid judge input: ") + error.what();
    std::cout << output.dump();
  }
}
