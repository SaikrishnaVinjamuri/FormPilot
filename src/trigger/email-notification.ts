import { task } from "@trigger.dev/sdk/v3";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
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

export const emailNotificationTask = task({
  id: "email-notification",
  run: async (payload: EmailNotificationPayload) => {
    const { submissionId, endpointId, to, fields } = payload;

    const log = await db.deliveryLog.create({
      data: {
        endpointId,
        submissionId,
        type: DeliveryType.EMAIL_NOTIFICATION,
        destination: to,
        status: DeliveryStatus.PENDING,
      },
    });

    await sendEmail({
      to,
      subject: "New form submission",
      html: buildEmailHtml(fields),
    });

    await db.deliveryLog.update({
      where: { id: log.id },
      data: { status: DeliveryStatus.DELIVERED, resolvedAt: new Date() },
    });
  },
  onFailure: async ({ payload, error }: { payload: EmailNotificationPayload; error: unknown; [key: string]: unknown }) => {
    const { submissionId, endpointId, to, fields } = payload;
    const message = error instanceof Error ? error.message : String(error);

    await db.deliveryLog.updateMany({
      where: { submissionId, destination: to, type: DeliveryType.EMAIL_NOTIFICATION, status: DeliveryStatus.PENDING },
      data: { status: DeliveryStatus.DEAD_LETTERED, errorMessage: message },
    });

    await db.deadLetterJob.create({
      data: {
        endpointId,
        submissionId,
        jobType: "email-notification",
        payload: JSON.parse(JSON.stringify({ to, fields })),
        errorMessage: message,
      },
    });
  },
});
