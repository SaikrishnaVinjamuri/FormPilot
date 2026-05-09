"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Overview", key: "overview" },
  { href: "/admin/users", label: "Users", key: "users" },
  { href: "/admin/dlq", label: "Dead Letter Queue", key: "dlq" },
];

export function AdminNav({ current }: { current: string }) {
  return (
    <div className="flex gap-1 border-b pb-0">
      {links.map(({ href, label, key }) => (
        <Link
          key={key}
          href={href}
          className={cn(
            "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
            current === key
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
