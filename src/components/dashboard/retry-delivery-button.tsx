"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export function RetryDeliveryButton({ logId }: { logId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [queued, setQueued] = useState(false);

  async function retry() {
    setLoading(true);
    await fetch(`/api/delivery-logs/${logId}/retry`, { method: "POST" });
    setLoading(false);
    setQueued(true);
    setTimeout(() => router.refresh(), 3000);
  }

  if (queued) {
    return <span className="text-xs text-muted-foreground">Queued</span>;
  }

  return (
    <Button variant="outline" size="sm" onClick={retry} disabled={loading} className="h-7 text-xs">
      <RotateCcw className="h-3 w-3 mr-1" />
      {loading ? "…" : "Retry"}
    </Button>
  );
}
