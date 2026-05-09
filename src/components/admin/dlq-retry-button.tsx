"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export function DlqRetryButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function retry() {
    setLoading(true);
    await fetch(`/api/admin/dlq/${jobId}`, { method: "POST" });
    setLoading(false);
    setDone(true);
    router.refresh();
  }

  if (done) return <span className="text-xs text-muted-foreground">Queued</span>;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={retry}
      disabled={loading}
      className="h-7 text-xs"
    >
      <RotateCcw className="h-3 w-3 mr-1" />
      {loading ? "Retrying…" : "Retry"}
    </Button>
  );
}
