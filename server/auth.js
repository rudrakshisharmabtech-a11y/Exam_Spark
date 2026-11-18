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

router.post("/supabase-session", async (req, res, next) => {
  const accessToken = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  const role = req.body.role;
  if (!accessToken) return res.status(401).json({ error: "Sign in with Supabase before connecting your ExamSpark account." });
  if (!["student", "teacher", "admin"].includes(role)) {
    return res.status(400).json({ error: "Choose a valid ExamSpark workspace." });
  }
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(503).json({ error: "Supabase is not configured on the API. Set SUPABASE_URL and SUPABASE_ANON_KEY." });
  }
  let identity;
  try {
    const response = await fetch(`${supabaseUrl.replace(/\/+$/, "")}/auth/v1/user`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(10000),
    });
    identity = await response.json();
    if (!response.ok || !identity.id || !identity.email) {
      return res.status(401).json({ error: "Your Supabase session is invalid or expired. Sign in again." });
    }
  } catch (error) {
    return next(error);
  }

  let connection;
  try {
    const email = String(identity.email).trim().toLowerCase();
    const metadata = identity.user_metadata || {};
    const name = String(req.body.name || metadata.full_name || metadata.name || email.split("@")[0]).trim();
    const db = requirePool();
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      "SELECT id, full_name AS name, email, role, status FROM users WHERE email = ? LIMIT 1",
      [email],
    );
    let user = rows[0];
    const rollNumber = req.body.rollNumber || metadata.roll_number;
    const section = req.body.section || metadata.section;
    const githubProfile = req.body.githubProfile || metadata.github_profile;
    if (!user) {
      if (role !== "student") {
        await connection.rollback();
        return res.status(403).json({ error: "Teacher and administrator accounts must be provisioned before sign-in." });
      }
      const [result] = await connection.execute(
        "INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, NULL, 'student')",
        [name || email.split("@")[0], email],
      );
      user = {
        id: result.insertId,
        name: name || email.split("@")[0],
        email,
        role: "student",
        status: "active",
      };
      if (rollNumber && section) {
        await connection.execute(
          "INSERT INTO student_profiles (roll_number, user_id, section, github_profile) VALUES (?, ?, ?, ?)",
          [
            String(rollNumber).trim(),
            user.id,
            String(section).trim(),
            githubProfile ? String(githubProfile).trim() : null,
          ],
        );
      }
    }
    if (user.role !== role || user.status !== "active") {
      await connection.rollback();
      return res.status(403).json({ error: "This account is not active in the selected workspace." });
    }
    if (user.role === "student") {
      const [profiles] = await connection.execute(
        "SELECT roll_number AS rollNumber, section, github_profile AS githubProfile FROM student_profiles WHERE user_id = ? LIMIT 1",
        [user.id],
      );
      user.profile = profiles[0] || null;
    }
    await connection.commit();
    setSessionCookie(res, user);
    res.json({ user });
  } catch (error) {
    if (connection) await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "That email or roll number is already registered." });
    }
    next(error);
  } finally {
    connection?.release();
  }
});

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
  router.get(`/${provider}`, (req, res) => {
    const config = oauthConfig[provider];
    const role = req.query.role;
    if (!config.clientId || !config.clientSecret) {
      return res.status(503).json({ error: `${provider} OAuth is not configured on the server.` });
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
