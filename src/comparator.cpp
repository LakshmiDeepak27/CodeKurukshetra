#include "comparator.h"
#include <vector>

static std::vector<std::string> normalizedLines(const std::string &s) {
  std::vector<std::string> lines;
  std::string cur;
  for (char c : s) {
    if (c == '\r') continue; // strip CR, keep LF as separator
    if (c == '\n') {
      lines.push_back(cur);
      cur.clear();
    } else {
      cur += c;
    }
  }
  if (!cur.empty()) lines.push_back(cur);

  // trim trailing whitespace on each line
  for (auto &line : lines) {
    while (!line.empty() && (line.back() == ' ' || line.back() == '\t')) {
      line.pop_back();
    }
  }

  // drop trailing empty lines
  while (!lines.empty() && lines.back().empty()) {
    lines.pop_back();
  }
  return lines;
}

bool compareOutput(const std::string &actual, const std::string &expected) {
  return normalizedLines(actual) == normalizedLines(expected);
}
