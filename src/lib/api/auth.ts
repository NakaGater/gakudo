import { NextResponse } from "next/server";
import { isAdmin, isAdminOrTeacher, isStaff } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import type { User, SupabaseClient } from "@supabase/supabase-js";

type AuthResult =
  | { user: User; supabase: SupabaseClient; error?: never }
  | { user?: never; supabase?: never; error: NextResponse };

export async function requireAuth(): Promise<AuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: NextResponse.json({ error: "認証が必要です" }, { status: 401 }) };
  }
  return { user, supabase };
}

// ============================================================
// Phase 2-E: withApiAuth — the API Route counterpart to withAuth.
// ============================================================
//
// Replaces this boilerplate at every route entry point:
//
//   const auth = await requireAuth();
//   if (auth.error) return auth.error;
//   const { user, supabase } = auth;
//   const { data: profile } = await supabase
//     .from("profiles").select("role").eq("id", user.id).single();
//   if (!profile || !isAdminOrTeacher(profile.role)) {
//     return NextResponse.json({ error: "権限がありません" }, { status: 403 });
//   }
//
// with:
//
//   export const POST = withApiAuth("admin", async (ctx, request) => { ... });
//
// `requireAuth` is kept exported so existing routes can migrate at
// their own pace; both styles are supported until the last route
// flips.

export type ApiRole = "parent" | "teacher" | "admin" | "entrance";
export type ApiGuard = ApiRole | readonly ApiRole[] | "staff" | "adminOrTeacher" | "admin";

export type ApiAuthContext = {
  user: User;
  supabase: SupabaseClient;
  role: ApiRole;
};

function passes(guard: ApiGuard, role: string): boolean {
  if (guard === "staff") return isStaff(role);
  if (guard === "adminOrTeacher") return isAdminOrTeacher(role);
  if (guard === "admin") return isAdmin(role);
  if (typeof guard === "string") return role === guard;
  return guard.includes(role as ApiRole);
}

/**
 * Wrap an API Route handler so authentication, profile lookup, and
 * role enforcement happen exactly once at the boundary.
 *
 * Returns the wrapped handler. Authorization failures short-circuit
 * with the appropriate JSON response (`401` if unauthenticated,
 * `403` if the role guard fails) before the handler runs.
 *
 * Profile lookup happens via the same Supabase client passed to the
 * handler, so RLS sees the caller's session like always.
 */
export function withApiAuth<TArgs extends unknown[]>(
  guard: ApiGuard,
  handler: (ctx: ApiAuthContext, ...args: TArgs) => Promise<NextResponse> | NextResponse,
): (...args: TArgs) => Promise<NextResponse> {
  return async (...args: TArgs) => {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const { user, supabase } = auth;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single<{ role: string }>();

    if (!profile || !passes(guard, profile.role)) {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    return handler({ user, supabase, role: profile.role as ApiRole }, ...args);
  };
}
