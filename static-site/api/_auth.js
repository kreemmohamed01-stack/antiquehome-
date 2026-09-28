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
  if (process.env.NODE_ENV === "production") parts.push("Secure");
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

async function verifyCredentials(email, password) {
  const rows = await sql`SELECT id, email, password_hash FROM admin_users WHERE email = ${email}`;
  if (!rows.length) return null;
  const ok = await bcrypt.compare(password, rows[0].password_hash);
  if (!ok) return null;
  return { id: rows[0].id, email: rows[0].email };
}

/** Wrap an API handler so it 401s automatically when there's no admin session. */
function requireAuth(handler) {
  return async (req, res) => {
    const session = getSession(req);
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
  setSessionCookie,
  clearSessionCookie,
  verifyCredentials,
  requireAuth,
  parseCookies,
};
