import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Context) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  if (id === session.user.id) {
    return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
  }

  const { role } = await req.json() as { role: string };
  if (role !== "ADMIN" && role !== "DEVELOPER") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const user = await db.user.update({
    where: { id },
    data: { role: role as "ADMIN" | "DEVELOPER" },
    select: { id: true, role: true },
  });

  return NextResponse.json(user);
}
