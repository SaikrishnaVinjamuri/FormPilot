"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { LogOut, Sun, Moon } from "lucide-react";

interface Props {
  user: { name?: string | null; email?: string | null };
}

function breadcrumb(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length <= 1) return "Overview";

  const last = segments[segments.length - 1];
  const labels: Record<string, string> = {
    endpoints: "Endpoints",
    new: "New endpoint",
    settings: "Settings",
    admin: "Admin",
    users: "Users",
    dlq: "Dead Letter Queue",
  };

  if (segments.length === 3 && segments[1] === "endpoints") {
    return "Endpoint detail";
  }

  return labels[last] ?? last;
}

export function DashboardHeader({ user }: Props) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="h-14 border-b flex items-center justify-between px-6 bg-background shrink-0">
      <p className="text-sm font-medium">{breadcrumb(pathname)}</p>

      <div className="flex items-center gap-1">
        <span className="hidden sm:block text-sm text-muted-foreground mr-2">
          {user.name || user.email}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          title="Toggle theme"
        >
          {mounted && resolvedTheme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => signOut({ callbackUrl: "/login" })}
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
