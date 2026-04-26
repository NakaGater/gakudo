"use server";

import { revalidatePath } from "next/cache";
import { withAuth } from "@/lib/actions/middleware";
import { sanitizeError } from "@/lib/errors/sanitize";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEnum, getString } from "@/lib/validation/form";
import type { ActionResult, ActionState } from "@/lib/actions/types";

const VALID_ROLES = ["parent", "teacher", "admin", "entrance"] as const;
type Role = (typeof VALID_ROLES)[number];

// All three actions need the service-role client (bypasses RLS to
// touch auth.users). withAuth still gates *who* can call the action;
// inside the body we deliberately switch to createAdminClient instead
// of ctx.supabase.

export const inviteUser = withAuth(
  "admin",
  async (_ctx, _prev: ActionState, formData: FormData): Promise<ActionResult> => {
    // Phase 2-D: getString / getEnum centralize the typeof + trim plumbing.
    const emailR = getString(formData, "email", { message: "メールアドレスを入力してください" });
    if (!emailR.ok) return { success: false, message: emailR.error };
    const nameR = getString(formData, "name", { message: "名前を入力してください" });
    if (!nameR.ok) return { success: false, message: nameR.error };
    const roleR = getEnum(formData, "role", VALID_ROLES, {
      message: "有効な役割を選択してください",
    });
    if (!roleR.ok) return { success: false, message: roleR.error };

    const email = emailR.value;
    const name = nameR.value;
    const role = roleR.value;

    const adminClient = createAdminClient();

    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      email,
      {
        data: { name, role },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3000"}/auth/callback?type=invite`,
      },
    );

    if (inviteError) {
      return {
        success: false,
        message: sanitizeError(inviteError, "招待に失敗しました"),
      };
    }

    const { error: profileError } = await adminClient.from("profiles").upsert({
      id: inviteData.user.id,
      email: email.trim(),
      name: name.trim(),
      role: role as Role,
    });

    if (profileError) {
      return {
        success: false,
        message: sanitizeError(profileError, "プロフィールの作成に失敗しました"),
      };
    }

    revalidatePath("/admin/users");
    return { success: true, message: "招待メールを送信しました" };
  },
);

export const updateUser = withAuth(
  "admin",
  async ({ user }, _prev: ActionState, formData: FormData): Promise<ActionResult> => {
    const targetIdR = getString(formData, "id", { message: "ユーザーIDが不正です" });
    if (!targetIdR.ok) return { success: false, message: targetIdR.error };
    const nameR = getString(formData, "name", { message: "名前を入力してください" });
    if (!nameR.ok) return { success: false, message: nameR.error };
    const roleR = getEnum(formData, "role", VALID_ROLES, {
      message: "有効な役割を選択してください",
    });
    if (!roleR.ok) return { success: false, message: roleR.error };

    const targetId = targetIdR.value;
    const name = nameR.value;
    const role = roleR.value;

    if (targetId === user.id) {
      return { success: false, message: "自分自身の役割は変更できません" };
    }

    const adminClient = createAdminClient();

    const { error: profileError } = await adminClient
      .from("profiles")
      .update({ name, role })
      .eq("id", targetId);

    if (profileError) {
      return {
        success: false,
        message: sanitizeError(profileError, "更新に失敗しました"),
      };
    }

    const { error: authError } = await adminClient.auth.admin.updateUserById(targetId, {
      user_metadata: { name, role },
    });

    if (authError) {
      return {
        success: false,
        message: sanitizeError(authError, "Auth更新に失敗しました"),
      };
    }

    revalidatePath("/admin/users");
    return { success: true, message: "ユーザー情報を更新しました" };
  },
);

export const deleteUser = withAuth(
  "admin",
  async ({ user }, _prev: ActionState, formData: FormData): Promise<ActionResult> => {
    const targetIdR = getString(formData, "id", { message: "ユーザーIDが不正です" });
    if (!targetIdR.ok) return { success: false, message: targetIdR.error };
    const targetId = targetIdR.value;

    if (targetId === user.id) {
      return { success: false, message: "自分自身は削除できません" };
    }

    const adminClient = createAdminClient();

    const { error: profileError } = await adminClient.from("profiles").delete().eq("id", targetId);

    if (profileError) {
      return {
        success: false,
        message: sanitizeError(profileError, "プロフィール削除に失敗しました"),
      };
    }

    const { error: authError } = await adminClient.auth.admin.deleteUser(targetId);

    if (authError) {
      return {
        success: false,
        message: sanitizeError(authError, "Auth削除に失敗しました"),
      };
    }

    revalidatePath("/admin/users");
    return { success: true, message: "ユーザーを削除しました" };
  },
);
