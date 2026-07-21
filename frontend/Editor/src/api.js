const API = import.meta.env.VITE_API_URL || "/api";

function sessionHeaders() {
  const token = localStorage.getItem("ck_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { ...sessionHeaders(), ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "The server could not complete this request");
  return data;
}

export async function fetchProblems() {
  const data = await request("/problems");
  return data.problems || [];
}

export function fetchProblem(problemId) {
  return request(`/problems/${problemId}`);
}

export async function fetchTestCases(problemId) {
  const data = await request(`/problems/${problemId}/testcases`);
  return data.sample || [];
}

export function fetchCurrentUser() {
  return request("/auth/me");
}

export function fetchMySubmissions(problemId) {
  const query = problemId ? `?problemId=${encodeURIComponent(problemId)}` : "";
  return request(`/submissions/me${query}`);
}

export function submitCode(problemId, code, language, mode = "submit") {
  return request("/submissions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ problemId, code, language, mode }),
  });
}

export function runCustomCases(problemId, code, language, testCases) {
  return request("/submissions/custom-run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ problemId, code, language, testCases }),
  });
}
