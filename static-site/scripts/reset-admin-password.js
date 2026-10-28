// Resets the dashboard password (e.g. when it's forgotten) and clears any
// login lockout. Run from static-site/:
//   node --env-file=.env.local scripts/reset-admin-password.js "NewPassword123!"
// The password must pass the same rules as the dashboard's Settings page.
const bcrypt = require("bcryptjs");
const { sql } = require("../api/_db.js");
const { passwordProblem } = require("../api/_auth.js");

(async () => {
  const password = process.argv[2] || "";
  const [admin] = await sql`SELECT id, email FROM admin_users ORDER BY id LIMIT 1`;
  if (!admin) throw new Error("No admin user found.");
  const problem = passwordProblem(password, admin.email);
  if (problem) { console.error(problem); process.exit(1); }
  await sql`UPDATE admin_users SET password_hash = ${await bcrypt.hash(password, 12)} WHERE id = ${admin.id}`;
  await sql`DELETE FROM admin_login_attempts`.catch(() => {});
  console.log(`Password updated. Username: ${admin.email}`);
})().catch((e) => { console.error(e.message); process.exit(1); });
