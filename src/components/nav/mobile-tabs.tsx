"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getNavItems } from "./nav-items";
import type { AuthUser } from "@/lib/auth/get-user";

const MAX_TABS = 5;

type MobileTabsProps = {
  user: AuthUser;
  pendingInquiries?: number;
  unreadAnnouncements?: number;
};

export function MobileTabs({ user, pendingInquiries = 0, unreadAnnouncements = 0 }: MobileTabsProps) {
  const pathname = usePathname();
  const items = getNavItems(user.role).slice(0, MAX_TABS);

  const isActive = (href: string) =>
    (() => {
      if (pathname === href) return true;
      if (href === "/attendance/dashboard" || href === "/attendance/status") return false;
      if (href === "/attendance") {
        return pathname.startsWith("/attendance/") && pathname !== "/attendance/dashboard" && pathname !== "/attendance/status";
      }
      return pathname.startsWith(href + "/");
    })();

  return (
    <nav className="fixed bottom-0 inset-x-0 md:hidden bg-page border-t-2 border-dashed border-page-edge z-40">
      <div className="flex items-center justify-around h-14">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
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
                {item.href === "/admin/inquiries" && pendingInquiries > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 inline-flex items-center justify-center rounded-full bg-cr-red text-white text-[9px] font-bold min-w-[16px] h-[16px] px-1">
                    {pendingInquiries}
                  </span>
                )}
                {item.href === "/announcements" && unreadAnnouncements > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 inline-flex items-center justify-center rounded-full bg-cr-red text-white text-[9px] font-bold min-w-[16px] h-[16px] px-1">
                    {unreadAnnouncements}
                  </span>
                )}
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
