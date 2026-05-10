import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { spamCheckTask } from "@/trigger/spam-check";
import { emailNotificationTask } from "@/trigger/email-notification";
import { webhookDeliveryTask } from "@/trigger/webhook-delivery";
import { autoResponseTask } from "@/trigger/auto-response";

type Context = { params: Promise<{ id: string }> };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const taskByJobType: Record<string, { trigger: (payload: any) => Promise<unknown> }> = {
  "spam-check": spamCheckTask,
  "email-notification": emailNotificationTask,
  "webhook-delivery": webhookDeliveryTask,
  "auto-response": autoResponseTask,
};

export async function POST(_req: NextRequest, { params }: Context) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const job = await db.deadLetterJob.findUnique({ where: { id } });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (job.resolvedAt) return NextResponse.json({ error: "Already resolved" }, { status: 400 });

  const task = taskByJobType[job.jobType];
  if (!task) {
    return NextResponse.json({ error: `Unknown job type: ${job.jobType}` }, { status: 400 });
  }

  await task.trigger(job.payload);
  await db.deadLetterJob.update({
    where: { id },
    data: { retriedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
