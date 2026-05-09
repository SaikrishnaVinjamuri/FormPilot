import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createHash, randomBytes } from "crypto";
import { z } from "zod";

function hashKey(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

const schema = z.object({ name: z.string().min(1).max(60) });

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const keys = await db.apiKey.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, lastUsed: true, createdAt: true },
  });

  return NextResponse.json(keys);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const raw = `fp_${randomBytes(32).toString("hex")}`;
  const keyHash = hashKey(raw);

  await db.apiKey.create({
    data: { userId: session.user.id, name: parsed.data.name, keyHash },
  });

  // Return raw key once — never stored in plain text
  return NextResponse.json({ key: raw, name: parsed.data.name }, { status: 201 });
}
