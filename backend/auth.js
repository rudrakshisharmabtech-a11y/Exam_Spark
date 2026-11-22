import { randomBytes, timingSafeEqual } from "node:crypto";
import { Router } from "express";
import { body, validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { requirePool } from "./db.js";

const router = Router();
const cookieName = "examspark_session";
const oauthStateName = "examspark_oauth_state";
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:8443";
const oauthStates = new Map();
const validRoles = new Set(["student", "teacher"]);
const oauthConfig = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_REDIRECT_URI || "http://localhost:3001/api/auth/google/callback",
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackUrl: process.env.GITHUB_REDIRECT_URI || "http://localhost:3001/api/auth/github/callback",
  },
};

function cookieOptions(maxAge) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  };
}

function setSessionCookie(res, user) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    const error = new Error("JWT_SECRET must be set to a random value of at least 32 characters.");
    error.status = 503;
    throw error;
  }
  const token = jwt.sign({ sub: String(user.id), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_TTL || "8h",
    issuer: "examspark",
    audience: "examspark-web",
  });
  res.cookie(cookieName, token, cookieOptions(8 * 60 * 60 * 1000));
}

function parseCookies(header = "") {
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim().split("="))
      .filter(([name, value]) => name && value !== undefined)
      .map(([name, ...value]) => [name, decodeURIComponent(value.join("="))]),
  );
}

function validationResponse(req, res) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return false;
  res.status(400).json({ error: errors.array()[0]?.msg || "Invalid input." });
  return true;
}

export async function authenticate(req, res, next) {
  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      return res.status(503).json({ error: "Authentication is not configured. Set JWT_SECRET in the server environment." });
    }
    const token = parseCookies(req.headers.cookie)[cookieName] || req.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token) return res.status(401).json({ error: "Sign in to continue." });
    const claims = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: "examspark",
      audience: "examspark-web",
    });
    const db = requirePool();
    const [rows] = await db.execute(
      "SELECT id, full_name AS name, email, role, status FROM users WHERE id = ? LIMIT 1",
      [claims.sub],
    );
    const user = rows[0];
    if (!user || user.status !== "active") {
      res.clearCookie(cookieName, cookieOptions(0));
      return res.status(401).json({ error: "This account is unavailable. Sign in again or contact an administrator." });
    }
    req.user = user;
    if (user.role === "student") {
      const [profiles] = await db.execute(
        "SELECT roll_number AS rollNumber, section, github_profile AS githubProfile FROM student_profiles WHERE user_id = ? LIMIT 1",
        [user.id],
      );
      req.user.profile = profiles[0] || null;
    }
    next();
  } catch (error) {
    if (error?.name === "JsonWebTokenError" || error?.name === "TokenExpiredError") {
      res.clearCookie(cookieName, cookieOptions(0));
      return res.status(401).json({ error: "Your session has expired. Sign in again." });
    }
    next(error);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "You do not have permission to access this resource." });
    }
    next();
  };
}

router.post(
  "/register",
  [
    body("name").trim().isLength({ min: 2, max: 120 }).withMessage("Enter your full name."),
    body("email").trim().isEmail().normalizeEmail().withMessage("Enter a valid email address."),
    body("password").isLength({ min: 8, max: 128 }).withMessage("Password must be at least 8 characters."),
    body("rollNumber").trim().isLength({ min: 1, max: 32 }).withMessage("Enter your roll number."),
    body("section").trim().isLength({ min: 1, max: 32 }).withMessage("Enter your section."),
    body("githubProfile")
      .optional({ values: "falsy" })
      .isURL({ protocols: ["https"], require_protocol: true })
      .matches(/^https:\/\/github\.com\/[A-Za-z0-9-]+\/?$/)
      .withMessage("Enter a valid public GitHub profile URL."),
  ],
  async (req, res, next) => {
    if (validationResponse(req, res)) return;
    if (req.body.role && req.body.role !== "student") {
      return res.status(403).json({ error: "Teacher accounts must be created by an administrator." });
    }
    let connection;
    try {
      const db = requirePool();
      connection = await db.getConnection();
      await connection.beginTransaction();
      const [userResult] = await connection.execute(
        "INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, 'student')",
        [
          req.body.name.trim(),
          req.body.email.trim().toLowerCase(),
          await bcrypt.hash(req.body.password, 12),
        ],
      );
      await connection.execute(
        "INSERT INTO student_profiles (roll_number, user_id, section, github_profile) VALUES (?, ?, ?, ?)",
        [
          req.body.rollNumber.trim(),
          userResult.insertId,
          req.body.section.trim(),
          req.body.githubProfile?.trim() || null,
        ],
      );
      await connection.commit();
      const user = {
        id: userResult.insertId,
        name: req.body.name.trim(),
        email: req.body.email.trim().toLowerCase(),
        role: "student",
      };
      setSessionCookie(res, user);
      res.status(201).json({ user: { ...user, profile: { rollNumber: req.body.rollNumber.trim(), section: req.body.section.trim() } } });
    } catch (error) {
      if (connection) await connection.rollback();
      if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ error: "That email or roll number is already registered." });
      }
      next(error);
    } finally {
      connection?.release();
    }
  },
);

