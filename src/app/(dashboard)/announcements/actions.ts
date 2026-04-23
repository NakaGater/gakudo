"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { isStaff } from "@/lib/auth/roles";
import { sendAnnouncementNotification } from "@/lib/notifications/send";
import { uploadAttachment } from "@/lib/attachments/actions";
import type { ActionState } from "@/lib/actions/types";
import { ERROR_MESSAGES } from "@/config/constants";

export async function createAnnouncement(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getUser();
  if (!isStaff(user.role)) {
    return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED };
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
  const { data, error } = await supabase.from("announcements")
    .insert({
      title: (title as string).trim(),
      body: (body as string).trim(),
      posted_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, message: `投稿に失敗しました: ${error.message}` };
  }

  const announcementId = data.id as string;

  // 添付ファイルのアップロード
  const files = formData.getAll("files");
  for (const file of files) {
    if (file instanceof File && file.size > 0) {
      const fd = new FormData();
      fd.set("file", file);
      await uploadAttachment("announcement", announcementId, fd);
    }
  }

  // Best-effort notification dispatch (non-blocking)
  sendAnnouncementNotification(
    "new",
    (title as string).trim(),
    (body as string).trim(),
  ).catch((err) => {
    console.error("[announcements] Notification dispatch failed:", err);
  });

  revalidatePath("/announcements");
  redirect("/announcements");
}

export async function markAsRead(announcementId: string): Promise<void> {
  const user = await getUser();
  if (user.role !== "parent") return;

  const supabase = await createClient();
  await supabase.from("announcement_reads").upsert(
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
