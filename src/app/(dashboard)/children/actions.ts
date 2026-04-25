"use server";

import { customAlphabet } from "nanoid";
import { revalidatePath } from "next/cache";
import { QR_CODE, ERROR_MESSAGES } from "@/config/constants";
import { getUser } from "@/lib/auth/get-user";
import { isStaff } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { validateChildForm } from "./actions.helpers";
import type { ActionResult, ActionState } from "./types";

const nanoid = customAlphabet(QR_CODE.ALPHABET, QR_CODE.LENGTH);

export async function createChild(_prev: ActionState, formData: FormData): Promise<ActionResult> {
  const user = await getUser();
  if (!isStaff(user.role)) {
    return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED };
  }

  const validated = validateChildForm(formData);
  if (!validated.ok) return validated.error;

  const qrCode = `GK-${nanoid()}`;

  const supabase = await createClient();
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
    return { success: false, message: `登録に失敗しました: ${error.message}` };
  }

  revalidatePath("/children");
  return { success: true, message: "登録しました", childId: data.id };
}

export async function updateChild(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getUser();
  if (!isStaff(user.role)) {
    return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED };
  }

  const validated = validateChildForm(formData);
  if (!validated.ok) return validated.error;

  const supabase = await createClient();
  const { error } = await supabase
    .from("children")
    .update({ name: validated.name, grade: validated.grade })
    .eq("id", id);

  if (error) {
    return { success: false, message: `更新に失敗しました: ${error.message}` };
  }

  revalidatePath("/children");
  revalidatePath(`/children/${id}`);
  return { success: true, message: "更新しました" };
}

export async function regenerateQR(childId: string): Promise<ActionResult> {
  const user = await getUser();
  if (user.role !== "admin") {
    return { success: false, message: "管理者権限が必要です" };
  }

  const newQR = `GK-${nanoid()}`;

  const supabase = await createClient();
  const { error } = await supabase
    .from("children")
    .update({ qr_code: newQR, qr_active: true })
    .eq("id", childId);

  if (error) {
    return { success: false, message: `再発行に失敗しました: ${error.message}` };
  }

  revalidatePath(`/children/${childId}`);
  revalidatePath(`/children/${childId}/qr`);
  return { success: true, message: "QRコードを再発行しました" };
}

export async function deleteChild(id: string): Promise<ActionResult> {
  const user = await getUser();
  if (user.role !== "admin") {
    return { success: false, message: "管理者権限が必要です" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("children").delete().eq("id", id);

  if (error) {
    return { success: false, message: `削除に失敗しました: ${error.message}` };
  }

  revalidatePath("/children");
  return { success: true, message: "削除しました" };
}

export type ParentSearchResult = {
  id: string;
  name: string;
  email: string;
};

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

export async function linkParent(childId: string, parentId: string): Promise<ActionResult> {
  const user = await getUser();
  if (!isStaff(user.role)) {
    return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("child_parents")
    .upsert(
      { child_id: childId, parent_id: parentId },
      { onConflict: "child_id,parent_id", ignoreDuplicates: true },
    );

  if (error) {
    return { success: false, message: `紐付けに失敗しました: ${error.message}` };
  }

  revalidatePath(`/children/${childId}`);
  return { success: true, message: "紐付けました" };
}

export async function unlinkParent(childId: string, parentId: string): Promise<ActionResult> {
  const user = await getUser();
  if (!isStaff(user.role)) {
    return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("child_parents")
    .delete()
    .eq("child_id", childId)
    .eq("parent_id", parentId);

  if (error) {
    return { success: false, message: `解除に失敗しました: ${error.message}` };
  }

  revalidatePath(`/children/${childId}`);
  return { success: true, message: "解除しました" };
}
