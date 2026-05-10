import { task } from "@trigger.dev/sdk/v3";
import { db } from "@/lib/db";
import { DeliveryStatus, DeliveryType } from "@prisma/client";

interface WebhookDeliveryPayload {
  submissionId: string;
  endpointId: string;
  url: string;
  fields: Record<string, unknown>;
}

export const webhookDeliveryTask = task({
  id: "webhook-delivery",
  retry: { maxAttempts: 3, factor: 2, minTimeoutInMs: 1000 },
  run: async (payload: WebhookDeliveryPayload) => {
    const { submissionId, endpointId, url, fields } = payload;

    let log = await db.deliveryLog.findFirst({
      where: { submissionId, destination: url, type: DeliveryType.WEBHOOK },
    });

    if (!log) {
      log = await db.deliveryLog.create({
        data: {
          endpointId,
          submissionId,
          type: DeliveryType.WEBHOOK,
          destination: url,
          status: DeliveryStatus.PENDING,
          attemptCount: 1,
        },
      });
    } else {
      log = await db.deliveryLog.update({
        where: { id: log.id },
        data: { status: DeliveryStatus.RETRYING, attemptCount: { increment: 1 } },
      });
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId, endpointId, data: fields }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    await db.deliveryLog.update({
      where: { id: log.id },
      data: { status: DeliveryStatus.DELIVERED, statusCode: res.status, resolvedAt: new Date() },
    });
  },
  onFailure: async ({ payload, error }: { payload: WebhookDeliveryPayload; error: unknown; [key: string]: unknown }) => {
    const { submissionId, endpointId, url, fields } = payload;
    const message = error instanceof Error ? error.message : String(error);

    await db.deliveryLog.updateMany({
      where: { submissionId, destination: url, type: DeliveryType.WEBHOOK },
      data: { status: DeliveryStatus.DEAD_LETTERED, errorMessage: message },
    });

    await db.deadLetterJob.create({
      data: {
        endpointId,
        submissionId,
        jobType: "webhook-delivery",
        payload: JSON.parse(JSON.stringify({ url, fields })),
        errorMessage: message,
      },
    });
  },
});
