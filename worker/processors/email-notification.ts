import { Job } from "bullmq";
import { sendEmail } from "../lib/email";
import { db } from "../lib/db";
import { logger } from "../lib/logger";
import { DeliveryStatus, DeliveryType } from "@prisma/client";

interface EmailNotificationPayload {
  submissionId: string;
  endpointId: string;
  to: string;
  fields: Record<string, unknown>;
}

function buildEmailHtml(fields: Record<string, unknown>): string {
  const rows = Object.entries(fields)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px;font-weight:600;color:#374151;white-space:nowrap">${k}</td><td style="padding:6px 12px;color:#111827">${String(v)}</td></tr>`
    )
    .join("");
  return `<table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;width:100%">${rows}</table>`;
}

export async function processEmailNotification(
  job: Job<EmailNotificationPayload>
) {
  const { submissionId, endpointId, to, fields } = job.data;

  const log = await db.deliveryLog.create({
    data: {
      endpointId,
      submissionId,
      type: DeliveryType.EMAIL_NOTIFICATION,
      destination: to,
      status: DeliveryStatus.PENDING,
    },
  });

  try {
    await sendEmail({
      to,
      subject: "New form submission",
      html: buildEmailHtml(fields),
    });

    await db.deliveryLog.update({
      where: { id: log.id },
      data: { status: DeliveryStatus.DELIVERED, resolvedAt: new Date() },
    });

    logger.info({ submissionId, to }, "email-notification: delivered");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isFinalAttempt = job.attemptsMade >= (job.opts.attempts ?? 1) - 1;

    await db.deliveryLog.update({
      where: { id: log.id },
      data: {
        status: isFinalAttempt ? DeliveryStatus.DEAD_LETTERED : DeliveryStatus.FAILED,
        errorMessage: message,
      },
    });

    if (isFinalAttempt) {
      await db.deadLetterJob.create({
        data: {
          endpointId,
          submissionId,
          jobType: "email-notification",
          payload: JSON.parse(JSON.stringify({ to, fields })),
          errorMessage: message,
        },
      });
      logger.error({ submissionId, to }, "email-notification: dead-lettered");
    } else {
      logger.warn({ submissionId, to, attempt: job.attemptsMade }, "email-notification: retrying");
    }

    throw err;
  }
}
