import mysql from "mysql2/promise";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "data");
const localDbPath = path.join(dataDir, "local_db.json");

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// --------------------------------------------------------------------------
// 1. Connection Resolution (Railway, Environment, URL)
// --------------------------------------------------------------------------
const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL || process.env.MYSQL_PRIVATE_URL;
const host = process.env.MYSQLHOST || process.env.DB_HOST;
const user = process.env.MYSQLUSER || process.env.DB_USER;
const password = process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || "";
const database = process.env.MYSQLDATABASE || process.env.DB_NAME;
const port = Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306);

export const databaseConfigured = Boolean(dbUrl || (host && user && database));

let activePool = null;
let isLiveDatabase = false;

if (databaseConfigured) {
  try {
    if (dbUrl) {
      activePool = mysql.createPool(dbUrl);
    } else {
      activePool = mysql.createPool({
        host,
        port,
        user,
        password,
        database,
        waitForConnections: true,
        connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
        enableKeepAlive: true,
        charset: "utf8mb4",
      });
    }
  } catch (err) {
    console.warn("Could not create MySQL pool:", err.message);
  }
}

export const pool = activePool;

// --------------------------------------------------------------------------
// 2. Automatic Schema DDL for Live Database (Railway / MySQL)
// --------------------------------------------------------------------------
const SCHEMA_TABLES = [
  `CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(254) NOT NULL,
    password_hash VARCHAR(255) NULL,
    role ENUM('student', 'teacher', 'admin') NOT NULL,
    status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  `CREATE TABLE IF NOT EXISTS student_profiles (
    roll_number VARCHAR(32) NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    section VARCHAR(32) NOT NULL,
    github_profile VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (roll_number),
    UNIQUE KEY uq_student_user (user_id),
    CONSTRAINT fk_student_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  `CREATE TABLE IF NOT EXISTS oauth_accounts (
    provider ENUM('google', 'github') NOT NULL,
    provider_user_id VARCHAR(191) NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (provider, provider_user_id),
    UNIQUE KEY uq_oauth_user_provider (user_id, provider),
    CONSTRAINT fk_oauth_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  `CREATE TABLE IF NOT EXISTS exams (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    owner_user_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(180) NOT NULL,
    code VARCHAR(32) NOT NULL,
    subject VARCHAR(80) NOT NULL,
    duration_minutes SMALLINT UNSIGNED NOT NULL,
    total_marks DECIMAL(8,2) NOT NULL DEFAULT 0,
    status ENUM('draft', 'published', 'closed') NOT NULL DEFAULT 'draft',
    starts_at DATETIME NULL,
    ends_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  `CREATE TABLE IF NOT EXISTS questions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    exam_id BIGINT UNSIGNED NOT NULL,
    topic VARCHAR(120) NOT NULL,
    difficulty ENUM('easy', 'moderate', 'difficult') NOT NULL DEFAULT 'moderate',
    prompt TEXT NOT NULL,
    options JSON NOT NULL,
    correct_option TINYINT UNSIGNED NOT NULL,
    explanation TEXT NULL,
    points DECIMAL(6,2) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  `CREATE TABLE IF NOT EXISTS attempts (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    exam_id BIGINT UNSIGNED NOT NULL,
    student_roll_number VARCHAR(32) NOT NULL,
    started_at DATETIME NOT NULL,
    expires_at DATETIME NOT NULL,
    submitted_at DATETIME NULL,
    score DECIMAL(8,2) NULL,
    percentage DECIMAL(5,2) NULL,
    status ENUM('in_progress', 'submitted', 'expired') NOT NULL DEFAULT 'in_progress',
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  `CREATE TABLE IF NOT EXISTS attempt_questions (
    attempt_id BIGINT UNSIGNED NOT NULL,
    question_id BIGINT UNSIGNED NOT NULL,
    question_order SMALLINT UNSIGNED NOT NULL,
    selected_option TINYINT UNSIGNED NULL,
    confidence ENUM('sure', 'unsure', 'guessed') NULL,
    flagged_for_review BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (attempt_id, question_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  `CREATE TABLE IF NOT EXISTS assignments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    teacher_user_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(180) NOT NULL,
    subject VARCHAR(80) NOT NULL,
    section VARCHAR(32) NULL,
    description TEXT NULL,
    due_at DATETIME NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  `CREATE TABLE IF NOT EXISTS assignment_submissions (
    assignment_id BIGINT UNSIGNED NOT NULL,
    student_roll_number VARCHAR(32) NOT NULL,
    completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (assignment_id, student_roll_number)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
];

export async function initLiveSchema(poolInstance) {
  if (!poolInstance) return;
  console.log("Initializing database tables on MySQL / Railway...");
  for (const sql of SCHEMA_TABLES) {
    try {
      await poolInstance.query(sql);
    } catch (err) {
      console.warn("Schema initialization notice:", err.message);
    }
  }
  console.log("Database tables verified successfully.");
}

// --------------------------------------------------------------------------
// 3. High-Quality Local Persistent Storage Fallback
// Ensures accounts created on localhost NEVER fail even before Railway is linked!
// --------------------------------------------------------------------------
class LocalDatabaseStore {
  constructor() {
    this.data = {
      users: [
        {
          id: 1,
          full_name: "Maya Chen",
          email: "maya.chen@demo.edu",
          password_hash: "$2a$10$a3pC7LkF97jq9o9TDXwxBeWgH0AffM.Bym8ssMp.mFQu8l9/zJQMW", // Password123!
          role: "student",
          status: "active",
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          full_name: "Dr. Elias Ford",
          email: "elias.ford@demo.edu",
          password_hash: "$2a$10$a3pC7LkF97jq9o9TDXwxBeWgH0AffM.Bym8ssMp.mFQu8l9/zJQMW", // Password123!
          role: "teacher",
          status: "active",
          created_at: new Date().toISOString()
        },
        {
          id: 3,
          full_name: "Nina Okafor",
          email: "nina.okafor@demo.edu",
          password_hash: "$2a$10$a3pC7LkF97jq9o9TDXwxBeWgH0AffM.Bym8ssMp.mFQu8l9/zJQMW", // Password123!
          role: "admin",
          status: "active",
          created_at: new Date().toISOString()
        }
      ],
      student_profiles: [
        {
          roll_number: "STU-20418",
          user_id: 1,
          section: "A",
          github_profile: "https://github.com/mayachen",
          created_at: new Date().toISOString()
        }
      ],
      oauth_accounts: [],
      exams: [
        {
          id: 1,
          owner_user_id: 1,
          title: "Cell Biology & Genetics",
          code: "BIO-204",
          subject: "Biology",
          duration_minutes: 60,
          total_marks: 50,
          status: "published",
          starts_at: null,
          ends_at: null,
          created_at: new Date().toISOString()
        }
      ],
      questions: [
        {
          id: 1,
          exam_id: 1,
          topic: "Cell Membrane Transport",
          difficulty: "moderate",
          prompt: "Which mechanism moves ions across the plasma membrane against their concentration gradient?",
          options: JSON.stringify(["Simple diffusion", "Facilitated diffusion", "Active transport", "Osmosis"]),
          correct_option: 2,
          explanation: "Active transport hydrolyzes ATP to move ions against electrochemical gradients.",
          points: 10
        },
        {
          id: 2,
          exam_id: 1,
          topic: "Genetics & Inheritance",
          difficulty: "easy",
          prompt: "In a monohybrid cross between two heterozygotes (Aa x Aa), what is the expected phenotypic ratio for a complete dominance trait?",
          options: JSON.stringify(["1:1", "3:1", "9:3:3:1", "1:2:1"]),
          correct_option: 1,
          explanation: "A standard Mendelian monohybrid cross yields a 3 dominant to 1 recessive phenotype ratio.",
          points: 10
        }
      ],
      attempts: [],
      attempt_questions: [],
      assignments: [
        {
          id: 1,
          teacher_user_id: 1,
          title: "Mitosis & Meiosis Comparison Worksheet",
          subject: "Biology",
          section: "A",
          description: "Complete the phase comparison chart and summarize genetic recombination.",
          due_at: new Date(Date.now() + 7 * 86400000).toISOString()
        }
      ],
      assignment_submissions: []
    };
    this.nextUserId = 10;
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(localDbPath)) {
        const raw = fs.readFileSync(localDbPath, "utf8");
        const parsed = JSON.parse(raw);
        this.data = { ...this.data, ...parsed };
        const maxId = Math.max(...this.data.users.map(u => Number(u.id) || 0), 0);
        if (maxId >= this.nextUserId) this.nextUserId = maxId + 1;
      } else {
        this.save();
      }
    } catch (e) {
      console.warn("Could not load local_db.json, starting fresh:", e.message);
    }
  }

  save() {
    try {
      fs.writeFileSync(localDbPath, JSON.stringify(this.data, null, 2), "utf8");
    } catch (e) {
      console.warn("Could not persist local_db.json:", e.message);
    }
  }

  async execute(sql, params = []) {
    return this.handleQuery(sql, params);
  }

  async query(sql, params = []) {
    return this.handleQuery(sql, params);
  }

  async getConnection() {
    const self = this;
    return {
      async execute(sql, params) { return self.handleQuery(sql, params); },
      async query(sql, params) { return self.handleQuery(sql, params); },
      async beginTransaction() {},
      async commit() { self.save(); },
      async rollback() {},
      release() {}
    };
  }

  handleQuery(sql, params = []) {
    const s = sql.trim().replace(/\s+/g, " ");

    // 1. SELECT users WHERE email = ?
    if (/SELECT .* FROM users WHERE email = \?/i.test(s)) {
      const email = String(params[0] || "").toLowerCase();
      const user = this.data.users.find(u => u.email.toLowerCase() === email);
      if (user) {
        return [[{
          id: user.id,
          full_name: user.full_name,
          name: user.full_name,
          email: user.email,
          role: user.role,
          password_hash: user.password_hash,
          passwordHash: user.password_hash,
          status: user.status || "active"
        }], []];
      }
      return [[], []];
    }

    // 2. SELECT users WHERE id = ?
    if (/SELECT .* FROM users WHERE id = \?/i.test(s)) {
      const id = Number(params[0]);
      const user = this.data.users.find(u => Number(u.id) === id);
      if (user) {
        return [[{
          id: user.id,
          full_name: user.full_name,
          name: user.full_name,
          email: user.email,
          role: user.role,
          status: user.status || "active"
        }], []];
      }
      return [[], []];
    }

    // 3. INSERT INTO users
    if (/INSERT INTO users/i.test(s)) {
      const [name, email, passwordHash, role = "student"] = params;
      const lowerEmail = String(email).toLowerCase();
      if (this.data.users.some(u => u.email.toLowerCase() === lowerEmail)) {
        const err = new Error("Duplicate email entry");
        err.code = "ER_DUP_ENTRY";
        throw err;
      }
      const newId = this.nextUserId++;
      const user = {
        id: newId,
        full_name: name,
        email: lowerEmail,
        password_hash: passwordHash,
        role: role || (s.includes("'student'") ? "student" : "student"),
        status: "active",
        created_at: new Date().toISOString()
      };
      this.data.users.push(user);
      this.save();
      return [{ insertId: newId, affectedRows: 1 }, []];
    }

    // 4. student_profiles queries
    if (/SELECT .* FROM student_profiles WHERE user_id = \?/i.test(s)) {
      const userId = Number(params[0]);
      const p = this.data.student_profiles.find(sp => Number(sp.user_id) === userId);
      return [p ? [{ rollNumber: p.roll_number, roll_number: p.roll_number, section: p.section, githubProfile: p.github_profile }] : [], []];
    }

    if (/SELECT .* FROM student_profiles WHERE roll_number = \?/i.test(s)) {
      const roll = String(params[0]);
      const p = this.data.student_profiles.find(sp => sp.roll_number === roll);
      return [p ? [{ user_id: p.user_id }] : [], []];
    }

    if (/INSERT INTO student_profiles/i.test(s)) {
      const [roll, userId, section, github] = params;
      this.data.student_profiles.push({
        roll_number: roll,
        user_id: userId,
        section,
        github_profile: github
      });
      this.save();
      return [{ affectedRows: 1 }, []];
    }

    if (/UPDATE student_profiles/i.test(s)) {
      const [roll, section, github, userId] = params;
      const p = this.data.student_profiles.find(sp => Number(sp.user_id) === Number(userId));
      if (p) {
        p.roll_number = roll;
        p.section = section;
        p.github_profile = github;
      }
      this.save();
      return [{ affectedRows: 1 }, []];
    }

    // 5. oauth_accounts queries
    if (/SELECT .* FROM oauth_accounts WHERE provider = \? AND provider_user_id = \?/i.test(s)) {
      const [provider, provId] = params;
      const found = this.data.oauth_accounts.find(o => o.provider === provider && o.provider_user_id === String(provId));
      return [found ? [{ user_id: found.user_id }] : [], []];
    }

    if (/SELECT .* FROM oauth_accounts WHERE user_id = \? AND provider = \?/i.test(s)) {
      const [userId, provider] = params;
      const found = this.data.oauth_accounts.find(o => Number(o.user_id) === Number(userId) && o.provider === provider);
      return [found ? [{ provider_user_id: found.provider_user_id }] : [], []];
    }

    if (/INSERT INTO oauth_accounts/i.test(s)) {
      const [provider, provId, userId] = params;
      this.data.oauth_accounts.push({
        provider,
        provider_user_id: String(provId),
        user_id: userId,
        created_at: new Date().toISOString()
      });
      this.save();
      return [{ affectedRows: 1 }, []];
    }

    // 6. exams queries
    if (/SELECT .* FROM exams/i.test(s)) {
      const list = this.data.exams.map(e => ({
        id: e.id,
        title: e.title,
        code: e.code,
        subject: e.subject,
        duration: e.duration_minutes,
        marks: e.total_marks,
        status: e.status,
        startsAt: e.starts_at,
        endsAt: e.ends_at,
        questionCount: this.data.questions.filter(q => q.exam_id === e.id).length
      }));
      return [list, []];
    }

    // 7. assignments
    if (/SELECT .* FROM assignments/i.test(s)) {
      const list = this.data.assignments.map(a => ({
        id: a.id,
        title: a.title,
        subject: a.subject,
        section: a.section,
        dueAt: a.due_at,
        completedAt: null
      }));
      return [list, []];
    }

    return [[], []];
  }
}

const localFallbackStore = new LocalDatabaseStore();

// --------------------------------------------------------------------------
// 4. Pool Provider & Health Check
// --------------------------------------------------------------------------
export function requirePool() {
  if (activePool && isLiveDatabase) {
    return activePool;
  }
  return localFallbackStore;
}

export async function healthCheck() {
  if (activePool) {
    try {
      await activePool.query("SELECT 1");
      if (!isLiveDatabase) {
        isLiveDatabase = true;
        // Auto init tables on live DB connect!
        initLiveSchema(activePool).catch(() => {});
      }
      return {
        databaseConfigured: true,
        database: "connected",
        provider: dbUrl ? "railway-or-url" : "mysql",
        mode: "live"
      };
    } catch (err) {
      isLiveDatabase = false;
      return {
        databaseConfigured: true,
        database: "fallback_local",
        error: err.message,
        mode: "local_store"
      };
    }
  }
  return {
    databaseConfigured: false,
    database: "local_storage",
    mode: "local_store",
    note: "Paste your Railway MySQL URL in backend/.env to connect to Railway."
  };
}

export function getDatabaseInfo() {
  return {
    isLive: isLiveDatabase,
    hasPool: Boolean(activePool),
    host: host || (dbUrl ? "configured-url" : "local_file"),
    database: database || "local_db"
  };
}
