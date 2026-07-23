import { io } from "socket.io-client";

const API = import.meta.env.VITE_API_URL || "/api";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (window.location.origin.includes("localhost") ? "http://localhost:5000" : window.location.origin);

function getHeaders() {
  const token = localStorage.getItem("ck_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function initBattleSocket() {
  const token = localStorage.getItem("ck_token");
  return io(SOCKET_URL, {
    auth: { token },
    query: { token },
    transports: ["websocket", "polling"],
  });
}

export async function fetchBattleTopics() {
  const res = await fetch(`${API}/battles/topics`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch battle topics");
  return res.json();
}

export async function joinBattleQueue(topic) {
  const res = await fetch(`${API}/battles/queue`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ topic }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to join matchmaking queue");
  }
  return res.json();
}

export async function leaveBattleQueue() {
  const res = await fetch(`${API}/battles/queue`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error("Failed to leave matchmaking queue");
  return res.json();
}

export async function createPrivateBattleRoom(topic) {
  const res = await fetch(`${API}/battles/create-room`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ topic }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to create private room");
  }
  return res.json();
}

export async function joinBattleRoomByCode(code) {
  const res = await fetch(`${API}/battles/${encodeURIComponent(code)}/join`, {
    method: "POST",
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to join battle room");
  }
  return res.json();
}

export async function fetchBattleState(battleId) {
  const res = await fetch(`${API}/battles/${battleId}`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch battle state");
  return res.json();
}

export async function submitBattleCode(battleId, code, language) {
  const res = await fetch(`${API}/battles/${battleId}/submit`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ code, language }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to submit battle solution");
  }
  return res.json();
}

export async function forfeitBattleMatch(battleId) {
  const res = await fetch(`${API}/battles/${battleId}/forfeit`, {
    method: "POST",
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error("Failed to forfeit battle");
  return res.json();
}
