"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { withAuth } from "@/lib/actions/middleware";
import { sanitizeError } from "@/lib/errors/sanitize";
import { createClient } from "@/lib/supabase/server";
import { getString } from "@/lib/validation/form";
import type { ActionResult, ActionState } from "@/lib/actions/types";

/**
 * Sign out as a Server Action.
 *
 * We cannot do this on the client: `createBrowserClient.auth.signOut()`
 * cannot reliably delete the server-managed auth cookies. A follow-up
 * `window.location.href = "/"` then frequently redirects right back
 * into the dashboard via the middleware in `lib/supabase/middleware.ts`
 * — the "logout button does nothing" symptom.
 *
 * Running signOut() on the server guarantees the response that
 * processes it also writes the cookie deletion headers; the redirect
 * then runs the next request without any session.
 *
 * Lands on "/" (the public homepage). The middleware only redirects
 * *authenticated* visitors away from "/" — once cookies are cleared
 * the user sees the public site and can re-enter via the login link.
 *
 * `redirect()` from next/navigation throws internally; that's expected
 * — Server Actions catch the throw and return a 303 to /.
 */
export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

// Phase 2-C: first action migrated to withAuth as a worked example.
// Any signed-in user can edit their own profile, so the guard accepts
// every role (the action does not allow targeting a different user;
// the .eq("id", user.id) below enforces self-only edits).
export const updateProfile = withAuth(
  ["parent", "teacher", "admin", "entrance"],
  async ({ user, supabase }, _prev: ActionState, formData: FormData): Promise<ActionResult> => {
    // Phase 2-D: required vs >50 must yield different messages, and
    // getString's `message` would override both. Use it without max,
    // then check length separately.
    const nameR = getString(formData, "name", { message: "名前を入力してください" });
    if (!nameR.ok) return { success: false, message: nameR.error };
    if (nameR.value.length > 50) {
      return { success: false, message: "名前は50文字以内で入力してください" };
    }
    const name = nameR.value;

    const { error } = await supabase.from("profiles").update({ name }).eq("id", user.id);

    if (error) {
      return { success: false, message: sanitizeError(error, "保存に失敗しました") };
    }

    revalidatePath("/profile");
    return { success: true, message: "保存しました" };
  },
);
