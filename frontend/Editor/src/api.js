const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

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

export async function fetchProblems(queryParams = {}) {
  const params = new URLSearchParams();
  if (queryParams.page) params.append("page", queryParams.page);
  if (queryParams.limit) params.append("limit", queryParams.limit);
  if (queryParams.search) params.append("search", queryParams.search);
  if (queryParams.difficulty && queryParams.difficulty !== "All") params.append("difficulty", queryParams.difficulty);
  if (queryParams.tag) params.append("tag", queryParams.tag);

  const qs = params.toString() ? `?${params.toString()}` : "";
  const data = await request(`/problems${qs}`);
  return data.problems || (Array.isArray(data) ? data : []);
}

export function fetchProblem(problemId) {
  return request(`/problems/${problemId}`);
}

export async function fetchTestCases(problemId) {
  const data = await request(`/problems/${problemId}/testcases`);
  return data.sample || [];
}

export function voteProblem(problemId, type) {
  return request(`/problems/${problemId}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type }),
  });
}

export function addComment(problemId, author, text) {
  return request(`/problems/${problemId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ author, text }),
  });
}

export function fetchOnlineCount() {
  return request("/auth/online");
}

export function fetchCurrentUser() {
  return request("/auth/me");
}

export function updateProfile(profileData) {
  return request("/auth/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profileData),
  });
}

export async function fetchLeaderboard() {
  const data = await request("/leaderboard");
  return data.leaderboard || [];
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
