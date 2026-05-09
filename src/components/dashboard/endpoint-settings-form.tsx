"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { FormEndpoint } from "@prisma/client";

interface Props {
  endpoint: FormEndpoint;
}

export function EndpointSettingsForm({ endpoint }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [autoResponse, setAutoResponse] = useState(
    endpoint.autoResponseEnabled
  );
  const [spamProtection, setSpamProtection] = useState(
    endpoint.spamProtectionEnabled
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    const form = new FormData(e.currentTarget);

    const body = {
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
      spamProtectionEnabled: spamProtection,
      autoResponseEnabled: autoResponse,
      autoResponseEmailField: form.get("autoResponseEmailField") || undefined,
      autoResponseSubject: form.get("autoResponseSubject") || undefined,
      autoResponseTemplate: form.get("autoResponseTemplate") || undefined,
      rateLimitPerMinute: Number(form.get("rateLimitPerMinute")),
    };

    const res = await fetch(`/api/endpoints/${endpoint.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong");
      return;
    }

    setSuccess(true);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`Delete "${endpoint.name}"? This cannot be undone.`)) return;

    await fetch(`/api/endpoints/${endpoint.id}`, { method: "DELETE" });
    router.push("/dashboard/endpoints");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={endpoint.name} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notificationEmail">Notification email</Label>
        <Input
          id="notificationEmail"
          name="notificationEmail"
          type="email"
          defaultValue={endpoint.notificationEmail ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="redirectUrl">Redirect URL</Label>
        <Input
          id="redirectUrl"
          name="redirectUrl"
          type="url"
          defaultValue={endpoint.redirectUrl ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="allowedOrigins">Allowed origins</Label>
        <Input
          id="allowedOrigins"
          name="allowedOrigins"
          defaultValue={endpoint.allowedOrigins.join(", ")}
          placeholder="https://yoursite.com"
        />
        <p className="text-xs text-muted-foreground">Comma-separated. Empty = allow all.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="webhookUrls">Webhook URLs</Label>
        <Input
          id="webhookUrls"
          name="webhookUrls"
          defaultValue={endpoint.webhookUrls.join(", ")}
        />
        <p className="text-xs text-muted-foreground">Comma-separated.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rateLimitPerMinute">Rate limit (req/min)</Label>
        <Input
          id="rateLimitPerMinute"
          name="rateLimitPerMinute"
          type="number"
          min={1}
          max={1000}
          defaultValue={endpoint.rateLimitPerMinute}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <p className="text-sm font-medium">Spam protection</p>
          <p className="text-xs text-muted-foreground">Honeypot + heuristic scoring</p>
        </div>
        <Switch
          checked={spamProtection}
          onCheckedChange={setSpamProtection}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <p className="text-sm font-medium">Auto-response</p>
          <p className="text-xs text-muted-foreground">Send a reply email to submitters</p>
        </div>
        <Switch
          checked={autoResponse}
          onCheckedChange={setAutoResponse}
        />
      </div>

      {autoResponse && (
        <div className="space-y-4 pl-2 border-l-2 border-muted">
          <div className="space-y-2">
            <Label htmlFor="autoResponseEmailField">Email field name</Label>
            <Input
              id="autoResponseEmailField"
              name="autoResponseEmailField"
              placeholder="email"
              defaultValue={endpoint.autoResponseEmailField ?? ""}
            />
            <p className="text-xs text-muted-foreground">
              Which field in the submission contains the reply-to address.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="autoResponseSubject">Subject</Label>
            <Input
              id="autoResponseSubject"
              name="autoResponseSubject"
              placeholder="Thank you for your message"
              defaultValue={endpoint.autoResponseSubject ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="autoResponseTemplate">Body (HTML)</Label>
            <Textarea
              id="autoResponseTemplate"
              name="autoResponseTemplate"
              rows={5}
              placeholder="<p>Hi {{name}}, thanks for reaching out!</p>"
              defaultValue={endpoint.autoResponseTemplate ?? ""}
            />
            <p className="text-xs text-muted-foreground">
              Use <code>{"{{fieldName}}"}</code> to insert submission values.
            </p>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && (
        <p className="text-sm text-green-600">Settings saved.</p>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save settings"}
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={handleDelete}
        >
          Delete endpoint
        </Button>
      </div>
    </form>
  );
}
