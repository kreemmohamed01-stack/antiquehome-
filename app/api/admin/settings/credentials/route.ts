import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession, verifyCredentials, createSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { currentPassword?: string; newUsername?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const currentPassword = body.currentPassword || "";
  const newUsername = (body.newUsername || "").trim().toLowerCase();
  const newPassword = body.newPassword || "";

  if (!currentPassword) {
    return NextResponse.json({ error: "Enter your current password to confirm changes." }, { status: 400 });
  }
  if (!newUsername) {
    return NextResponse.json({ error: "Username cannot be empty." }, { status: 400 });
  }

  const verified = await verifyCredentials(session.email, currentPassword);
  if (!verified) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
  }

  try {
    if (newPassword) {
      const hash = await bcrypt.hash(newPassword, 12);
      await sql`UPDATE admin_users SET email = ${newUsername}, password_hash = ${hash} WHERE id = ${session.id}`;
    } else {
      await sql`UPDATE admin_users SET email = ${newUsername} WHERE id = ${session.id}`;
    }
    await createSession({ id: session.id, email: newUsername });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update credentials." }, { status: 500 });
  }
}
