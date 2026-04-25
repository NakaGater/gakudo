import { isStaff } from "@/lib/auth/roles";

export function getRedirectPathForRole(role: string | undefined | null): string {
  return role && isStaff(role) ? "/attendance/dashboard" : "/announcements";
}
