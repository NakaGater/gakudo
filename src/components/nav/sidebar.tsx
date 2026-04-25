"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { getNavItems } from "./nav-items";
import type { BadgeCounts } from "./get-badge-counts";
import type { AuthUser } from "@/lib/auth/get-user";

type SidebarProps = {
  user: AuthUser;
  badgeCounts: BadgeCounts;
};

export function Sidebar({ user, badgeCounts }: SidebarProps) {
  const pathname = usePathname();
  const items = getNavItems(user.role);
  const { pendingInquiries, unreadAnnouncements } = badgeCounts;

  const isActive = (href: string) => {
    if (pathname === href) return true;
    if (href === "/attendance/dashboard" || href === "/attendance/status") return false;
    if (href === "/attendance") {
      return pathname.startsWith("/attendance/") && pathname !== "/attendance/dashboard" && pathname !== "/attendance/status";
    }
    if (href === "/photos") {
      return pathname.startsWith("/photos") || pathname.startsWith("/photos/instagram");
    }
    return pathname.startsWith(href + "/");
  };

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const roleLabel = user.role === "admin" ? "管理者" : user.role === "teacher" ? "先生" : user.role === "entrance" ? "入口端末" : "保護者";

  return (
    <aside className="sidebar hidden md:flex">
      <div className="sb__hd">
        <Link href={user.role === "parent" ? "/attendance/status" : "/attendance/dashboard"}>
          <span className="sb__mark">⭐</span>
          <span className="sb__name">星ヶ丘<br />こどもクラブ</span>
        </Link>
      </div>

      <nav className="sb__nav">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("ni", active && "active")}
            >
              <span className="ni__ic"><Icon size={16} strokeWidth={2} /></span>
              {item.label}
              {item.href === "/admin/inquiries" && pendingInquiries > 0 && (
                <span className="ml-auto inline-flex items-center justify-center rounded-full bg-cr-red text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1">
                  {pendingInquiries}
                </span>
              )}
              {item.href === "/announcements" && unreadAnnouncements > 0 && (
                <span className="ml-auto inline-flex items-center justify-center rounded-full bg-cr-red text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1">
                  {unreadAnnouncements}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="sb__ft">
        <Link href="/profile" className="flex items-center gap-2 min-w-0 flex-1 hover:opacity-80 transition-opacity">
          <div className="sb__av">{user.name.charAt(0)}</div>
          <div className="min-w-0 flex-1">
            <div className="sb__uname truncate">{user.name}</div>
            <div className="sb__urole">{roleLabel}</div>
          </div>
        </Link>
        <button
          onClick={handleLogout}
          className="ml-auto p-1 text-ink-light hover:text-cr-red transition-colors flex-shrink-0"
          aria-label="ログアウト"
        >
          <LogOut size={16} strokeWidth={1.75} />
        </button>
      </div>
    </aside>
  );
}
