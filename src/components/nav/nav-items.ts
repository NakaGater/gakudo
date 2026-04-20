import {
  Home,
  ScanLine,
  Bell,
  Camera,
  Receipt,
  Users,
  UserPlus,
  Globe,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  icon: LucideIcon;
  href: string;
  roles: Array<"parent" | "teacher" | "admin">;
};

export const navItems: NavItem[] = [
  { label: "ホーム", icon: Home, href: "/dashboard", roles: ["parent", "teacher", "admin"] },
  { label: "入退場", icon: ScanLine, href: "/dashboard/attendance", roles: ["parent", "teacher", "admin"] },
  { label: "連絡", icon: Bell, href: "/dashboard/announcements", roles: ["parent", "teacher", "admin"] },
  { label: "写真", icon: Camera, href: "/dashboard/photos", roles: ["parent", "teacher", "admin"] },
  { label: "請求", icon: Receipt, href: "/dashboard/billing", roles: ["parent", "teacher", "admin"] },
  { label: "児童管理", icon: Users, href: "/dashboard/children", roles: ["teacher", "admin"] },
  { label: "ユーザー", icon: UserPlus, href: "/dashboard/admin/users", roles: ["admin"] },
  { label: "HP管理", icon: Globe, href: "/dashboard/admin/site/pages", roles: ["admin"] },
];

export function getNavItems(role: string): NavItem[] {
  return navItems.filter((item) => item.roles.includes(role as NavItem["roles"][number]));
}
