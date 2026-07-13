#ifndef EXECUTOR_H
#define EXECUTOR_H

#include <string>

enum class ExecStatus { PASS, TLE, RE };

struct ExecResult {
  ExecStatus status;
  std::string output; // captured stdout
};

ExecResult executeProgram(const std::string &workspacePath,
                          const std::string &input, int timeLimitMs,
                          const std::string &language);

#endif
