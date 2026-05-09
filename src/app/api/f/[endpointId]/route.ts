import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  spamCheckQueue,
  emailNotificationQueue,
  webhookDeliveryQueue,
  autoResponseQueue,
} from "@/lib/queues";

type Context = { params: Promise<{ endpointId: string }> };

function buildCorsHeaders(
  origin: string | null,
  allowedOrigins: string[]
): Record<string, string> | null {
  if (allowedOrigins.length === 0) {
    return {
      "Access-Control-Allow-Origin": origin ?? "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
  }
  if (origin && allowedOrigins.includes(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      Vary: "Origin",
    };
  }
  return null;
}

async function parseBody(req: NextRequest): Promise<Record<string, unknown>> {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return req.json();
  }

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const fields: Record<string, unknown> = {};
    for (const [key, value] of formData.entries()) {
      if (typeof value === "string") fields[key] = value;
    }
    return fields;
  }

  // application/x-www-form-urlencoded fallback
  const text = await req.text();
  const fields: Record<string, unknown> = {};
  for (const [key, value] of new URLSearchParams(text).entries()) {
    fields[key] = value;
  }
  return fields;
}

export async function OPTIONS(req: NextRequest, { params }: Context) {
  const { endpointId } = await params;
  const endpoint = await db.formEndpoint.findUnique({
    where: { id: endpointId },
    select: { allowedOrigins: true, isActive: true },
  });

  if (!endpoint?.isActive) return new NextResponse(null, { status: 404 });

  const corsHeaders = buildCorsHeaders(
    req.headers.get("origin"),
    endpoint.allowedOrigins
  );
  if (!corsHeaders) return new NextResponse(null, { status: 403 });

  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: NextRequest, { params }: Context) {
  const { endpointId } = await params;

  const endpoint = await db.formEndpoint.findUnique({
    where: { id: endpointId },
  });

  if (!endpoint?.isActive) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // CORS
  const origin = req.headers.get("origin");
  const corsHeaders = buildCorsHeaders(origin, endpoint.allowedOrigins);
  if (!corsHeaders) {
    return NextResponse.json(
      { error: "Origin not allowed" },
      { status: 403 }
    );
  }

  // Rate limit
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed, remaining } = await checkRateLimit(
    `ratelimit:${endpointId}:${ip}`,
    endpoint.rateLimitPerMinute
  );

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          ...corsHeaders,
          "X-RateLimit-Limit": String(endpoint.rateLimitPerMinute),
          "X-RateLimit-Remaining": "0",
          "Retry-After": "60",
        },
      }
    );
  }

  // Parse body
  const fields = await parseBody(req);

  // Honeypot spam detection
  const isSpam =
    endpoint.spamProtectionEnabled && !!fields[endpoint.honeypotFieldName];

  // Strip honeypot from stored fields
  const rawFields = { ...fields };
  delete rawFields[endpoint.honeypotFieldName];
  // JSON roundtrip: strips `unknown`, satisfies Prisma's InputJsonValue
  const cleanFields = JSON.parse(JSON.stringify(rawFields));

  // Persist
  const submission = await db.submission.create({
    data: {
      endpointId,
      fields: cleanFields,
      ipAddress: ip,
      userAgent: req.headers.get("user-agent"),
      referer: req.headers.get("referer"),
      isSpam,
    },
  });

  // Enqueue jobs
  if (!isSpam) {
    if (endpoint.notificationEmail) {
      await emailNotificationQueue.add("send", {
        submissionId: submission.id,
        endpointId,
        to: endpoint.notificationEmail,
        fields: cleanFields,
      });
    }

    for (const url of endpoint.webhookUrls) {
      await webhookDeliveryQueue.add("deliver", {
        submissionId: submission.id,
        endpointId,
        url,
        fields: cleanFields,
      });
    }

    if (endpoint.autoResponseEnabled && endpoint.autoResponseEmailField) {
      const recipientEmail = cleanFields[endpoint.autoResponseEmailField];
      if (typeof recipientEmail === "string" && recipientEmail.includes("@")) {
        await autoResponseQueue.add("send", {
          submissionId: submission.id,
          endpointId,
          to: recipientEmail,
          subject: endpoint.autoResponseSubject,
          template: endpoint.autoResponseTemplate,
          fields: cleanFields,
        });
      }
    }
  }

  // Always enqueue async spam analysis (may update isSpam after honeypot check)
  await spamCheckQueue.add("check", {
    submissionId: submission.id,
    endpointId,
    fields: cleanFields,
    ip,
  });

  const responseHeaders = {
    ...corsHeaders,
    "X-RateLimit-Limit": String(endpoint.rateLimitPerMinute),
    "X-RateLimit-Remaining": String(remaining),
  };

  if (endpoint.redirectUrl) {
    return NextResponse.redirect(endpoint.redirectUrl, {
      status: 302,
      headers: responseHeaders,
    });
  }

  return NextResponse.json(
    { success: true, id: submission.id },
    { headers: responseHeaders }
  );
}
