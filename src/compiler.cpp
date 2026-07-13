#include "compiler.h"

#include <fcntl.h> // open
#include <fstream>
#include <sys/wait.h> // waitpid
#include <unistd.h>   // fork, exec

CompileResult compileCpp(const std::string &workspacePath) {
  std::string sourceFile = workspacePath + "/main.cpp";
  std::string outputFile = workspacePath + "/program";
  std::string errorFile = workspacePath + "/compile.err";

  pid_t pid = fork();

  if (pid == 0) {
    // CHILD PROCESS → runs g++

    int errFd = open(errorFile.c_str(), O_WRONLY | O_CREAT | O_TRUNC, 0644);

    // Redirect stderr (compiler errors) to file
    dup2(errFd, STDERR_FILENO);
    close(errFd);

    execlp("g++", "g++", sourceFile.c_str(), "-std=c++17", "-O2", "-o",
           outputFile.c_str(), NULL);

    // Only reached if exec fails
    _exit(1);
  }

  // PARENT PROCESS (judge)
  int status;
  waitpid(pid, &status, 0);

  if (WIFEXITED(status) && WEXITSTATUS(status) == 0) {
    return {true, ""};
  }

  // Read compiler error message
  std::ifstream err(errorFile);
  std::string msg((std::istreambuf_iterator<char>(err)),
                  std::istreambuf_iterator<char>());

  return {false, msg};
}

CompileResult compileCode(const std::string &workspacePath, const std::string &language) {
  if (language == "cpp") {
    return compileCpp(workspacePath);
  } else if (language == "java") {
    std::string sourceFile = workspacePath + "/Main.java";
    std::string errorFile = workspacePath + "/compile.err";

    pid_t pid = fork();

    if (pid == 0) {
      int errFd = open(errorFile.c_str(), O_WRONLY | O_CREAT | O_TRUNC, 0644);
      dup2(errFd, STDERR_FILENO);
      close(errFd);

      execlp("javac", "javac", sourceFile.c_str(), NULL);
      _exit(1);
    }

    int status;
    waitpid(pid, &status, 0);

    if (WIFEXITED(status) && WEXITSTATUS(status) == 0) {
      return {true, ""};
    }

    std::ifstream err(errorFile);
    std::string msg((std::istreambuf_iterator<char>(err)),
                    std::istreambuf_iterator<char>());

    if (msg.empty()) {
      msg = "Compilation failed (javac might not be installed or source file is empty).";
    }
    return {false, msg};
  }

  // Python and JavaScript don't require compilation
  return {true, ""};
}
