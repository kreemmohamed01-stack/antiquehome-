// Session cookie helpers for plain Vercel serverless functions (req/res
// style, not Next.js). Same HMAC-signed cookie scheme as before, so any
// admin session created by either version of the site is compatible.
const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");
const { sql } = require("./_db.js");

const COOKIE_NAME = "ah_admin_session";
const SECRET = process.env.ADMIN_SESSION_SECRET || process.env.CLOUDINARY_API_SECRET || "antique-home-dev-secret";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function sign(value) {
  const h = crypto.createHmac("sha256", SECRET).update(value).digest("base64url");
  return `${value}.${h}`;
}

function verify(signed) {
  if (!signed) return null;
  const idx = signed.lastIndexOf(".");
  if (idx === -1) return null;
  const value = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const expected = crypto.createHmac("sha256", SECRET).update(value).digest("base64url");
  if (sig.length !== expected.length) return null;
  const ok = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  return ok ? value : null;
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    out[k] = decodeURIComponent(v);
  }
  return out;
}

function setSessionCookie(res, session) {
  const payload = JSON.stringify(session);
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  const token = sign(encoded);
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${MAX_AGE}`,
  ];
  if (process.env.VERCEL || process.env.NODE_ENV === "production") parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0`);
}

function getSession(req) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  const encoded = verify(token);
  if (!encoded) return null;
  try {
    const payload = Buffer.from(encoded, "base64url").toString("utf8");
    const parsed = JSON.parse(payload);
    if (typeof parsed?.id === "number" && typeof parsed?.email === "string") return parsed;
    return null;
  } catch {
    return null;
  }
}

// Ties a session to the password it was created with: changing the
// password changes this, so every other logged-in browser is signed out.
function passwordVersion(hash) {
  return crypto.createHmac("sha256", SECRET).update(String(hash)).digest("base64url").slice(0, 16);
}

// Compared against when the username doesn't exist, so a wrong username
// takes as long as a wrong password (no username probing by timing).
const DUMMY_HASH = "$2a$12$U84Qgrd2E61O9LQGqrPt3enWiKm2i2.JGnJbihgNY99vx3JV5aida";

async function verifyCredentials(email, password) {
  const rows = await sql`SELECT id, email, password_hash FROM admin_users WHERE email = ${email}`;
  if (!rows.length) { await bcrypt.compare(password, DUMMY_HASH); return null; }
  const ok = await bcrypt.compare(password, rows[0].password_hash);
  if (!ok) return null;
  return { id: rows[0].id, email: rows[0].email, v: passwordVersion(rows[0].password_hash) };
}

/** The session only if its user still exists with the same username and password. */
async function getValidSession(req) {
  const session = getSession(req);
  if (!session) return null;
  const rows = await sql`SELECT email, password_hash FROM admin_users WHERE id = ${session.id}`;
  if (!rows.length || rows[0].email !== session.email || session.v !== passwordVersion(rows[0].password_hash)) return null;
  return session;
}

// Brute-force guard: 5 wrong logins from one IP (or for one username)
// within 15 minutes locks that IP/username out for the rest of the window.
const MAX_FAILS = 5;
const LOCK_MINUTES = 15;
let attemptsTable = null;
function ensureAttemptsTable() {
  if (!attemptsTable) {
    attemptsTable = sql`CREATE TABLE IF NOT EXISTS admin_login_attempts (key TEXT NOT NULL, at TIMESTAMPTZ NOT NULL DEFAULT now())`
      .catch((e) => { attemptsTable = null; throw e; });
  }
  return attemptsTable;
}
function clientIp(req) {
  return String(req.headers["x-real-ip"] || req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
}
async function loginLocked(req, email) {
  await ensureAttemptsTable();
  const rows = await sql`SELECT
      COUNT(*) FILTER (WHERE key = ${"ip:" + clientIp(req)})::int AS ip,
      COUNT(*) FILTER (WHERE key = ${"user:" + email})::int AS usr
    FROM admin_login_attempts WHERE at > now() - make_interval(mins => ${LOCK_MINUTES})`;
  return rows[0].ip >= MAX_FAILS || rows[0].usr >= MAX_FAILS;
}
async function recordLoginFailure(req, email) {
  await ensureAttemptsTable();
  await sql`INSERT INTO admin_login_attempts (key) VALUES (${"ip:" + clientIp(req)}), (${"user:" + email})`;
  await sql`DELETE FROM admin_login_attempts WHERE at < now() - interval '1 day'`;
}
async function clearLoginFailures(req, email) {
  await sql`DELETE FROM admin_login_attempts WHERE key IN (${"ip:" + clientIp(req)}, ${"user:" + email})`;
}

/** Returns an error message, or null if the password is strong enough. */
function passwordProblem(password, username) {
  if (password.length < 12) return "Password must be at least 12 characters.";
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) return "Password must mix uppercase and lowercase letters.";
  if (!/\d/.test(password)) return "Password must include a number.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Password must include a symbol (e.g. ! @ # $).";
  if (username && password.toLowerCase().includes(username.toLowerCase())) return "Password must not contain the username.";
  return null;
}

/** Wrap an API handler so it 401s automatically when there's no admin session. */
function requireAuth(handler) {
  return async (req, res) => {
    const session = await getValidSession(req);
    if (!session) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    req.session = session;
    return handler(req, res);
  };
}

module.exports = {
  getSession,
  getValidSession,
  setSessionCookie,
  clearSessionCookie,
  verifyCredentials,
  loginLocked,
  recordLoginFailure,
  clearLoginFailures,
  passwordProblem,
  requireAuth,
  parseCookies,
};
