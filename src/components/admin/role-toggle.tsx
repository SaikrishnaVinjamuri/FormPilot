"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Props {
  userId: string;
  currentRole: string;
  selfId: string;
}

export function RoleToggle({ userId, currentRole, selfId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isSelf = userId === selfId;

  const nextRole = currentRole === "ADMIN" ? "DEVELOPER" : "ADMIN";

  async function toggle() {
    setLoading(true);
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: nextRole }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant={currentRole === "ADMIN" ? "default" : "secondary"} className="text-xs">
        {currentRole}
      </Badge>
      {!isSelf && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs px-2"
          onClick={toggle}
          disabled={loading}
        >
          {loading ? "…" : `→ ${nextRole}`}
        </Button>
      )}
    </div>
  );
}
