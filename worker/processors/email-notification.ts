import { Job } from "bullmq";
import { getResend, FROM_EMAIL } from "../lib/email";
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
        `<tr><td style="padding:4px 8px;font-weight:600">${k}</td><td style="padding:4px 8px">${String(v)}</td></tr>`
    )
    .join("");
  return `<table style="border-collapse:collapse;font-family:sans-serif">${rows}</table>`;
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
    const { error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: "New form submission",
      html: buildEmailHtml(fields),
    });

    if (error) throw new Error(error.message);

    await db.deliveryLog.update({
      where: { id: log.id },
      data: { status: DeliveryStatus.DELIVERED, resolvedAt: new Date() },
    });

    logger.info({ submissionId, to }, "email-notification: delivered");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db.deliveryLog.update({
      where: { id: log.id },
      data: { status: DeliveryStatus.FAILED, errorMessage: message },
    });
    logger.error({ submissionId, to, err: message }, "email-notification: failed");
    throw err; // BullMQ retries
  }
}
