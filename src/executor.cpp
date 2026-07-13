#include "executor.h"

#include <chrono>
#include <fcntl.h> // open
#include <fstream>
#include <signal.h>   // kill
#include <sys/wait.h> // waitpid
#include <thread>
#include <unistd.h> // fork, exec, dup2

ExecResult executeProgram(const std::string &workspacePath,
                          const std::string &input, int timeLimitMs,
                          const std::string &language) {
  std::string programPath = workspacePath + "/program";
  std::string inputFile = workspacePath + "/input.txt";
  std::string outputFile = workspacePath + "/output.txt";

  // 1. Write input to file
  {
    std::ofstream in(inputFile);
    in << input;
  }

  pid_t pid = fork();

  if (pid == 0) {
    // CHILD PROCESS: run user program

    int inFd = open(inputFile.c_str(), O_RDONLY);
    int outFd = open(outputFile.c_str(), O_WRONLY | O_CREAT | O_TRUNC, 0644);
    int errFd = open(outputFile.c_str(), O_WRONLY | O_APPEND);

    dup2(inFd, STDIN_FILENO);
    dup2(outFd, STDOUT_FILENO);
    dup2(errFd, STDERR_FILENO);

    close(inFd);
    close(outFd);
    close(errFd);

    if (language == "cpp") {
      execl(programPath.c_str(), programPath.c_str(), NULL);
    } else if (language == "python") {
      std::string pyPath = workspacePath + "/solution.py";
      execlp("python3", "python3", pyPath.c_str(), NULL);
    } else if (language == "java") {
      execlp("java", "java", "-cp", workspacePath.c_str(), "Main", NULL);
    } else if (language == "js") {
      std::string jsPath = workspacePath + "/solution.js";
      execlp("node", "node", jsPath.c_str(), NULL);
    }

    // If exec fails → runtime error
    _exit(1);
  }

  // PARENT PROCESS: enforce time limit
  auto start = std::chrono::steady_clock::now();
  int status;

  while (true) {
    pid_t result = waitpid(pid, &status, WNOHANG);

    if (result == pid) {
      // Child finished
      break;
    }

    auto now = std::chrono::steady_clock::now();
    int elapsed =
        std::chrono::duration_cast<std::chrono::milliseconds>(now - start)
            .count();

    if (elapsed > timeLimitMs) {
      // Time limit exceeded
      kill(pid, SIGKILL);
      waitpid(pid, &status, 0);
      return {ExecStatus::TLE, ""};
    }

    // Sleep a bit to avoid busy waiting
    std::this_thread::sleep_for(std::chrono::microseconds(200));
  }

  // Check runtime error
  if (!(WIFEXITED(status) && WEXITSTATUS(status) == 0)) {
    return {ExecStatus::RE, ""};
  }

  // Read output
  std::ifstream out(outputFile);
  std::string output((std::istreambuf_iterator<char>(out)),
                     std::istreambuf_iterator<char>());

  return {ExecStatus::PASS, output};
}
