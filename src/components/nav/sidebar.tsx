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
    window.location.href = "/";
  }

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-page border-r-2 border-dashed border-page-edge">
      {/* Facility name with star mascot */}
      <div className="flex items-center h-16 px-5 border-b-2 border-dashed border-page-edge">
        <Link href="/attendance/dashboard" className="flex items-center gap-2.5 font-story font-bold text-base text-ink no-underline">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-star border-2 border-star-gold shadow-[2px_2px_0_var(--star-gold)] text-lg">
            ⭐
          </span>
          <span>星ヶ丘こどもクラブ</span>
        </Link>
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
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold font-story transition-all",
                active
                  ? "bg-accent-light text-accent shadow-sm border border-page-edge"
                  : "text-ink-mid hover:bg-page-deep hover:text-ink",
              )}
            >
              <Icon size={20} strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="border-t-2 border-dashed border-page-edge px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-bold font-story text-ink truncate">{user.name}</p>
            <p className="text-xs text-ink-light truncate">{user.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-ink-light hover:text-cr-red hover:bg-absent-bg transition-colors"
            aria-label="ログアウト"
          >
            <LogOut size={18} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </aside>
  );
}
