#define _SILENCE_EXPERIMENTAL_FILESYSTEM_DEPRECATION_WARNING

#include "workspace_manager.h"

#include <chrono>
#include <fstream>
#include <random>

#if defined(_MSC_VER) && (!defined(_MSVC_LANG) || _MSVC_LANG < 201703L)
#include <experimental/filesystem>
namespace fs = std::experimental::filesystem;
#else
#include <filesystem>
namespace fs = std::filesystem;
#endif

#ifdef _WIN32
#include <process.h>
#define getpid _getpid
#else
#include <unistd.h>
#endif

// --------------------------------------------------
// Create a unique workspace directory (ABSOLUTE SAFE)
// --------------------------------------------------
std::string createWorkspace() {
  // Generate unique id using timestamp, pid, and random salt
  auto timestamp = std::chrono::system_clock::now().time_since_epoch().count();
  std::random_device rd;
  int salt = rd() % 1'000'000;

  // Base workspace directory (relative to judge execution dir)
  fs::path base = fs::current_path() / "workspace";

  // Ensure base workspace directory exists
  fs::create_directories(base);

  // Create submission-specific directory
  fs::path workspacePath = base / (
    "submission_" + std::to_string(timestamp) +
    "_" + std::to_string(getpid()) +
    "_" + std::to_string(salt)
  );

  fs::create_directories(workspacePath);

  return workspacePath.string();
}

// --------------------------------------------------
// Cleanup ALL old workspaces (startup crash recovery)
// --------------------------------------------------
void cleanupAllWorkspaces() {
  fs::path base = fs::current_path() / "workspace";

  // If workspace directory does not exist, do nothing
  if (!fs::exists(base)) {
    return;
  }

  const auto cutoff = fs::file_time_type::clock::now() - std::chrono::hours(24);
  for (const auto &entry : fs::directory_iterator(base)) {
    std::error_code error;
    const auto modified = fs::last_write_time(entry.path(), error);
    // Do not delete active submissions from concurrent judge processes. This
    // is only crash recovery for stale workspaces.
    if (!error && modified < cutoff) {
      fs::remove_all(entry.path(), error);
    }
  }
}

// --------------------------------------------------
// Write user source code into workspace/main.cpp or corresponding language file
// --------------------------------------------------
bool writeSourceCode(const std::string &workspacePath,
                     const std::string &code,
                     const std::string &language) {
  std::string filename = "main.cpp";
  if (language == "python") {
    filename = "solution.py";
  } else if (language == "java") {
    filename = "Main.java";
  } else if (language == "js") {
    filename = "solution.js";
  }

  std::ofstream file(workspacePath + "/" + filename);

  if (!file.is_open())
    return false;

  file << code;
  file.close();

  return true;
}

// --------------------------------------------------
// Remove a single workspace directory
// --------------------------------------------------
void cleanupWorkspace(const std::string &workspacePath) {
  fs::remove_all(workspacePath);
}
