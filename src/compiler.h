#ifndef COMPILER_H
#define COMPILER_H

#include <string>

// Result of compilation
struct CompileResult {
  bool success;             // true if compilation succeeded
  std::string errorMessage; // compiler error output
};

// Compiles workspace/main.cpp into workspace/program
CompileResult compileCpp(const std::string &workspacePath);

// Generic compilation dispatch function
CompileResult compileCode(const std::string &workspacePath, const std::string &language);

#endif
