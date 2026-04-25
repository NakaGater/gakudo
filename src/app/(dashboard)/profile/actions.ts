"use server";

import { revalidatePath } from "next/cache";
import { withAuth } from "@/lib/actions/middleware";
import { sanitizeError } from "@/lib/errors/sanitize";
import type { ActionResult, ActionState } from "@/lib/actions/types";

// Phase 2-C: first action migrated to withAuth as a worked example.
// Any signed-in user can edit their own profile, so the guard accepts
// every role (the action does not allow targeting a different user;
// the .eq("id", user.id) below enforces self-only edits).
export const updateProfile = withAuth(
  ["parent", "teacher", "admin", "entrance"],
  async ({ user, supabase }, _prev: ActionState, formData: FormData): Promise<ActionResult> => {
    const name = formData.get("name");
    if (typeof name !== "string" || !name.trim()) {
      return { success: false, message: "名前を入力してください" };
    }

    if (name.trim().length > 50) {
      return { success: false, message: "名前は50文字以内で入力してください" };
    }

    const { error } = await supabase
      .from("profiles")
      .update({ name: name.trim() })
      .eq("id", user.id);

    if (error) {
      return { success: false, message: sanitizeError(error, "保存に失敗しました") };
    }

    revalidatePath("/profile");
    return { success: true, message: "保存しました" };
  },
);
