#include "executor.h"

#include <chrono>
#include <fstream>

#ifdef _WIN32

// DEV-ONLY WINDOWS FALLBACK (NO PROCESS/MEMORY SANDBOXING)
// This branch is provided solely for local development on Windows systems.
// Production deployment target MUST be Linux where POSIX user isolation
// (ck-sandbox), resource limits (rlimit), and process sandboxing run.

#include <cstdlib>

ExecResult executeProgram(const std::string &workspacePath,
                          const std::string &input, int timeLimitMs, int memoryLimitMb,
                          const std::string &language) {
  if (timeLimitMs <= 0 || memoryLimitMb <= 0) {
    return {ExecStatus::RE, ""};
  }
  (void)memoryLimitMb;
  std::string programPath = workspacePath + "/program.exe";
  std::string inputFile = workspacePath + "/input.txt";
  std::string outputFile = workspacePath + "/output.txt";

  {
    std::ofstream in(inputFile);
    in << input;
  }

  std::string cmd;
  if (language == "cpp") {
    cmd = "\"" + programPath + "\" < \"" + inputFile + "\" > \"" + outputFile + "\" 2>&1";
  } else if (language == "python") {
    cmd = "python3 \"" + workspacePath + "/solution.py\" < \"" + inputFile + "\" > \"" + outputFile + "\" 2>&1";
  } else if (language == "java") {
    cmd = "java -cp \"" + workspacePath + "\" Main < \"" + inputFile + "\" > \"" + outputFile + "\" 2>&1";
  } else if (language == "js") {
    cmd = "node \"" + workspacePath + "/solution.js\" < \"" + inputFile + "\" > \"" + outputFile + "\" 2>&1";
  } else {
    return {ExecStatus::RE, ""};
  }

  auto start = std::chrono::steady_clock::now();
  int res = std::system(cmd.c_str());
  auto end = std::chrono::steady_clock::now();
  int elapsed = static_cast<int>(std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count());

  if (elapsed > timeLimitMs) {
    return {ExecStatus::TLE, ""};
  }

  if (res != 0) {
    return {ExecStatus::RE, ""};
  }

  std::ifstream out(outputFile);
  std::string output((std::istreambuf_iterator<char>(out)),
                     std::istreambuf_iterator<char>());

  return {ExecStatus::PASS, output};
}

#else

#include <cstdio>
#include <fcntl.h> // open
#include <grp.h>
#include <pwd.h>
#include <signal.h>   // kill
#include <sys/resource.h>
#include <sys/wait.h> // waitpid
#include <thread>
#include <unistd.h> // fork, exec, dup2

ExecResult executeProgram(const std::string &workspacePath,
                          const std::string &input, int timeLimitMs, int memoryLimitMb,
                          const std::string &language) {
  if (timeLimitMs <= 0 || memoryLimitMb <= 0) {
    return {ExecStatus::RE, ""};
  }
  std::string programPath = workspacePath + "/program";
  std::string inputFile = workspacePath + "/input.txt";
  std::string outputFile = workspacePath + "/output.txt";

  // 1. Write input to file
  {
    std::ofstream in(inputFile);
    in << input;
  }

  pid_t pid = fork();
  if (pid < 0) {
    return {ExecStatus::RE, ""};
  }

  // Avoid a race where a very short time limit expires before the child has
  // placed itself in its own process group.
  if (pid > 0) {
    setpgid(pid, pid);
  }

  if (pid == 0) {
    // CHILD PROCESS: run user program

    // Give the submission its own process group so a timeout also stops any
    // child processes it created.
    setpgid(0, 0);

    int inFd = open(inputFile.c_str(), O_RDONLY);
    int outFd = open(outputFile.c_str(), O_WRONLY | O_CREAT | O_TRUNC, 0644);
    int errFd = open(outputFile.c_str(), O_WRONLY | O_APPEND);

    dup2(inFd, STDIN_FILENO);
    dup2(outFd, STDOUT_FILENO);
    dup2(errFd, STDERR_FILENO);

    close(inFd);
    close(outFd);
    close(errFd);

    // 1. Cap memory
    struct rlimit memoryLimit{};
    memoryLimit.rlim_cur = memoryLimit.rlim_max =
        static_cast<rlim_t>(memoryLimitMb) * 1024 * 1024;
    setrlimit(RLIMIT_AS, &memoryLimit);

    // 2. Cap CPU time
    struct rlimit cpuLimit{};
    cpuLimit.rlim_cur = cpuLimit.rlim_max = (timeLimitMs / 1000) + 2;
    setrlimit(RLIMIT_CPU, &cpuLimit);

    // 3. Cap number of processes/threads
    struct rlimit nprocLimit{};
    nprocLimit.rlim_cur = nprocLimit.rlim_max = 16;
    setrlimit(RLIMIT_NPROC, &nprocLimit);

    // 4. Cap output file size
    struct rlimit fsizeLimit{};
    fsizeLimit.rlim_cur = fsizeLimit.rlim_max = 16 * 1024 * 1024; // 16MB
    setrlimit(RLIMIT_FSIZE, &fsizeLimit);

    // 5. Drop privileges to dedicated unprivileged user (FAIL CLOSED)
    struct passwd *sandboxUser = getpwnam("ck-sandbox");
    if (!sandboxUser) {
      fprintf(stderr, "FATAL: ck-sandbox user not found, refusing to execute untrusted code\n");
      _exit(2);
    }
    setgroups(0, nullptr);
    setgid(sandboxUser->pw_gid);
    setuid(sandboxUser->pw_uid);

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
  struct rusage usage {};

  while (true) {
    pid_t result = wait4(pid, &status, WNOHANG, &usage);

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
      kill(-pid, SIGKILL);
      wait4(pid, &status, 0, &usage);
      return {ExecStatus::TLE, ""};
    }

    // Sleep a bit to avoid busy waiting
    std::this_thread::sleep_for(std::chrono::microseconds(200));
  }

  // Check runtime error
  if (!(WIFEXITED(status) && WEXITSTATUS(status) == 0)) {
    if (usage.ru_maxrss >= static_cast<long>(memoryLimitMb) * 1024)
      return {ExecStatus::MLE, ""};
    return {ExecStatus::RE, ""};
  }

  // Read output
  std::ifstream out(outputFile);
  std::string output((std::istreambuf_iterator<char>(out)),
                     std::istreambuf_iterator<char>());

  return {ExecStatus::PASS, output};
}

#endif
