import "dotenv/config";
import bcrypt from "bcryptjs";
import { pool, requirePool } from "./db.js";

async function createFirstAdmin() {
  const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim();
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!name || !email || !password || password.length < 12) {
    throw new Error("Set BOOTSTRAP_ADMIN_NAME, BOOTSTRAP_ADMIN_EMAIL, and a 12+ character BOOTSTRAP_ADMIN_PASSWORD temporarily in .env.");
  }
  const db = requirePool();
  const [admins] = await db.execute("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  if (admins.length) {
    throw new Error("An administrator already exists; bootstrap only creates the first admin.");
  }
  await db.execute(
    "INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, 'admin')",
    [name, email, await bcrypt.hash(password, 12)],
  );
  console.log(`Created initial administrator account for ${email}. Remove the bootstrap password from .env.`);
}

try {
  await createFirstAdmin();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (pool) await pool.end();
}
