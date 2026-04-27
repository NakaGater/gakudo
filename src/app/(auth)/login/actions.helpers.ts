import { isStaff } from "@/lib/auth/roles";

/**
 * Where to send a freshly-authenticated user. The page they land on
 * is the one they care about most for their role:
 *
 *   - staff (admin / teacher / entrance) → /attendance/dashboard
 *     (today's attendance overview)
 *   - parent → /attendance/status
 *     (their own child's "in/out" status — the most common reason a
 *     parent opens the app)
 *   - unknown / undefined / null → /announcements
 *     (lowest-privilege dashboard page; a malformed role value won't
 *     drop the user onto something role-gated)
 */
export function getRedirectPathForRole(role: string | undefined | null): string {
  if (role && isStaff(role)) return "/attendance/dashboard";
  if (role === "parent") return "/attendance/status";
  return "/announcements";
}
