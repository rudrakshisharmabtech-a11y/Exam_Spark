import "dotenv/config";
import { healthCheck, requirePool } from "./db.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log("=================================================================");
console.log("  EXAMSPARK LIVE DATABASE USER & CREDENTIAL VIEWER");
console.log("=================================================================");

async function viewDatabaseUsers() {
  const status = await healthCheck();
  console.log(`Database Mode: ${status.mode || status.database}`);
  console.log(`Connection Status: ${status.database}`);
  if (status.provider) console.log(`Provider: ${status.provider}`);
  console.log("-----------------------------------------------------------------");

  const pool = requirePool();

  try {
    let users = [];
    let profiles = [];
    let oauth = [];

    // Check if live MySQL pool with query method
    if (status.mode === "live") {
      const [u] = await pool.query(
        "SELECT id, full_name, email, role, status, password_hash, created_at FROM users ORDER BY id DESC"
      );
      users = u;
      const [p] = await pool.query("SELECT * FROM student_profiles");
      profiles = p;
      const [o] = await pool.query("SELECT * FROM oauth_accounts");
      oauth = o;
    } else {
      // Local persistent store
      const localPath = path.join(__dirname, "data", "local_db.json");
      if (fs.existsSync(localPath)) {
        const data = JSON.parse(fs.readFileSync(localPath, "utf8"));
        users = data.users || [];
        profiles = data.student_profiles || [];
        oauth = data.oauth_accounts || [];
      }
    }

    if (users.length === 0) {
      console.log("\nNo registered accounts found yet.");
      console.log("To create an account:");
      console.log("1. Open the website at http://localhost:8443");
      console.log("2. Click 'Create account' or 'Continue with Google'");
      console.log("3. Fill in your details and click submit.");
      console.log("4. Then run this script again: npm run view:users\n");
      return;
    }

    console.log(`\nFound ${users.length} registered user account(s):\n`);

    for (const user of users) {
      const studentProfile = profiles.find((p) => Number(p.user_id) === Number(user.id));
      const oauthLink = oauth.find((o) => Number(o.user_id) === Number(user.id));

      console.log(`[USER ID: ${user.id}]`);
      console.log(`  Name:             ${user.full_name || user.name}`);
      console.log(`  Email:            ${user.email}`);
      console.log(`  Role:             ${user.role.toUpperCase()}`);
      console.log(`  Status:           ${user.status || "active"}`);
      console.log(`  Registered On:    ${user.created_at || "N/A"}`);
      console.log(`  Password Stored:  ${user.password_hash ? "Bcrypt Hashed (" + user.password_hash.substring(0, 15) + "...)" : "None (OAuth Managed)"}`);

      if (studentProfile) {
        console.log(`  Student Roll No:  ${studentProfile.roll_number}`);
        console.log(`  Section:          ${studentProfile.section}`);
        if (studentProfile.github_profile) {
          console.log(`  GitHub Profile:   ${studentProfile.github_profile}`);
        }
      }

      if (oauthLink) {
        console.log(`  OAuth Linked:     ${oauthLink.provider.toUpperCase()} (ID: ${oauthLink.provider_user_id})`);
      }

      console.log("-----------------------------------------------------------------");
    }
  } catch (error) {
    console.error("Error reading database:", error.message);
  } finally {
    process.exit(0);
  }
}

viewDatabaseUsers();
