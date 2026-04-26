"use server";

import { revalidatePath } from "next/cache";
import { withAuth } from "@/lib/actions/middleware";
import { sanitizeError } from "@/lib/errors/sanitize";
import { getString } from "@/lib/validation/form";
import type { ActionResult, ActionState } from "@/lib/actions/types";

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
