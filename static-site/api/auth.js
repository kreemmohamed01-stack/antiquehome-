// Combines login/logout/session/credentials into one function to stay
// within Vercel Hobby's 12-serverless-function limit. Routed by ?action=.
const { getSession, setSessionCookie, clearSessionCookie, verifyCredentials } = require("./_auth.js");
const { sql } = require("./_db.js");
const bcrypt = require("bcryptjs");

async function readBody(req) {
  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  return body || {};
}

module.exports = async (req, res) => {
  const action = req.query.action;

  if (action === "login") {
    if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
    const body = await readBody(req);
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";
    if (!email || !password) { res.status(400).json({ error: "Username and password are required." }); return; }
    try {
      const session = await verifyCredentials(email, password);
      if (!session) { res.status(401).json({ error: "Invalid username or password." }); return; }
      setSessionCookie(res, session);
      res.status(200).json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Login failed." });
    }
    return;
  }

  if (action === "logout") {
    clearSessionCookie(res);
    res.status(200).json({ ok: true });
    return;
  }

  if (action === "session") {
    const session = getSession(req);
    if (!session) { res.status(401).json({ authenticated: false }); return; }
    res.status(200).json({ authenticated: true, email: session.email });
    return;
  }

  if (action === "credentials") {
    if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
    const session = getSession(req);
    if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }
    const body = await readBody(req);
    const currentPassword = body.currentPassword || "";
    const newUsername = (body.newUsername || "").trim().toLowerCase();
    const newPassword = body.newPassword || "";
    if (!currentPassword) { res.status(400).json({ error: "Enter your current password to confirm changes." }); return; }
    if (!newUsername) { res.status(400).json({ error: "Username cannot be empty." }); return; }
    try {
      const verified = await verifyCredentials(session.email, currentPassword);
      if (!verified) { res.status(401).json({ error: "Current password is incorrect." }); return; }
      if (newPassword) {
        const hash = await bcrypt.hash(newPassword, 12);
        await sql`UPDATE admin_users SET email = ${newUsername}, password_hash = ${hash} WHERE id = ${session.id}`;
      } else {
        await sql`UPDATE admin_users SET email = ${newUsername} WHERE id = ${session.id}`;
      }
      setSessionCookie(res, { id: session.id, email: newUsername });
      res.status(200).json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update credentials." });
    }
    return;
  }

  res.status(400).json({ error: "Unknown action" });
};
