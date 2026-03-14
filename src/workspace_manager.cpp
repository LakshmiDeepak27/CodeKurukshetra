#include "workspace_manager.h"

#include <chrono>
#include <filesystem>
#include <fstream>

namespace fs = std::filesystem;

// --------------------------------------------------
// Create a unique workspace directory (ABSOLUTE SAFE)
// --------------------------------------------------
std::string createWorkspace() {
  // Generate unique id using timestamp
  auto timestamp = std::chrono::system_clock::now().time_since_epoch().count();

  // Base workspace directory (relative to judge execution dir)
  fs::path base = fs::current_path() / "workspace";

  // Ensure base workspace directory exists
  fs::create_directories(base);

  // Create submission-specific directory
  fs::path workspacePath = base / ("submission_" + std::to_string(timestamp));

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

  for (const auto &entry : fs::directory_iterator(base)) {
    fs::remove_all(entry.path());
  }
}

// --------------------------------------------------
// Write user source code into workspace/main.cpp
// --------------------------------------------------
bool writeSourceCode(const std::string &workspacePath,
                     const std::string &code) {
  std::ofstream file(workspacePath + "/main.cpp");

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
