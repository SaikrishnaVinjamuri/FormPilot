"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateEndpointForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/endpoints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        notificationEmail: form.get("notificationEmail") || undefined,
        redirectUrl: form.get("redirectUrl") || undefined,
        allowedOrigins: (form.get("allowedOrigins") as string)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        webhookUrls: (form.get("webhookUrls") as string)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        spamProtectionEnabled: true,
        rateLimitPerMinute: 30,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const text = await res.text();
      let message = "Something went wrong";
      try { message = (JSON.parse(text) as { error?: string }).error ?? message; } catch { /* non-JSON error */ }
      setError(message);
      return;
    }

    const endpoint = await res.json();
    router.push(`/dashboard/endpoints/${endpoint.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Endpoint name *</Label>
        <Input
          id="name"
          name="name"
          placeholder="Portfolio contact form"
          required
        />
        <p className="text-xs text-muted-foreground">
          For your reference only — visitors never see this.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notificationEmail">Notification email</Label>
        <Input
          id="notificationEmail"
          name="notificationEmail"
          type="email"
          placeholder="you@example.com"
        />
        <p className="text-xs text-muted-foreground">
          Receive an email on every new submission.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="redirectUrl">Redirect URL</Label>
        <Input
          id="redirectUrl"
          name="redirectUrl"
          type="url"
          placeholder="https://yoursite.com/thank-you"
        />
        <p className="text-xs text-muted-foreground">
          Where to send visitors after they submit. Leave blank to return JSON.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="allowedOrigins">Allowed origins</Label>
        <Input
          id="allowedOrigins"
          name="allowedOrigins"
          placeholder="https://yoursite.com, https://www.yoursite.com"
        />
        <p className="text-xs text-muted-foreground">
          Comma-separated. Only these domains can POST to your endpoint.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="webhookUrls">Webhook URLs</Label>
        <Input
          id="webhookUrls"
          name="webhookUrls"
          placeholder="https://hooks.slack.com/..."
        />
        <p className="text-xs text-muted-foreground">
          Comma-separated. Each submission is forwarded to these URLs.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create endpoint"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
