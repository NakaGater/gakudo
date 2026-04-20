"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 8);

export type ActionState = {
  success: boolean;
  message: string;
  childId?: string;
} | null;

function isStaff(role: string): boolean {
  return role === "admin" || role === "teacher";
}

type ValidationOk = { ok: true; name: string; grade: number };
type ValidationErr = { ok: false; error: NonNullable<ActionState> };
type ValidationResult = ValidationOk | ValidationErr;

function validateChildForm(formData: FormData): ValidationResult {
  const name = formData.get("name");
  const gradeStr = formData.get("grade");

  if (typeof name !== "string" || !name.trim()) {
    return { ok: false, error: { success: false, message: "名前を入力してください" } };
  }

  const grade = Number(gradeStr);
  if (!Number.isInteger(grade) || grade < 1 || grade > 6) {
    return { ok: false, error: { success: false, message: "学年は1〜6を選択してください" } };
  }

  return { ok: true, name: name.trim(), grade };
}

export async function createChild(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getUser();
  if (!isStaff(user.role)) {
    return { success: false, message: "権限がありません" };
  }

  const validated = validateChildForm(formData);
  if (!validated.ok) return validated.error;

  const qrCode = `GK-${nanoid()}`;

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("children") as any)
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
): Promise<ActionState> {
  const user = await getUser();
  if (!isStaff(user.role)) {
    return { success: false, message: "権限がありません" };
  }

  const validated = validateChildForm(formData);
  if (!validated.ok) return validated.error;

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("children") as any)
    .update({ name: validated.name, grade: validated.grade })
    .eq("id", id);

  if (error) {
    return { success: false, message: `更新に失敗しました: ${error.message}` };
  }

  revalidatePath("/children");
  revalidatePath(`/children/${id}`);
  return { success: true, message: "更新しました" };
}

export async function regenerateQR(childId: string): Promise<ActionState> {
  const user = await getUser();
  if (user.role !== "admin") {
    return { success: false, message: "管理者権限が必要です" };
  }

  const newQR = `GK-${nanoid()}`;

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("children") as any)
    .update({ qr_code: newQR, qr_active: true })
    .eq("id", childId);

  if (error) {
    return { success: false, message: `再発行に失敗しました: ${error.message}` };
  }

  revalidatePath(`/children/${childId}`);
  revalidatePath(`/children/${childId}/qr`);
  return { success: true, message: "QRコードを再発行しました" };
}

export async function deleteChild(id: string): Promise<ActionState> {
  const user = await getUser();
  if (user.role !== "admin") {
    return { success: false, message: "管理者権限が必要です" };
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("children") as any)
    .delete()
    .eq("id", id);

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

export async function searchParents(
  query: string,
): Promise<ParentSearchResult[]> {
  const user = await getUser();
  if (!isStaff(user.role)) return [];

  if (!query.trim()) return [];

  const supabase = await createClient();
  const pattern = `%${query.trim()}%`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("profiles") as any)
    .select("id, name, email")
    .eq("role", "parent")
    .or(`name.ilike.${pattern},email.ilike.${pattern}`)
    .limit(10);

  if (error) return [];
  return (data ?? []) as ParentSearchResult[];
}

export async function linkParent(
  childId: string,
  parentId: string,
): Promise<ActionState> {
  const user = await getUser();
  if (!isStaff(user.role)) {
    return { success: false, message: "権限がありません" };
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("child_parents") as any)
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

export async function unlinkParent(
  childId: string,
  parentId: string,
): Promise<ActionState> {
  const user = await getUser();
  if (!isStaff(user.role)) {
    return { success: false, message: "権限がありません" };
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("child_parents") as any)
    .delete()
    .eq("child_id", childId)
    .eq("parent_id", parentId);

  if (error) {
    return { success: false, message: `解除に失敗しました: ${error.message}` };
  }

  revalidatePath(`/children/${childId}`);
  return { success: true, message: "解除しました" };
}
