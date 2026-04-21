"use server";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { isStaff } from "@/lib/auth/roles";
import { FILE_LIMITS, ERROR_MESSAGES } from "@/config/constants";

const ALLOWED_TYPES = FILE_LIMITS.ALLOWED_DOCUMENT_TYPES;
const MAX_FILE_SIZE = FILE_LIMITS.MAX_SIZE_BYTES;

export type AttachmentRow = {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
};

/** 添付ファイルをアップロードし、attachments テーブルに記録する */
export async function uploadAttachment(
  entityType: "announcement" | "news",
  entityId: string,
  formData: FormData,
): Promise<{ success: boolean; message: string; attachment?: AttachmentRow }> {
  const user = await getUser();
  if (!isStaff(user.role)) {
    return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, message: "ファイルを選択してください" };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, message: "ファイルサイズは10MB以下にしてください" };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, message: "PDF または画像ファイルを選択してください" };
  }

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${entityType}/${entityId}/${timestamp}-${safeName}`;

  const supabase = await createClient();

  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(filePath, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return { success: false, message: `アップロード失敗: ${uploadError.message}` };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error: dbError } = await supabase.from("attachments")
    .insert({
      entity_type: entityType,
      entity_id: entityId,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      uploaded_by: user.id,
    })
    .select("id, file_name, file_path, file_size, mime_type, created_at")
    .single();

  if (dbError) {
    await supabase.storage.from("attachments").remove([filePath]);
    return { success: false, message: `保存失敗: ${dbError.message}` };
  }

  return { success: true, message: "アップロードしました", attachment: data };
}

/** 添付ファイルを削除する */
export async function deleteAttachment(
  attachmentId: string,
): Promise<{ success: boolean; message: string }> {
  const user = await getUser();
  if (!isStaff(user.role)) {
    return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED };
  }

  const supabase = await createClient();

  const { data: att, error: fetchError } = await supabase
    .from("attachments")
    .select("id, file_path")
    .eq("id", attachmentId)
    .single();

  if (fetchError || !att) {
    return { success: false, message: "添付ファイルが見つかりません" };
  }

  await supabase.storage.from("attachments").remove([att.file_path]);
  await supabase.from("attachments").delete().eq("id", attachmentId);

  return { success: true, message: "削除しました" };
}

/** エンティティの添付ファイル一覧を取得する */
export async function getAttachments(
  entityType: "announcement" | "news",
  entityId: string,
): Promise<AttachmentRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("attachments")
    .select("id, file_name, file_path, file_size, mime_type, created_at")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: true });

  return (data as AttachmentRow[]) ?? [];
}

/** 添付ファイルの署名付きURLを取得する */
export async function getAttachmentUrl(filePath: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("attachments")
    .createSignedUrl(filePath, 3600); // 1時間有効

  return data?.signedUrl ?? null;
}
