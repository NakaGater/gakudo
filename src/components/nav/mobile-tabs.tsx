"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getNavItems } from "./nav-items";
import type { AuthUser } from "@/lib/auth/get-user";

const VISIBLE_TABS = 4;

type MobileTabsProps = {
  user: AuthUser;
  pendingInquiries?: number;
  unreadAnnouncements?: number;
};

export function MobileTabs({ user, pendingInquiries = 0, unreadAnnouncements = 0 }: MobileTabsProps) {
  const pathname = usePathname();
  const allItems = getNavItems(user.role);
  const [moreOpen, setMoreOpen] = useState(false);

  const needsMore = allItems.length > VISIBLE_TABS + 1;
  const visibleItems = needsMore ? allItems.slice(0, VISIBLE_TABS) : allItems;
  const overflowItems = needsMore ? allItems.slice(VISIBLE_TABS) : [];

  const isActive = (href: string) => {
    if (pathname === href) return true;
    if (href === "/attendance/dashboard" || href === "/attendance/status") return false;
    if (href === "/attendance") {
      return pathname.startsWith("/attendance/") && pathname !== "/attendance/dashboard" && pathname !== "/attendance/status";
    }
    return pathname.startsWith(href + "/");
  };

  const overflowActive = overflowItems.some((item) => isActive(item.href));

  function getBadge(href: string) {
    if (href === "/admin/inquiries" && pendingInquiries > 0) return pendingInquiries;
    if (href === "/announcements" && unreadAnnouncements > 0) return unreadAnnouncements;
    return 0;
  }

  const overflowBadgeTotal = overflowItems.reduce((sum, item) => sum + getBadge(item.href), 0);

  return (
    <>
      {/* Overflow menu backdrop + panel */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="absolute bottom-14 left-0 right-0 bg-page border-t-2 border-dashed border-page-edge rounded-t-xl p-3 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-sm font-bold text-ink font-story">メニュー</span>
              <button onClick={() => setMoreOpen(false)} className="p-1 text-ink-light">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {overflowItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                const badge = getBadge(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg p-2 text-xs font-story font-bold transition-colors",
                      active ? "bg-accent/10 text-accent" : "text-ink-light hover:bg-page-deep",
                    )}
                  >
                    <span className="relative">
                      <Icon size={22} strokeWidth={1.75} />
                      {badge > 0 && (
                        <span className="absolute -top-1.5 -right-2.5 inline-flex items-center justify-center rounded-full bg-cr-red text-white text-[9px] font-bold min-w-[16px] h-[16px] px-1">
                          {badge}
                        </span>
                      )}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 inset-x-0 md:hidden bg-page border-t-2 border-dashed border-page-edge z-40">
        <div className="flex items-center justify-around h-14">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const badge = getBadge(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 py-1 text-xs font-story font-bold transition-colors",
                  active ? "text-accent" : "text-ink-light",
                )}
              >
                <span className="relative">
                  <Icon size={20} strokeWidth={1.75} />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 inline-flex items-center justify-center rounded-full bg-cr-red text-white text-[9px] font-bold min-w-[16px] h-[16px] px-1">
                      {badge}
                    </span>
                  )}
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}

          {/* "More" tab */}
          {needsMore && (
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-1 text-xs font-story font-bold transition-colors",
                overflowActive || moreOpen ? "text-accent" : "text-ink-light",
              )}
            >
              <span className="relative">
                <MoreHorizontal size={20} strokeWidth={1.75} />
                {overflowBadgeTotal > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 inline-flex items-center justify-center rounded-full bg-cr-red text-white text-[9px] font-bold min-w-[16px] h-[16px] px-1">
                    {overflowBadgeTotal}
                  </span>
                )}
              </span>
              <span>その他</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
