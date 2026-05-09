"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!hasPassword) {
    return (
      <p className="text-sm text-muted-foreground">
        Your account uses social login. Password change is not available.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const next = form.get("next") as string;
    const confirm = form.get("confirm") as string;

    if (next !== confirm) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/settings/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current: form.get("current"), next }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to update password");
      return;
    }
    setSuccess(true);
    (e.target as HTMLFormElement).reset();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="current">Current password</Label>
        <Input id="current" name="current" type="password" required autoComplete="current-password" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="next">New password</Label>
        <Input id="next" name="next" type="password" required minLength={8} autoComplete="new-password" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Confirm new password</Label>
        <Input id="confirm" name="confirm" type="password" required autoComplete="new-password" />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600">Password updated.</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Saving…" : "Update password"}
      </Button>
    </form>
  );
}
