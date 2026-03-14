const API = "http://localhost:3000";

export async function fetchProblem(problemId) {
  const res = await fetch(`${API}/problems/${problemId}`);
  return res.json();
}

export async function fetchTestCases(problemId) {
  const res = await fetch(`${API}/problems/${problemId}/testcases`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.sample || [];
}

export async function submitCode(problemId, code, lang, mode = "submit") {
  const res = await fetch(`${API}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      problemId,
      code,
      language: lang,
      mode,
    }),
  });

  return res.json();
}
