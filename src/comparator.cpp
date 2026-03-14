#include "comparator.h"
#include <algorithm>

// Helper: trim trailing whitespace
static std::string trimRight(std::string s) {
  while (!s.empty() && (s.back() == ' ' || s.back() == '\n' ||
                        s.back() == '\r' || s.back() == '\t')) {
    s.pop_back();
  }
  return s;
}

bool compareOutput(const std::string &actual, const std::string &expected) {
  return trimRight(actual) == trimRight(expected);
}
