import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  spamCheckQueue,
  emailNotificationQueue,
  webhookDeliveryQueue,
  autoResponseQueue,
} from "@/lib/queues";

const queueByJobType: Record<string, { add: (name: string, data: unknown) => Promise<unknown> }> = {
  "spam-check": spamCheckQueue,
  "email-notification": emailNotificationQueue,
  "webhook-delivery": webhookDeliveryQueue,
  "auto-response": autoResponseQueue,
};

type Context = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Context) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const job = await db.deadLetterJob.findUnique({ where: { id } });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (job.resolvedAt) return NextResponse.json({ error: "Already resolved" }, { status: 400 });

  const queue = queueByJobType[job.jobType];
  if (!queue) {
    return NextResponse.json({ error: `Unknown job type: ${job.jobType}` }, { status: 400 });
  }

  await queue.add("retry", job.payload);
  await db.deadLetterJob.update({
    where: { id },
    data: { retriedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
