#ifndef WORKSPACE_MANAGER_H
#define WORKSPACE_MANAGER_H
void cleanupAllWorkspaces();
#include <string>

// Creates a unique workspace directory and returns its path
std::string createWorkspace();

// Writes source code into workspace/main.cpp
bool writeSourceCode(const std::string &workspacePath, const std::string &code);

// Deletes the workspace directory
void cleanupWorkspace(const std::string &workspacePath);

#endif
