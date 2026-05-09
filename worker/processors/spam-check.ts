import { Job } from "bullmq";
import { db } from "../lib/db";
import { logger } from "../lib/logger";

interface SpamCheckPayload {
  submissionId: string;
  endpointId: string;
  fields: Record<string, unknown>;
  ip: string;
}

// Basic heuristic spam scoring — extend with external APIs as needed
function scoreSpam(fields: Record<string, unknown>, ip: string): number {
  let score = 0;

  const text = Object.values(fields).join(" ").toLowerCase();

  // Common spam signals
  if ((text.match(/https?:\/\//g) ?? []).length > 3) score += 2;
  if (/\b(viagra|casino|lottery|winner|prize|click here)\b/i.test(text)) score += 3;
  if (text.length > 5000) score += 1;

  void ip; // reserved for IP reputation lookup

  return score;
}

export async function processSpamCheck(job: Job<SpamCheckPayload>) {
  const { submissionId, fields, ip } = job.data;

  const score = scoreSpam(fields, ip);
  const isSpam = score >= 3;

  if (isSpam) {
    await db.submission.update({
      where: { id: submissionId },
      data: { isSpam: true },
    });
    logger.info({ submissionId, score }, "spam-check: marked as spam");
  }
}
