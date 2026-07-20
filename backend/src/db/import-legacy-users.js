const fs = require("fs");
const path = require("path");
const { pool } = require("../config/db");

const legacyUsersFile = path.join(__dirname, "..", "..", "data", "users.json");

async function importUsers() {
  if (!fs.existsSync(legacyUsersFile)) {
    console.log("No legacy users file found; nothing to import.");
    return;
  }

  const users = JSON.parse(fs.readFileSync(legacyUsersFile, "utf8"));
  if (!Array.isArray(users)) throw new Error("Legacy users file must contain an array");

  let imported = 0;
  for (const user of users) {
    if (!user.id || !user.name || !user.email) continue;
    const [existing] = await pool.execute("SELECT id FROM users WHERE email = :email LIMIT 1", { email: user.email.toLowerCase() });
    if (existing.length > 0) continue;

    await pool.execute(
      `INSERT INTO users (id, name, email, password_hash, provider, google_sub)
       VALUES (:id, :name, :email, :passwordHash, :provider, :googleSub)`,
      {
        id: user.id,
        name: user.name,
        email: user.email.toLowerCase(),
        passwordHash: user.passwordHash || null,
        provider: user.provider === "google" ? "google" : "password",
        googleSub: user.googleSub || null,
      }
    );
    imported += 1;
  }
  console.log(`Imported ${imported} legacy user(s).`);
}

importUsers()
  .catch((error) => { console.error("Legacy-user import failed:", error.message); process.exitCode = 1; })
  .finally(() => pool.end());
