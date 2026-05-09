"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

interface Props {
  user: { name?: string | null; email?: string | null };
}

export function DashboardHeader({ user }: Props) {
  return (
    <header className="h-14 border-b flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          {user.name || user.email}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          Sign out
        </Button>
      </div>
    </header>
  );
}
