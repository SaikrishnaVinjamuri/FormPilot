import { z } from "zod";

export const createEndpointSchema = z.object({
  name: z.string().min(1).max(100),
  notificationEmail: z.string().email().optional().or(z.literal("")),
  redirectUrl: z.string().url().optional().or(z.literal("")),
  allowedOrigins: z.array(z.string()).default([]),
  webhookUrls: z.array(z.string().url()).default([]),
  autoResponseEnabled: z.boolean().default(false),
  autoResponseSubject: z.string().optional(),
  autoResponseTemplate: z.string().optional(),
  autoResponseEmailField: z.string().optional(),
  spamProtectionEnabled: z.boolean().default(true),
  fileUploadsEnabled: z.boolean().default(false),
  maxFileSizeBytes: z.number().default(1048576),
  allowedFileTypes: z.array(z.string()).default([]),
  rateLimitPerMinute: z.number().min(1).max(1000).default(30),
});

export type CreateEndpointInput = z.infer<typeof createEndpointSchema>;
