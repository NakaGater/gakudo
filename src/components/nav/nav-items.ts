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
  { label: "ホーム", icon: Home, href: "/attendance/dashboard", roles: ["parent", "teacher", "admin"] },
  { label: "入退場", icon: ScanLine, href: "/attendance", roles: ["parent", "teacher", "admin"] },
  { label: "連絡", icon: Bell, href: "/announcements", roles: ["parent", "teacher", "admin"] },
  { label: "写真", icon: Camera, href: "/photos", roles: ["parent", "teacher", "admin"] },
  { label: "請求", icon: Receipt, href: "/billing", roles: ["parent", "teacher", "admin"] },
  { label: "児童管理", icon: Users, href: "/children", roles: ["teacher", "admin"] },
  { label: "ユーザー", icon: UserPlus, href: "/admin/users", roles: ["admin"] },
  { label: "HP管理", icon: Globe, href: "/admin/site/pages", roles: ["admin"] },
];

export function getNavItems(role: string): NavItem[] {
  return navItems.filter((item) => item.roles.includes(role as NavItem["roles"][number]));
}
