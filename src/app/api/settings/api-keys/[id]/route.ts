import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Context) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const key = await db.apiKey.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!key) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.apiKey.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
