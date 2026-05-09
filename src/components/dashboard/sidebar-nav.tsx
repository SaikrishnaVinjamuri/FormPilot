"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Radio, Settings, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/endpoints", label: "Endpoints", icon: Radio, exact: false },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, exact: true },
];

interface Props {
  user: { role?: string; name?: string | null; email?: string | null };
}

function initials(name?: string | null, email?: string | null): string {
  if (name) return name.slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return "FP";
}

export function SidebarNav({ user }: Props) {
  const pathname = usePathname();

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <aside className="w-56 border-r bg-background flex flex-col">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
          <Radio className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-bold text-sm tracking-tight">FormPilot</span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-2 space-y-0.5">
        {links.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
              isActive(href, exact)
                ? "bg-primary text-primary-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}

        {user.role === "ADMIN" && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
              pathname.startsWith("/admin")
                ? "bg-primary text-primary-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Shield className="h-4 w-4 shrink-0" />
            Admin
          </Link>
        )}
      </nav>

      {/* User section */}
      <div className="border-t p-3">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-accent-foreground">
              {initials(user.name, user.email)}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">{user.name ?? user.email}</p>
            {user.name && (
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
