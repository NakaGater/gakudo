"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  buildRecipientRows,
  parseRecipientsFromFormData,
  type ParsedRecipients,
} from "@/lib/announcements/recipients";
import { uploadAttachment } from "@/lib/attachments/actions";
import { withAuth } from "@/lib/actions/middleware";
import { getUser } from "@/lib/auth/get-user";
import { sanitizeError } from "@/lib/errors/sanitize";
import { sendAnnouncementNotification } from "@/lib/notifications/send";
import { createClient } from "@/lib/supabase/server";
import { getString } from "@/lib/validation/form";
import type { ActionResult, ActionState } from "@/lib/actions/types";

export const createAnnouncement = withAuth(
  ["admin", "teacher", "entrance"],
  async ({ user, supabase }, _prev: ActionState, formData: FormData): Promise<ActionResult> => {
    const fieldErrors: { title?: string; body?: string; recipients?: string } = {};

    // Phase 2-D: getString handles required + max-length in one call.
    const titleR = getString(formData, "title", { max: 200 });
    let title = "";
    if (!titleR.ok) {
      fieldErrors.title = titleR.error.includes("以内")
        ? "タイトルは200文字以内で入力してください"
        : "タイトルを入力してください";
    } else {
      title = titleR.value;
    }

    const bodyR = getString(formData, "body", { message: "本文を入力してください" });
    let body = "";
    if (!bodyR.ok) {
      fieldErrors.body = bodyR.error;
    } else {
      body = bodyR.value;
    }

    const recipientsResult = parseRecipientsFromFormData(formData);
    let recipients: ParsedRecipients | null = null;
    if (!recipientsResult.ok) {
      fieldErrors.recipients = recipientsResult.message;
    } else {
      recipients = recipientsResult.value;
    }

    if (fieldErrors.title || fieldErrors.body || fieldErrors.recipients || !recipients) {
      return { success: false, message: "入力内容を確認してください", fieldErrors };
    }

    const { data, error } = await supabase
      .from("announcements")
      .insert({
        title,
        body,
        posted_by: user.id,
      })
      .select("id")
      .single();

    if (error) {
      return { success: false, message: sanitizeError(error, "投稿に失敗しました") };
    }

    const announcementId = data.id as string;

    // 送信対象を保存（all / grade / user の混在可）
    const recipientRows = buildRecipientRows(announcementId, recipients);
    const { error: recipientsError } = await supabase
      .from("announcement_recipients")
      .insert(recipientRows);
    if (recipientsError) {
      // 送信対象が保存できないと閲覧不可になるためロールバック相当でお知らせも消す
      await supabase.from("announcements").delete().eq("id", announcementId);
      return {
        success: false,
        message: sanitizeError(recipientsError, "送信対象の保存に失敗しました"),
      };
    }

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
    sendAnnouncementNotification(announcementId, title, body).catch((err) => {
      console.error("[announcements] Notification dispatch failed:", err);
    });

    revalidatePath("/announcements");
    redirect("/announcements");
  },
);

// markAsRead returns Promise<void> with a parent-only silent reject,
// which doesn't fit the ActionResult-based withAuth contract. Kept on
// raw getUser().
export async function markAsRead(announcementId: string): Promise<void> {
  const user = await getUser();
  if (user.role !== "parent") return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("announcement_reads")
    .upsert(
      { announcement_id: announcementId, user_id: user.id },
      { onConflict: "announcement_id,user_id", ignoreDuplicates: true },
    );
  if (error) {
    console.error("[announcements] markAsRead failed:", error);
    return;
  }

  // "layout" scope is required so the unread badge counter rendered in
  // (dashboard)/layout.tsx via getBadgeCounts is recomputed. Phase 3
  // will switch to revalidateTag("badge:unread") so we only invalidate
  // the badge query rather than every page under /announcements.
  revalidatePath("/announcements", "layout");
  revalidatePath(`/announcements/${announcementId}`);
}

// Read-only: caller is the announcement detail page (any signed-in
// user can read). withAuth doesn't fit a number-returning function.
export async function getReadCount(announcementId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("announcement_reads")
    .select("*", { count: "exact", head: true })
    .eq("announcement_id", announcementId);

  return count ?? 0;
}
