#ifndef VERDICT_H
#define VERDICT_H

#include "executor.h"

enum class Verdict { AC, WA, TLE, MLE, RE, CE };

// Per-test verdict (already correct)
Verdict decideVerdict(ExecStatus execStatus, bool outputMatch);

// 👇 ADD THIS (submission-level verdict)
Verdict decideFinalVerdict(bool samplePassed, bool hiddenPassed);

const char *verdictToString(Verdict v);

#endif
