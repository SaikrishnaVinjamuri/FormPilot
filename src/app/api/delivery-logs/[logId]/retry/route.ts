import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { DeliveryType } from "@prisma/client";
import {
  emailNotificationQueue,
  webhookDeliveryQueue,
  autoResponseQueue,
} from "@/lib/queues";

type Context = { params: Promise<{ logId: string }> };

export async function POST(_req: NextRequest, { params }: Context) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { logId } = await params;

  const log = await db.deliveryLog.findFirst({
    where: {
      id: logId,
      endpoint: { userId: session.user.id },
    },
    include: {
      submission: { select: { fields: true } },
      endpoint: {
        select: {
          autoResponseSubject: true,
          autoResponseTemplate: true,
        },
      },
    },
  });

  if (!log) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const fields = (log.submission.fields ?? {}) as Record<string, unknown>;

  if (log.type === DeliveryType.EMAIL_NOTIFICATION) {
    await emailNotificationQueue.add("retry", {
      submissionId: log.submissionId,
      endpointId: log.endpointId,
      to: log.destination,
      fields,
    });
  } else if (log.type === DeliveryType.WEBHOOK) {
    await webhookDeliveryQueue.add("retry", {
      submissionId: log.submissionId,
      endpointId: log.endpointId,
      url: log.destination,
      fields,
    });
  } else if (log.type === DeliveryType.AUTO_RESPONSE) {
    await autoResponseQueue.add("retry", {
      submissionId: log.submissionId,
      endpointId: log.endpointId,
      to: log.destination,
      subject: log.endpoint.autoResponseSubject,
      template: log.endpoint.autoResponseTemplate,
      fields,
    });
  }

  return NextResponse.json({ success: true });
}
