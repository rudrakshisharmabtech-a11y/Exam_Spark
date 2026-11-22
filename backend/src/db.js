import mysql from "mysql2/promise";

const requiredDatabaseSettings = ["DB_HOST", "DB_USER", "DB_NAME"];
export const databaseConfigured = requiredDatabaseSettings.every((key) => process.env[key]);

export const pool = databaseConfigured
  ? mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
      enableKeepAlive: true,
      charset: "utf8mb4",
    })
  : null;

export function requirePool() {
  if (!pool) {
    const error = new Error("MySQL is not configured. Copy .env.example to .env and set DB_HOST, DB_USER and DB_NAME.");
    error.status = 503;
    throw error;
  }
  return pool;
}

export async function healthCheck() {
  if (!pool) return { databaseConfigured: false, database: "not_configured" };
  await pool.query("SELECT 1");
  return { databaseConfigured: true, database: "connected" };
}
