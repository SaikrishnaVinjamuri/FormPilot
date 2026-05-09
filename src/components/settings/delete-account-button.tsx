"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DeleteAccountButton() {
  const [confirming, setConfirming] = useState(false);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    await fetch("/api/settings/account", { method: "DELETE" });
    await signOut({ callbackUrl: "/" });
  }

  if (!confirming) {
    return (
      <Button variant="destructive" onClick={() => setConfirming(true)}>
        Delete account
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-destructive/40 p-4">
      <p className="text-sm">
        Type <strong>delete my account</strong> to confirm.
      </p>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="delete my account"
      />
      <div className="flex gap-2">
        <Button
          variant="destructive"
          disabled={value !== "delete my account" || loading}
          onClick={handleDelete}
        >
          {loading ? "Deleting…" : "Permanently delete"}
        </Button>
        <Button variant="outline" onClick={() => { setConfirming(false); setValue(""); }}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
