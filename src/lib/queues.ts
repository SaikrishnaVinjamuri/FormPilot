import { Queue } from "bullmq";
import { redis } from "./redis";

export const QUEUE_NAMES = {
  SPAM_CHECK: "spam-check",
  EMAIL_NOTIFICATION: "email-notification",
  WEBHOOK_DELIVERY: "webhook-delivery",
  AUTO_RESPONSE: "auto-response",
} as const;

export const spamCheckQueue = new Queue(QUEUE_NAMES.SPAM_CHECK, {
  connection: redis,
});

export const emailNotificationQueue = new Queue(QUEUE_NAMES.EMAIL_NOTIFICATION, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
  },
});

export const webhookDeliveryQueue = new Queue(QUEUE_NAMES.WEBHOOK_DELIVERY, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
  },
});

export const autoResponseQueue = new Queue(QUEUE_NAMES.AUTO_RESPONSE, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
  },
});
