"use server";

import { customAlphabet } from "nanoid";
import { revalidatePath } from "next/cache";
import { QR_CODE } from "@/config/constants";
import { withAuth } from "@/lib/actions/middleware";
import { getUser } from "@/lib/auth/get-user";
import { isStaff } from "@/lib/auth/roles";
import { sanitizeError } from "@/lib/errors/sanitize";
import { createClient } from "@/lib/supabase/server";
import { validateChildForm } from "./actions.helpers";
import type { ActionResult, ActionState } from "./types";

const nanoid = customAlphabet(QR_CODE.ALPHABET, QR_CODE.LENGTH);

export const createChild = withAuth(
  ["admin", "teacher", "entrance"],
  async ({ supabase }, _prev: ActionState, formData: FormData): Promise<ActionResult> => {
    const validated = validateChildForm(formData);
    if (!validated.ok) return validated.error;

    const qrCode = `GK-${nanoid()}`;

    const { data, error } = await supabase
      .from("children")
      .insert({
        name: validated.name,
        grade: validated.grade,
        qr_code: qrCode,
      })
      .select("id")
      .single();

    if (error) {
      return { success: false, message: sanitizeError(error, "登録に失敗しました") };
    }

    revalidatePath("/children");
    return { success: true, message: "登録しました", childId: data.id };
  },
);

export const updateChild = withAuth(
  ["admin", "teacher", "entrance"],
  async (
    { supabase },
    id: string,
    _prev: ActionState,
    formData: FormData,
  ): Promise<ActionResult> => {
    const validated = validateChildForm(formData);
    if (!validated.ok) return validated.error;

    const { error } = await supabase
      .from("children")
      .update({ name: validated.name, grade: validated.grade })
      .eq("id", id);

    if (error) {
      return { success: false, message: sanitizeError(error, "更新に失敗しました") };
    }

    revalidatePath("/children");
    revalidatePath(`/children/${id}`);
    return { success: true, message: "更新しました" };
  },
);

export const regenerateQR = withAuth(
  "admin",
  async ({ supabase }, childId: string): Promise<ActionResult> => {
    const newQR = `GK-${nanoid()}`;

    const { error } = await supabase
      .from("children")
      .update({ qr_code: newQR, qr_active: true })
      .eq("id", childId);

    if (error) {
      return { success: false, message: sanitizeError(error, "再発行に失敗しました") };
    }

    revalidatePath(`/children/${childId}`);
    revalidatePath(`/children/${childId}/qr`);
    return { success: true, message: "QRコードを再発行しました" };
  },
);

export const deleteChild = withAuth(
  "admin",
  async ({ supabase }, id: string): Promise<ActionResult> => {
    const { error } = await supabase.from("children").delete().eq("id", id);

    if (error) {
      return { success: false, message: sanitizeError(error, "削除に失敗しました") };
    }

    revalidatePath("/children");
    return { success: true, message: "削除しました" };
  },
);

export type ParentSearchResult = {
  id: string;
  name: string;
  email: string;
};

// Read-only: returns [] on auth failure rather than ActionResult, so
// the withAuth wrapper doesn't fit. Kept on raw getUser().
export async function searchParents(query: string): Promise<ParentSearchResult[]> {
  const user = await getUser();
  if (!isStaff(user.role)) return [];

  if (!query.trim()) return [];

  const supabase = await createClient();
  const pattern = `%${query.trim()}%`;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email")
    .eq("role", "parent")
    .or(`name.ilike.${pattern},email.ilike.${pattern}`)
    .limit(10);

  if (error) return [];
  return (data ?? []) as ParentSearchResult[];
}

export const linkParent = withAuth(
  ["admin", "teacher", "entrance"],
  async ({ supabase }, childId: string, parentId: string): Promise<ActionResult> => {
    const { error } = await supabase
      .from("child_parents")
      .upsert(
        { child_id: childId, parent_id: parentId },
        { onConflict: "child_id,parent_id", ignoreDuplicates: true },
      );

    if (error) {
      return { success: false, message: sanitizeError(error, "紐付けに失敗しました") };
    }

    revalidatePath(`/children/${childId}`);
    return { success: true, message: "紐付けました" };
  },
);

export const unlinkParent = withAuth(
  ["admin", "teacher", "entrance"],
  async ({ supabase }, childId: string, parentId: string): Promise<ActionResult> => {
    const { error } = await supabase
      .from("child_parents")
      .delete()
      .eq("child_id", childId)
      .eq("parent_id", parentId);

    if (error) {
      return { success: false, message: sanitizeError(error, "解除に失敗しました") };
    }

    revalidatePath(`/children/${childId}`);
    return { success: true, message: "解除しました" };
  },
);
