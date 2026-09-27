import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  let body: { standardPrice?: number; expressPrice?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const standard = Number(body.standardPrice);
  const express = Number(body.expressPrice);
  if (!Number.isFinite(standard) || !Number.isFinite(express) || standard < 0 || express < 0) {
    return NextResponse.json({ error: "Invalid prices." }, { status: 400 });
  }

  try {
    await sql`UPDATE shipping_rates SET standard_price = ${standard}, express_price = ${express} WHERE id = ${Number(id)}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update shipping rate." }, { status: 500 });
  }
}
