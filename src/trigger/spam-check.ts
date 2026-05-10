import { task } from "@trigger.dev/sdk/v3";
import { db } from "@/lib/db";

interface SpamCheckPayload {
  submissionId: string;
  endpointId: string;
  fields: Record<string, unknown>;
  ip: string;
}

function scoreSpam(fields: Record<string, unknown>): number {
  let score = 0;
  const text = Object.values(fields).join(" ").toLowerCase();
  if ((text.match(/https?:\/\//g) ?? []).length > 3) score += 2;
  if (/\b(viagra|casino|lottery|winner|prize|click here)\b/i.test(text)) score += 3;
  if (text.length > 5000) score += 1;
  return score;
}

export const spamCheckTask = task({
  id: "spam-check",
  run: async (payload: SpamCheckPayload) => {
    const { submissionId, fields } = payload;
    const score = scoreSpam(fields);
    if (score >= 3) {
      await db.submission.update({
        where: { id: submissionId },
        data: { isSpam: true },
      });
    }
  },
});
