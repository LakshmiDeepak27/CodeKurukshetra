const { query } = require("../config/db");
const { hashPassword, passwordMatches, issueToken } = require("../utils/crypto");
const crypto = require("crypto");
const config = require("../config/env");

function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    provider: row.provider,
  };
}

function authResponse(row) {
  return { token: issueToken(row.id), user: publicUser(row) };
}

async function findUserById(id) {
  const rows = await query("SELECT * FROM users WHERE id = :id LIMIT 1", { id });
  return rows[0] || null;
}

async function findUserByEmail(email) {
  const rows = await query("SELECT * FROM users WHERE email = :email LIMIT 1", { email });
  return rows[0] || null;
}

async function signup({ name, email, password }) {
  const existing = await findUserByEmail(email);
  if (existing) {
    const error = new Error("An account with this email already exists");
    error.status = 409;
    throw error;
  }

  const id = crypto.randomUUID();
  await query(
    `INSERT INTO users (id, name, email, password_hash, provider)
     VALUES (:id, :name, :email, :passwordHash, 'password')`,
    { id, name, email, passwordHash: hashPassword(password) }
  );

  return authResponse({ id, name, email, provider: "password" });
}

async function signin({ email, password }) {
  const user = await findUserByEmail(email);
  if (!user || !user.password_hash || !passwordMatches(password, user.password_hash)) {
    const error = new Error("Incorrect email or password");
    error.status = 401;
    throw error;
  }
  return authResponse(user);
}

async function googleSignIn(credential) {
  if (!config.googleClientId) {
    const error = new Error("Google authentication has not been configured");
    error.status = 503;
    throw error;
  }

  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
  const profile = await response.json();
  if (!response.ok || profile.aud !== config.googleClientId || ![true, "true"].includes(profile.email_verified)) {
    const error = new Error("Google sign-in could not be verified");
    error.status = 401;
    throw error;
  }

  const email = profile.email.toLowerCase();
  let user = await findUserByEmail(email);

  if (!user) {
    const id = crypto.randomUUID();
    const name = profile.name || email.split("@")[0];
    await query(
      `INSERT INTO users (id, name, email, provider, google_sub)
       VALUES (:id, :name, :email, 'google', :googleSub)`,
      { id, name, email, googleSub: profile.sub || null }
    );
    user = { id, name, email, provider: "google" };
  }

  return authResponse(user);
}

async function getOnlineUsersCount() {
  const rows = await query("SELECT COUNT(*) as activeCount FROM users");
  const count = Number(rows[0]?.activeCount || 0);
  return count > 0 ? count : 1;
}

module.exports = {
  publicUser,
  findUserById,
  signup,
  signin,
  googleSignIn,
  getOnlineUsersCount,
};