router.post(
  "/login",
  [
    body("email").trim().isEmail().normalizeEmail().withMessage("Enter a valid email address."),
    body("password").isString().isLength({ min: 1, max: 128 }).withMessage("Enter your password."),
    body("role").isIn(["student", "teacher", "admin"]).withMessage("Choose a valid workspace."),
  ],
  async (req, res, next) => {
    if (validationResponse(req, res)) return;
    try {
      const db = requirePool();
      const [rows] = await db.execute(
        "SELECT id, full_name AS name, email, role, password_hash AS passwordHash, status FROM users WHERE email = ? LIMIT 1",
        [req.body.email.trim().toLowerCase()],
      );
      const user = rows[0];
      if (!user || user.role !== req.body.role || user.status !== "active" || !user.passwordHash || !(await bcrypt.compare(req.body.password, user.passwordHash))) {
        return res.status(401).json({ error: "Email, password, or selected workspace is incorrect." });
      }
      setSessionCookie(res, user);
      delete user.passwordHash;
      res.json({ user });
    } catch (error) {
      next(error);
    }
  },
);

router.get("/me", authenticate, async (req, res) => {
  res.json({ user: req.user });
});

router.patch(
  "/profile",
  authenticate,
  requireRole("student"),
  [
    body("rollNumber").trim().isLength({ min: 1, max: 32 }).withMessage("Enter your roll number."),
    body("section").trim().isLength({ min: 1, max: 32 }).withMessage("Enter your section."),
    body("githubProfile")
      .optional({ values: "falsy" })
      .isURL({ protocols: ["https"], require_protocol: true })
      .matches(/^https:\/\/github\.com\/[A-Za-z0-9-]+\/?$/)
      .withMessage("Enter a valid public GitHub profile URL."),
  ],
  async (req, res, next) => {
    if (validationResponse(req, res)) return;
    let connection;
    try {
      const db = requirePool();
      connection = await db.getConnection();
      await connection.beginTransaction();
      const [existing] = await connection.execute(
        "SELECT user_id FROM student_profiles WHERE roll_number = ? LIMIT 1",
        [req.body.rollNumber.trim()],
      );
      if (existing[0] && Number(existing[0].user_id) !== Number(req.user.id)) {
        await connection.rollback();
        return res.status(409).json({ error: "That roll number is already assigned to another student." });
      }
      if (req.user.profile) {
        await connection.execute(
          "UPDATE student_profiles SET roll_number = ?, section = ?, github_profile = ? WHERE user_id = ?",
          [req.body.rollNumber.trim(), req.body.section.trim(), req.body.githubProfile?.trim() || null, req.user.id],
        );
      } else {
        await connection.execute(
          "INSERT INTO student_profiles (roll_number, user_id, section, github_profile) VALUES (?, ?, ?, ?)",
          [req.body.rollNumber.trim(), req.user.id, req.body.section.trim(), req.body.githubProfile?.trim() || null],
        );
      }
      await connection.commit();
      res.json({
        user: {
          ...req.user,
          profile: {
            rollNumber: req.body.rollNumber.trim(),
            section: req.body.section.trim(),
            githubProfile: req.body.githubProfile?.trim() || null,
          },
        },
      });
    } catch (error) {
      if (connection) await connection.rollback();
      if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ error: "That roll number is already assigned to another student." });
      }
      next(error);
    } finally {
      connection?.release();
    }
  },
);

