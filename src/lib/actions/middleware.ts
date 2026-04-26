import { ERROR_MESSAGES } from "@/config/constants";
import { getUser, type AuthUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./types";

export type Role = "parent" | "teacher" | "admin" | "entrance";

/**
 * A guard can be a single role, an allow-list of roles, or a custom
 * predicate. Predicates are useful for ad-hoc checks that don't fit
 * a fixed role list (e.g. "admin OR resource owner").
 */
export type Guard = Role | readonly Role[] | ((user: AuthUser) => boolean);

function passes(guard: Guard, user: AuthUser): boolean {
  if (typeof guard === "function") return guard(user);
  if (typeof guard === "string") return user.role === guard;
  return guard.includes(user.role as Role);
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type ActionContext = {
  user: AuthUser;
  supabase: SupabaseServerClient;
};

/**
 * Wrap a Server Action so the boilerplate of "fetch user → check role
 * → return ERROR_MESSAGES.UNAUTHORIZED" lives in one place.
 *
 * The handler receives:
 *   - ctx.user: the AuthUser from React.cache(getUser) — same instance
 *     the page tree already memoized.
 *   - ctx.supabase: a per-request Supabase server client. Reusing it
 *     across calls in the same handler avoids re-instantiation while
 *     still respecting the cookie store.
 *
 * Constrained to `TResult extends ActionResult` so the unauthorized
 * failure shape `{ success: false; message: string }` is structurally
 * compatible with whatever the handler returns. Subtypes that add
 * extra fields (e.g. AttendanceResult: childName / type / recordedAt)
 * are still narrowable at the callsite via discriminated checks like
 * `if (res.success && res.childName)`.
 *
 * Migration plan: per-domain in follow-ups (see Phase 2-C in the plan).
 * After the last action migrates, an ESLint rule will forbid raw
 * `getUser()` outside of RSC pages and layouts.
 */
export function withAuth<TArgs extends unknown[], TResult extends ActionResult>(
  guard: Guard,
  handler: (ctx: ActionContext, ...args: TArgs) => Promise<TResult>,
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs) => {
    const user = await getUser();
    if (!passes(guard, user)) {
      // Cast is sound: ActionResult is the structural lower bound of
      // every TResult. Subtype-specific fields stay undefined on the
      // failure path, which is what callers already check for.
      return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED } as TResult;
    }
    const supabase = await createClient();
    return handler({ user, supabase }, ...args);
  };
}
