import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import authRouter, { authenticate } from "./auth.js";
import { databaseConfigured, healthCheck, pool } from "./db.js";
import apiRouter from "./routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.resolve(__dirname, "../frontend/dist");

const app = express();
const port = Number(process.env.API_PORT || 3001);
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:8443";

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.get("/api/health", async (_req, res, next) => {
  try {
    const status = await healthCheck();
    res.status(status.databaseConfigured ? 200 : 503).json({
      status: status.databaseConfigured ? "ok" : "degraded",
      ...status,
      oauth: {
        google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        github: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
      },
      aiConfigured: Boolean(process.env.AI_API_KEY),
    });
  } catch (error) {
    next(error);
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many sign-in requests. Wait a few minutes and try again." },
});
app.use("/api/auth", authLimiter, authRouter);
app.use("/api", authenticate, apiRouter);

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

app.use((req, res) => {
  res.status(404).json({ error: `No API route matches ${req.method} ${req.path}.` });
});

app.use((error, _req, res, _next) => {
  const status = Number(error.status || 500);
  if (status >= 500) console.error("ExamSpark API error:", error);
  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "The uploaded file exceeds the 10 MB limit." });
  }
  if (error.name === "MulterError") {
    return res.status(400).json({ error: error.message });
  }
  res.status(status).json({
    error: status >= 500 ? "The server could not complete the request. Check the API logs and configuration." : error.message,
  });
});

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`ExamSpark API listening at http://localhost:${port}`);
  if (!databaseConfigured) console.warn("MySQL is not configured; database routes will return 503.");
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(async () => {
      if (pool) await pool.end();
      process.exit(0);
    });
  });
}
