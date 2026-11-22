import "dotenv/config";
import mysql from "mysql2/promise";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log("=================================================================");
console.log("  EXAMSPARK DATABASE INITIALIZER (RAILWAY / MYSQL)");
console.log("=================================================================");

async function initDatabase() {
  const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL || process.env.MYSQL_PRIVATE_URL;
  const host = process.env.MYSQLHOST || process.env.DB_HOST || "localhost";
  const user = process.env.MYSQLUSER || process.env.DB_USER || "root";
  const password = process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || "";
  const database = process.env.MYSQLDATABASE || process.env.DB_NAME || "examspark";
  const port = Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306);

  let connection;
  try {
    console.log(`Connecting to database...`);
    if (dbUrl) {
      console.log(`Using Connection URL: ${dbUrl.replace(/:[^:@]+@/, ":****@")}`);
      connection = await mysql.createConnection(dbUrl);
    } else {
      console.log(`Host: ${host}:${port}, User: ${user}, Database: ${database}`);
      connection = await mysql.createConnection({ host, port, user, password, database });
    }

    console.log("✓ Connected to MySQL database successfully.");

    const schemaPath = path.join(__dirname, "schema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf8");

    // Remove CREATE DATABASE / USE statements if present (for cloud/shared databases)
    const statements = schemaSql
      .replace(/CREATE DATABASE[^;]+;/gi, "")
      .replace(/USE [^;]+;/gi, "")
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    console.log(`Executing ${statements.length} schema statements...`);

    for (const stmt of statements) {
      try {
        await connection.query(stmt);
      } catch (err) {
        if (!err.message.includes("already exists")) {
          console.warn(`Warning on statement: ${err.message}`);
        }
      }
    }

    console.log("✓ All tables created and verified successfully!");
    console.log("\nTables in database:");
    const [tables] = await connection.query("SHOW TABLES");
    console.table(tables);

  } catch (error) {
    console.error("Database initialization failed:", error.message);
    console.log("\nIf you are using Railway:");
    console.log("1. Open your Railway project and add a MySQL service.");
    console.log("2. Copy the 'MySQL Connection URL' or individual credentials.");
    console.log("3. Paste into backend/.env as DATABASE_URL=...");
    console.log("4. Run `npm run init:db` again.");
  } finally {
    if (connection) await connection.end();
    process.exit(0);
  }
}

initDatabase();
