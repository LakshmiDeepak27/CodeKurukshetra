#include "verdict.h"

Verdict decideVerdict(ExecStatus status, bool outputMatch) {
  if (status == ExecStatus::TLE)
    return Verdict::TLE;

  if (status == ExecStatus::RE)
    return Verdict::RE;

  if (!outputMatch)
    return Verdict::WA;

  return Verdict::AC;
}

Verdict decideFinalVerdict(bool samplePassed, bool hiddenPassed) {
  if (!samplePassed)
    return Verdict::WA;

  if (!hiddenPassed)
    return Verdict::WA;

  return Verdict::AC;
}

const char *verdictToString(Verdict v) {
  switch (v) {
  case Verdict::AC:
    return "Accepted";
  case Verdict::WA:
    return "Wrong Answer";
  case Verdict::TLE:
    return "Time Limit Exceeded";
  case Verdict::RE:
    return "Runtime Error";
  case Verdict::CE:
    return "Compilation Error";
  }
  return "Unknown";
}
