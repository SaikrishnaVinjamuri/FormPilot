import { Job } from "bullmq";
import { sendEmail } from "../lib/email";
import { db } from "../lib/db";
import { logger } from "../lib/logger";
import { DeliveryStatus, DeliveryType } from "@prisma/client";

interface AutoResponsePayload {
  submissionId: string;
  endpointId: string;
  to: string;
  subject: string | null;
  template: string | null;
  fields: Record<string, unknown>;
}

function interpolate(template: string, fields: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    key in fields ? String(fields[key]) : ""
  );
}

export async function processAutoResponse(job: Job<AutoResponsePayload>) {
  const { submissionId, endpointId, to, subject, template, fields } = job.data;

  const log = await db.deliveryLog.create({
    data: {
      endpointId,
      submissionId,
      type: DeliveryType.AUTO_RESPONSE,
      destination: to,
      status: DeliveryStatus.PENDING,
    },
  });

  const emailSubject = subject
    ? interpolate(subject, fields)
    : "Thank you for your message";
  const emailHtml = template
    ? interpolate(template, fields)
    : "<p>Thank you for reaching out. We'll be in touch soon.</p>";

  try {
    await sendEmail({ to, subject: emailSubject, html: emailHtml });

    await db.deliveryLog.update({
      where: { id: log.id },
      data: { status: DeliveryStatus.DELIVERED, resolvedAt: new Date() },
    });

    logger.info({ submissionId, to }, "auto-response: delivered");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db.deliveryLog.update({
      where: { id: log.id },
      data: { status: DeliveryStatus.FAILED, errorMessage: message },
    });
    logger.error({ submissionId, to, err: message }, "auto-response: failed");
    throw err;
  }
}
