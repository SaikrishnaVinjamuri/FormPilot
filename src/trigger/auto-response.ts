import { task } from "@trigger.dev/sdk/v3";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
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

export const autoResponseTask = task({
  id: "auto-response",
  run: async (payload: AutoResponsePayload) => {
    const { submissionId, endpointId, to, subject, template, fields } = payload;

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

    await sendEmail({ to, subject: emailSubject, html: emailHtml });

    await db.deliveryLog.update({
      where: { id: log.id },
      data: { status: DeliveryStatus.DELIVERED, resolvedAt: new Date() },
    });
  },
  onFailure: async ({ payload, error }: { payload: AutoResponsePayload; error: unknown; [key: string]: unknown }) => {
    const { submissionId, endpointId, to, subject, template, fields } = payload;
    const message = error instanceof Error ? error.message : String(error);

    await db.deliveryLog.updateMany({
      where: { submissionId, destination: to, type: DeliveryType.AUTO_RESPONSE, status: DeliveryStatus.PENDING },
      data: { status: DeliveryStatus.DEAD_LETTERED, errorMessage: message },
    });

    await db.deadLetterJob.create({
      data: {
        endpointId,
        submissionId,
        jobType: "auto-response",
        payload: JSON.parse(JSON.stringify({ to, subject, template, fields })),
        errorMessage: message,
      },
    });
  },
});
