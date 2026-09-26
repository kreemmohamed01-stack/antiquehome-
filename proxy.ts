import { NextRequest, NextResponse } from "next/server";

// Lightweight cookie-presence + signature check using Web Crypto (Edge
// Runtime compatible — no DB call here). Full session payload validation
// happens again in the admin layout server component via lib/auth.ts.
const COOKIE_NAME = "ah_admin_session";
const SECRET = process.env.ADMIN_SESSION_SECRET || process.env.CLOUDINARY_API_SECRET || "antique-home-dev-secret";

function base64UrlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(b64url.length / 4) * 4, "=");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function bytesToBase64Url(bytes: ArrayBuffer): string {
  let bin = "";
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmacSign(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return bytesToBase64Url(sig);
}

async function isValidToken(token: string): Promise<boolean> {
  const idx = token.lastIndexOf(".");
  if (idx === -1) return false;
  const value = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = await hmacSign(value);
  if (sig.length !== expected.length) return false;
  // constant-time-ish compare (best effort in Edge runtime)
  let diff = 0;
  const a = base64UrlToBytes(sig);
  const b = base64UrlToBytes(expected);
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin/login")) return NextResponse.next();
  if (!pathname.startsWith("/admin")) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token || !(await isValidToken(token))) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
