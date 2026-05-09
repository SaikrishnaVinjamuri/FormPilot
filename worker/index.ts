import "dotenv/config";
import { Worker } from "bullmq";
import { redis } from "./lib/redis";
import { logger } from "./lib/logger";
import { QUEUE_NAMES } from "./lib/queues";
import { processSpamCheck } from "./processors/spam-check";
import { processEmailNotification } from "./processors/email-notification";
import { processWebhookDelivery } from "./processors/webhook-delivery";
import { processAutoResponse } from "./processors/auto-response";

const workers = [
  new Worker(QUEUE_NAMES.SPAM_CHECK, processSpamCheck, {
    connection: redis,
    concurrency: 5,
  }),

  new Worker(QUEUE_NAMES.EMAIL_NOTIFICATION, processEmailNotification, {
    connection: redis,
    concurrency: 3,
  }),

  new Worker(QUEUE_NAMES.WEBHOOK_DELIVERY, processWebhookDelivery, {
    connection: redis,
    concurrency: 10,
  }),

  new Worker(QUEUE_NAMES.AUTO_RESPONSE, processAutoResponse, {
    connection: redis,
    concurrency: 3,
  }),
];

for (const worker of workers) {
  worker.on("completed", (job) => {
    logger.debug({ queue: worker.name, jobId: job.id }, "job completed");
  });
  worker.on("failed", (job, err) => {
    logger.error({ queue: worker.name, jobId: job?.id, err: err.message }, "job failed");
  });
}

logger.info("worker started — listening on all queues");

async function shutdown() {
  logger.info("shutting down workers...");
  await Promise.all(workers.map((w) => w.close()));
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
