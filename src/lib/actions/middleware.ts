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
 * The wrapped function returns either the handler's TResult or an
 * UNAUTHORIZED ActionResult. Most existing actions return ActionResult,
 * so the union collapses cleanly; non-ActionResult-returning actions
 * must explicitly handle the failure shape (or use a guard that never
 * fails by passing `() => true`).
 *
 * Migration plan: per-domain in follow-ups (see Phase 2-C in the plan).
 * Until then, raw `getUser()` calls are not flagged. After the last
 * action migrates, an ESLint rule will forbid `getUser()` outside of
 * RSC pages and layouts.
 */
export function withAuth<TArgs extends unknown[], TResult>(
  guard: Guard,
  handler: (ctx: ActionContext, ...args: TArgs) => Promise<TResult>,
): (...args: TArgs) => Promise<TResult | ActionResult> {
  return async (...args: TArgs) => {
    const user = await getUser();
    if (!passes(guard, user)) {
      return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED };
    }
    const supabase = await createClient();
    return handler({ user, supabase }, ...args);
  };
}
