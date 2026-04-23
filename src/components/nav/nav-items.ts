import {
  Home,
  ScanLine,
  Bell,
  Camera,
  Receipt,
  Users,
  UserPlus,
  Globe,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  icon: LucideIcon;
  href: string;
  roles: Array<"parent" | "teacher" | "admin" | "entrance">;
};

export const navItems: NavItem[] = [
  { label: "ホーム", icon: Home, href: "/attendance/dashboard", roles: ["teacher", "admin", "entrance"] },
  { label: "入室状況", icon: Home, href: "/attendance/status", roles: ["parent"] },
  { label: "入退場", icon: ScanLine, href: "/attendance", roles: ["teacher", "admin", "entrance"] },
  { label: "連絡", icon: Bell, href: "/announcements", roles: ["parent", "teacher", "admin"] },
  { label: "写真", icon: Camera, href: "/photos", roles: ["parent", "teacher", "admin"] },
  { label: "請求", icon: Receipt, href: "/billing", roles: ["parent", "teacher", "admin"] },
  { label: "児童管理", icon: Users, href: "/children", roles: ["teacher", "admin"] },
  { label: "ユーザー", icon: UserPlus, href: "/admin/users", roles: ["admin"] },
  { label: "お問い合わせ", icon: MessageSquare, href: "/admin/inquiries", roles: ["admin", "teacher"] },
  { label: "HP管理", icon: Globe, href: "/admin/site/pages", roles: ["admin"] },
];

export function getNavItems(role: string): NavItem[] {
  return navItems.filter((item) => item.roles.includes(role as NavItem["roles"][number]));
}
