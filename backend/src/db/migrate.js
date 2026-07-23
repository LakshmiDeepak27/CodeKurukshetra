const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

const config = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "code_kurukshetra",
};

async function addColumnIfMissing(db, table, column, definition) {
  try {
    const [cols] = await db.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [column]);
    if (cols.length === 0) {
      await db.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
      console.log(`Added column ${column} to ${table}`);
    }
  } catch (err) {
    console.warn(`Column check failed for ${table}.${column}:`, err.message);
  }
}

async function migrate() {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");

  const admin = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    multipleStatements: true,
  });

  await admin.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await admin.end();

  const db = await mysql.createConnection({
    ...config,
    multipleStatements: true,
  });

  await db.query(schema);

  // Apply incremental column updates for existing installations
  await addColumnIfMissing(db, "users", "role", "ENUM('user', 'admin') NOT NULL DEFAULT 'user'");
  await addColumnIfMissing(db, "users", "bio", "VARCHAR(512) NULL");
  await addColumnIfMissing(db, "users", "institution", "VARCHAR(255) NULL");
  await addColumnIfMissing(db, "users", "preferred_language", "VARCHAR(32) NOT NULL DEFAULT 'cpp'");
  await addColumnIfMissing(db, "users", "avatar_url", "VARCHAR(512) NULL");
  await addColumnIfMissing(db, "users", "battle_rating", "INT UNSIGNED NOT NULL DEFAULT 1200");
  await addColumnIfMissing(db, "users", "last_seen_at", "TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
  await addColumnIfMissing(db, "submissions", "battle_id", "CHAR(36) NULL");

  await db.end();

  console.log(`MySQL schema applied to database "${config.database}"`);
}

if (require.main === module) {
  migrate().catch((error) => {
    console.error("Migration failed:", error.message);
    process.exit(1);
  });
}

module.exports = { migrate };