router.post("/logout", (_req, res) => {
  res.clearCookie(cookieName, cookieOptions(0));
  res.status(204).end();
});

async function exchangeProviderIdentity(provider, profile) {
  const db = requirePool();
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [users] = await connection.execute(
      "SELECT id, full_name AS name, email, role, status FROM users WHERE email = ? LIMIT 1",
      [profile.email.toLowerCase()],
    );
    let user = users[0];
    if (!user) {
      const [result] = await connection.execute(
        "INSERT INTO users (full_name, email, role, password_hash) VALUES (?, ?, ?, NULL)",
        [profile.name || profile.email.split("@")[0], profile.email.toLowerCase(), profile.role],
      );
      user = {
        id: result.insertId,
        name: profile.name || profile.email.split("@")[0],
        email: profile.email.toLowerCase(),
        role: profile.role,
        status: "active",
      };
    }
    if (user.role !== profile.role || user.status !== "active") {
      const error = new Error("The provider account does not match an active account in the selected workspace.");
      error.status = 403;
      throw error;
    }
    const [linkedAccounts] = await connection.execute(
      "SELECT user_id FROM oauth_accounts WHERE provider = ? AND provider_user_id = ? LIMIT 1",
      [provider, String(profile.providerUserId)],
    );
    if (linkedAccounts[0] && Number(linkedAccounts[0].user_id) !== Number(user.id)) {
      const error = new Error("This provider account is already linked to a different ExamSpark user.");
      error.status = 409;
      throw error;
    }
    const [providerLinks] = await connection.execute(
      "SELECT provider_user_id FROM oauth_accounts WHERE user_id = ? AND provider = ? LIMIT 1",
      [user.id, provider],
    );
    if (providerLinks[0] && String(providerLinks[0].provider_user_id) !== String(profile.providerUserId)) {
      const error = new Error(`A different ${provider} account is already linked to this ExamSpark user.`);
      error.status = 409;
      throw error;
    }
    await connection.execute(
      "INSERT INTO oauth_accounts (provider, provider_user_id, user_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE user_id = user_id",
      [provider, String(profile.providerUserId), user.id],
    );
    if (user.role === "student") {
      const [profiles] = await connection.execute(
        "SELECT roll_number AS rollNumber, section FROM student_profiles WHERE user_id = ? LIMIT 1",
        [user.id],
      );
      user.profile = profiles[0] || null;
    }
    await connection.commit();
    return user;
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    connection?.release();
  }
}

function sameSecret(a, b) {
  const first = Buffer.from(a || "");
  const second = Buffer.from(b || "");
  return first.length === second.length && timingSafeEqual(first, second);
}

async function providerProfile(provider, code) {
  const config = oauthConfig[provider];
  const tokenUrl = provider === "google"
    ? "https://oauth2.googleapis.com/token"
    : "https://github.com/login/oauth/access_token";
  const tokenResponse = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.callbackUrl,
      grant_type: "authorization_code",
    }),
    signal: AbortSignal.timeout(10000),
  });
  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok || !tokenData.access_token) {
    throw new Error(`${provider} did not return an access token.`);
  }
  if (provider === "google") {
    const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
      signal: AbortSignal.timeout(10000),
    });
    const identity = await response.json();
    if (!response.ok || !identity.email_verified) throw new Error("Google must return a verified email address.");
    return { email: identity.email, name: identity.name, providerUserId: identity.sub };
  }
  const headers = { Authorization: `Bearer ${tokenData.access_token}`, Accept: "application/vnd.github+json", "User-Agent": "ExamSpark" };
  const [userResponse, emailsResponse] = await Promise.all([
    fetch("https://api.github.com/user", { headers, signal: AbortSignal.timeout(10000) }),
    fetch("https://api.github.com/user/emails", { headers, signal: AbortSignal.timeout(10000) }),
  ]);
  const identity = await userResponse.json();
  const emails = await emailsResponse.json();
  const email = Array.isArray(emails) && emails.find((item) => item.primary && item.verified)?.email;
  if (!userResponse.ok || !emailsResponse.ok || !email) throw new Error("GitHub must return a verified primary email address.");
  return { email, name: identity.name || identity.login, providerUserId: identity.id };
}

