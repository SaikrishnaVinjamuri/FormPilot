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
          jobType: "auto-response",
          payload: JSON.parse(JSON.stringify({ to, subject, template, fields })),
          errorMessage: message,
        },
      });
      logger.error({ submissionId, to }, "auto-response: dead-lettered");
    } else {
      logger.warn({ submissionId, to, attempt: job.attemptsMade }, "auto-response: retrying");
    }

    throw err;
  }
}
