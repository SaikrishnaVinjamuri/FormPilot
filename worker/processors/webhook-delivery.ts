import { Job } from "bullmq";
import { db } from "../lib/db";
import { logger } from "../lib/logger";
import { DeliveryStatus, DeliveryType } from "@prisma/client";

interface WebhookDeliveryPayload {
  submissionId: string;
  endpointId: string;
  url: string;
  fields: Record<string, unknown>;
}

export async function processWebhookDelivery(
  job: Job<WebhookDeliveryPayload>
) {
  const { submissionId, endpointId, url, fields } = job.data;

  // Find or create the delivery log for this submission+url pair
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
      data: {
        status: DeliveryStatus.RETRYING,
        attemptCount: { increment: 1 },
      },
    });
  }

  let statusCode: number | undefined;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId, endpointId, data: fields }),
      signal: AbortSignal.timeout(10_000),
    });

    statusCode = res.status;

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    await db.deliveryLog.update({
      where: { id: log.id },
      data: {
        status: DeliveryStatus.DELIVERED,
        statusCode,
        resolvedAt: new Date(),
      },
    });

    logger.info({ submissionId, url, statusCode }, "webhook: delivered");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isFinalAttempt = job.attemptsMade >= (job.opts.attempts ?? 1) - 1;

    await db.deliveryLog.update({
      where: { id: log.id },
      data: {
        status: isFinalAttempt
          ? DeliveryStatus.DEAD_LETTERED
          : DeliveryStatus.FAILED,
        statusCode,
        errorMessage: message,
      },
    });

    if (isFinalAttempt) {
      await db.deadLetterJob.create({
        data: {
          endpointId,
          submissionId,
          jobType: "webhook-delivery",
          payload: JSON.parse(JSON.stringify({ url, fields })),
          errorMessage: message,
        },
      });
      logger.error({ submissionId, url }, "webhook: dead-lettered");
    } else {
      logger.warn({ submissionId, url, attempt: job.attemptsMade }, "webhook: retrying");
    }

    throw err; // BullMQ retries
  }
}