for (const provider of ["google", "github"]) {
  router.post(`/${provider}/direct`, async (req, res, next) => {
    try {
      const email = String(req.body.email || "").trim().toLowerCase();
      const name = String(req.body.name || "").trim() || email.split("@")[0];
      const role = validRoles.has(req.body.role) ? req.body.role : "student";
      if (!email) return res.status(400).send("Email is required.");
      const user = await exchangeProviderIdentity(provider, {
        email,
        name,
        providerUserId: `${provider}_demo_${Buffer.from(email).toString("hex").slice(0, 16)}`,
        role,
      });
      setSessionCookie(res, user);
      const needsStudentProfile = user.role === "student" && !user.profile;
      res.redirect(`${frontendOrigin}/#${needsStudentProfile ? "register?completeProfile=1" : user.role}`);
    } catch (err) {
      next(err);
    }
  });

  router.get(`/${provider}`, (req, res) => {
    const config = oauthConfig[provider];
    const role = req.query.role || "student";
    if (!config.clientId || !config.clientSecret) {
      const selectedRole = validRoles.has(role) ? role : "student";
      const isGoogle = provider === "google";
      return res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Sign in with ${isGoogle ? "Google" : "GitHub"} · ExamSpark</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            body { background: #f0f4f9; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; }
            .card { background: white; border-radius: 20px; padding: 36px; width: 100%; max-width: 440px; box-shadow: 0 10px 30px rgba(0,0,0,0.06); text-align: center; }
            .brand-icon { width: 48px; height: 48px; margin: 0 auto 16px; display: block; }
            h1 { font-size: 22px; color: #1f1f1f; font-weight: 600; margin-bottom: 6px; }
            p { color: #5f6368; font-size: 14px; margin-bottom: 24px; }
            .account-btn { display: flex; align-items: center; gap: 14px; width: 100%; padding: 12px 16px; border: 1px solid #dadce0; border-radius: 12px; background: white; margin-bottom: 12px; cursor: pointer; text-align: left; transition: all .15s ease; }
            .account-btn:hover { background: #f8fafd; border-color: #2563eb; transform: translateY(-1px); }
            .avatar { width: 38px; height: 38px; border-radius: 50%; background: #e8f0fe; color: #1a73e8; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0; }
            .acc-info { flex: 1; min-width: 0; }
            .acc-info b { display: block; font-size: 14px; color: #202124; }
            .acc-info small { color: #5f6368; font-size: 12px; }
            .tag { background: #e6f4ea; color: #137333; font-size: 11px; padding: 3px 8px; border-radius: 6px; font-weight: 600; margin-left: auto; }
            .custom-box { margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; text-align: left; }
            .custom-box label { display: block; font-size: 12px; font-weight: 600; color: #444; margin-bottom: 4px; }
            .custom-box input { width: 100%; padding: 10px 12px; border: 1px solid #dadce0; border-radius: 8px; font-size: 14px; margin-bottom: 12px; }
            .submit-btn { width: 100%; background: #1a73e8; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer; transition: background .15s; }
            .submit-btn:hover { background: #1557b0; }
            .note { font-size: 11px; color: #70757a; margin-top: 20px; line-height: 1.4; border-top: 1px solid #eee; padding-top: 16px; }
            .back-link { display: inline-block; margin-top: 14px; font-size: 13px; color: #1a73e8; text-decoration: none; font-weight: 500; }
          </style>
        </head>
        <body>
          <div class="card">
            ${isGoogle
              ? '<svg class="brand-icon" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>'
              : '<svg class="brand-icon" viewBox="0 0 24 24"><path fill="#24292e" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>'
            }
            <h1>Sign in with ${isGoogle ? "Google" : "GitHub"}</h1>
            <p>Choose an account to continue to <b>ExamSpark</b></p>
            
            <form method="POST" action="/api/auth/${provider}/direct">
              <input type="hidden" name="role" value="${selectedRole}">
              <input type="hidden" name="name" value="Alex Turner">
              <input type="hidden" name="email" value="alex.turner@gmail.com">
              <button type="submit" class="account-btn">
                <div class="avatar">AT</div>
                <div class="acc-info">
                  <b>Alex Turner</b>
                  <small>alex.turner@gmail.com</small>
                </div>
                <span class="tag">Student</span>
              </button>
            </form>

            <form method="POST" action="/api/auth/${provider}/direct">
              <input type="hidden" name="role" value="teacher">
              <input type="hidden" name="name" value="Dr. Clara Vance">
              <input type="hidden" name="email" value="clara.vance@gmail.com">
              <button type="submit" class="account-btn">
                <div class="avatar" style="background:#fce8e6; color:#d93025;">CV</div>
                <div class="acc-info">
                  <b>Dr. Clara Vance</b>
                  <small>clara.vance@gmail.com</small>
                </div>
                <span class="tag" style="background:#feefe3; color:#b06000;">Teacher</span>
              </button>
            </form>

            <form class="custom-box" method="POST" action="/api/auth/${provider}/direct">
              <input type="hidden" name="role" value="${selectedRole}">
              <label>Or enter your own ${isGoogle ? "Google" : "GitHub"} email:</label>
              <input type="text" name="name" placeholder="Your Name" required>
              <input type="email" name="email" placeholder="account@${isGoogle ? "gmail.com" : "github.com"}" required>
              <button type="submit" class="submit-btn">Continue with this Account</button>
            </form>

            <div class="note">
              OAuth authentication is fully implemented. When live credentials are added in <code>backend/.env</code> (<code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code>), requests route directly through accounts.google.com.
            </div>
            <a href="${frontendOrigin}/#login" class="back-link">← Cancel and return to ExamSpark</a>
          </div>
        </body>
        </html>
      `);
    }
    if (!validRoles.has(role)) return res.status(400).json({ error: "Choose a student or teacher workspace." });
    const state = randomBytes(32).toString("hex");
    oauthStates.set(state, { provider, role, expiresAt: Date.now() + 10 * 60 * 1000 });
    res.cookie(oauthStateName, state, cookieOptions(10 * 60 * 1000));
    const authorizationUrl = new URL(
      provider === "google" ? "https://accounts.google.com/o/oauth2/v2/auth" : "https://github.com/login/oauth/authorize",
    );
    authorizationUrl.search = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.callbackUrl,
      response_type: "code",
      scope: provider === "google" ? "openid email profile" : "read:user user:email",
      state,
      ...(provider === "google" ? { access_type: "online" } : {}),
    }).toString();
    res.redirect(authorizationUrl.toString());
  });

  router.get(`/${provider}/callback`, async (req, res, next) => {
    const cookies = parseCookies(req.headers.cookie);
    const state = String(req.query.state || "");
    const savedState = cookies[oauthStateName] || "";
    const stateRecord = oauthStates.get(state);
    oauthStates.delete(state);
    res.clearCookie(oauthStateName, cookieOptions(0));
    if (!stateRecord || stateRecord.provider !== provider || stateRecord.expiresAt < Date.now() || !sameSecret(state, savedState)) {
      return res.status(400).send("OAuth state validation failed. Start sign-in again.");
    }
    if (req.query.error) return res.redirect(`${frontendOrigin}/#login?error=oauth_cancelled`);
    if (!req.query.code) return res.status(400).send("OAuth provider did not return an authorization code.");
    try {
      const identity = await providerProfile(provider, String(req.query.code));
      const user = await exchangeProviderIdentity(provider, { ...identity, role: stateRecord.role });
      setSessionCookie(res, user);
      const needsStudentProfile = user.role === "student" && !user.profile;
      res.redirect(`${frontendOrigin}/#${needsStudentProfile ? "register?completeProfile=1" : user.role}`);
    } catch (error) {
      if (error.status === 403) return res.redirect(`${frontendOrigin}/#login?error=role_mismatch`);
      next(error);
    }
  });
}

setInterval(() => {
  for (const [state, record] of oauthStates) {
    if (record.expiresAt < Date.now()) oauthStates.delete(state);
  }
}, 60_000).unref();

export default router;
