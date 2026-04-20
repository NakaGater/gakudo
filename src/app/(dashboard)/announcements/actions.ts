"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";

export type ActionState = {
  success: boolean;
  message: string;
  fieldErrors?: { title?: string; body?: string };
} | null;

function isStaff(role: string): boolean {
  return role === "admin" || role === "teacher";
}

export async function createAnnouncement(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getUser();
  if (!isStaff(user.role)) {
    return { success: false, message: "権限がありません" };
  }

  const title = formData.get("title");
  const body = formData.get("body");

  const fieldErrors: { title?: string; body?: string } = {};

  if (typeof title !== "string" || !title.trim()) {
    fieldErrors.title = "タイトルを入力してください";
  } else if (title.trim().length > 200) {
    fieldErrors.title = "タイトルは200文字以内で入力してください";
  }

  if (typeof body !== "string" || !body.trim()) {
    fieldErrors.body = "本文を入力してください";
  }

  if (fieldErrors.title || fieldErrors.body) {
    return { success: false, message: "入力内容を確認してください", fieldErrors };
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("announcements") as any).insert({
    title: (title as string).trim(),
    body: (body as string).trim(),
    posted_by: user.id,
  });

  if (error) {
    return { success: false, message: `投稿に失敗しました: ${error.message}` };
  }

  revalidatePath("/announcements");
  redirect("/announcements");
}

export async function markAsRead(announcementId: string): Promise<void> {
  const user = await getUser();
  if (user.role !== "parent") return;

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("announcement_reads") as any).upsert(
    { announcement_id: announcementId, user_id: user.id },
    { onConflict: "announcement_id,user_id", ignoreDuplicates: true },
  );

  revalidatePath("/announcements");
  revalidatePath(`/announcements/${announcementId}`);
}

export async function getReadCount(announcementId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("announcement_reads")
    .select("*", { count: "exact", head: true })
    .eq("announcement_id", announcementId);

  return count ?? 0;
}
