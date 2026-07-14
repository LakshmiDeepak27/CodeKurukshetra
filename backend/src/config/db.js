const mysql = require("mysql2/promise");
const config = require("./env");

const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: config.db.connectionLimit,
  namedPlaceholders: true,
});

async function query(sql, params) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function ping() {
  await pool.query("SELECT 1");
}

module.exports = { pool, query, ping };
