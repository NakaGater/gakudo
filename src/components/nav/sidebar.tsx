"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { getNavItems } from "./nav-items";
import type { AuthUser } from "@/lib/auth/get-user";

type SidebarProps = {
  user: AuthUser;
};

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const items = getNavItems(user.role);

  const isActive = (href: string) => {
    if (pathname === href) return true;
    if (href === "/attendance/dashboard") return false;
    if (href === "/attendance") {
      return pathname.startsWith("/attendance/") && pathname !== "/attendance/dashboard";
    }
    return pathname.startsWith(href + "/");
  };

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-bg-elev border-r border-border">
      {/* Facility name */}
      <div className="flex items-center h-16 px-6 border-b border-border">
        <span className="text-lg font-bold text-fg truncate">
          星ヶ丘こどもクラブ
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-accent-light text-accent"
                  : "text-fg-muted hover:bg-bg hover:text-fg",
              )}
            >
              <Icon size={20} strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-fg truncate">{user.name}</p>
            <p className="text-xs text-fg-muted truncate">{user.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-md text-fg-muted hover:text-danger hover:bg-bg transition-colors"
            aria-label="ログアウト"
          >
            <LogOut size={18} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </aside>
  );
}
