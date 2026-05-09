"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Copy, Check } from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  lastUsed: Date | null;
  createdAt: Date;
}

export function ApiKeysPanel({ initialKeys }: { initialKeys: ApiKey[] }) {
  const router = useRouter();
  const [keys, setKeys] = useState(initialKeys);
  const [loading, setLoading] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [revealed, setRevealed] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function createKey(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/settings/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newKeyName }),
    });
    setLoading(false);
    if (!res.ok) return;
    const data = await res.json();
    setRevealed(data.key);
    setNewKeyName("");
    router.refresh();
  }

  async function revokeKey(id: string) {
    if (!confirm("Revoke this API key?")) return;
    await fetch(`/api/settings/api-keys/${id}`, { method: "DELETE" });
    setKeys((prev) => prev.filter((k) => k.id !== id));
  }

  async function copyKey() {
    if (!revealed) return;
    await navigator.clipboard.writeText(revealed);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Revealed key banner */}
      {revealed && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4 space-y-2">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            Copy this key now — it won&apos;t be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="text-xs font-mono bg-background border rounded px-2 py-1.5 flex-1 truncate">
              {revealed}
            </code>
            <Button variant="outline" size="sm" onClick={copyKey}>
              {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setRevealed(null)}>
            I&apos;ve copied it
          </Button>
        </div>
      )}

      {/* Existing keys */}
      {keys.length > 0 && (
        <div className="rounded-md border divide-y">
          {keys.map((key) => (
            <div key={key.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">{key.name}</p>
                <p className="text-xs text-muted-foreground">
                  Created {new Date(key.createdAt).toLocaleDateString()} ·{" "}
                  {key.lastUsed
                    ? `Last used ${new Date(key.lastUsed).toLocaleDateString()}`
                    : "Never used"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => revokeKey(key.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Create key */}
      <form onSubmit={createKey} className="flex gap-2">
        <div className="flex-1 space-y-1">
          <Label htmlFor="keyName" className="sr-only">Key name</Label>
          <Input
            id="keyName"
            placeholder="Key name (e.g. production)"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Creating…" : "Generate key"}
        </Button>
      </form>
    </div>
  );
}
