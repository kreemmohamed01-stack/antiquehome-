import crypto from "node:crypto";
import { cookies } from "next/headers";
import { sql } from "./db";
import bcrypt from "bcryptjs";

const COOKIE_NAME = "ah_admin_session";
const SECRET = process.env.ADMIN_SESSION_SECRET || process.env.CLOUDINARY_API_SECRET || "antique-home-dev-secret";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function sign(value: string) {
  const h = crypto.createHmac("sha256", SECRET).update(value).digest("base64url");
  return `${value}.${h}`;
}

function verify(signed: string): string | null {
  const idx = signed.lastIndexOf(".");
  if (idx === -1) return null;
  const value = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const expected = crypto.createHmac("sha256", SECRET).update(value).digest("base64url");
  if (sig.length !== expected.length) return null;
  const ok = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  return ok ? value : null;
}

export type AdminSession = { id: number; email: string };

export async function createSession(admin: AdminSession) {
  const payload = JSON.stringify(admin);
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  const token = sign(encoded);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
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

export async function verifyCredentials(email: string, password: string): Promise<AdminSession | null> {
  const rows = (await sql`SELECT id, email, password_hash FROM admin_users WHERE email = ${email}`) as {
    id: number;
    email: string;
    password_hash: string;
  }[];
  if (!rows.length) return null;
  const ok = await bcrypt.compare(password, rows[0].password_hash);
  if (!ok) return null;
  return { id: rows[0].id, email: rows[0].email };
}

export { COOKIE_NAME };
