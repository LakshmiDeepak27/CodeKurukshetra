const PLACEHOLDER = /{{(solution|inputParser|outputFormatter)}}/g;

function computeSolutionLineOffset(driverTemplate) {
  if (typeof driverTemplate !== "string") return 0;
  const idx = driverTemplate.indexOf("{{solution}}");
  if (idx === -1) return 0;
  return driverTemplate.slice(0, idx).split("\n").length - 1;
}

function assembleFunctionSolution(wrapper, language, solution) {
  const languageConfig = wrapper?.languages?.[language];
  if (!languageConfig) {
    const error = new Error(`Function-style submissions are not configured for ${language}`);
    error.status = 422;
    throw error;
  }
  for (const field of ["driverTemplate", "inputParser", "outputFormatter"]) {
    if (typeof languageConfig[field] !== "string" || !languageConfig[field].trim()) {
      const error = new Error(`Invalid function wrapper metadata: ${field} is required for ${language}`);
      error.status = 500;
      throw error;
    }
  }
  const assembled = languageConfig.driverTemplate.replace(PLACEHOLDER, (_match, key) => ({
    solution,
    inputParser: languageConfig.inputParser,
    outputFormatter: languageConfig.outputFormatter,
  })[key]);

  return {
    code: assembled,
    solutionLineOffset: computeSolutionLineOffset(languageConfig.driverTemplate),
  };
}

function starterCode(wrapper, language) {
  return wrapper?.languages?.[language]?.starterCode || null;
}

module.exports = { assembleFunctionSolution, starterCode, computeSolutionLineOffset };
