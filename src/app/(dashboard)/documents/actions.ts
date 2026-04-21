"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { isStaff } from "@/lib/auth/roles";
import type { ActionState } from "@/lib/actions/types";
import { FILE_LIMITS, ERROR_MESSAGES } from "@/config/constants";

export type { ActionState };

const ALLOWED_TYPES = FILE_LIMITS.ALLOWED_DOCUMENT_TYPES;

const MAX_FILE_SIZE = FILE_LIMITS.MAX_SIZE_BYTES;

export async function uploadDocument(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getUser();
  if (!isStaff(user.role)) {
    return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED };
  }

  const title = formData.get("title");
  const category = formData.get("category");
  const file = formData.get("file");

  const fieldErrors: { title?: string; category?: string; file?: string } = {};

  if (typeof title !== "string" || !title.trim()) {
    fieldErrors.title = "タイトルを入力してください";
  }

  const validCategories = ["お便り", "スケジュール", "書類", "その他"];
  if (typeof category !== "string" || !validCategories.includes(category)) {
    fieldErrors.category = "カテゴリを選択してください";
  }

  if (!(file instanceof File) || file.size === 0) {
    fieldErrors.file = "ファイルを選択してください";
  } else if (file.size > MAX_FILE_SIZE) {
    fieldErrors.file = "ファイルサイズは10MB以下にしてください";
  } else if (!ALLOWED_TYPES.includes(file.type)) {
    fieldErrors.file = "PDF または画像ファイルを選択してください";
  }

  if (fieldErrors.title || fieldErrors.category || fieldErrors.file) {
    return {
      success: false,
      message: "入力内容を確認してください",
      fieldErrors,
    };
  }

  const validFile = file as File;
  const timestamp = Date.now();
  const safeName = validFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${user.id}/${timestamp}-${safeName}`;

  const supabase = await createClient();

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(filePath, validFile, {
      contentType: validFile.type,
      upsert: false,
    });

  if (uploadError) {
    return {
      success: false,
      message: `アップロードに失敗しました: ${uploadError.message}`,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: dbError } = await supabase.from("documents").insert({
    title: (title as string).trim(),
    category: category as string,
    file_path: filePath,
    uploaded_by: user.id,
  });

  if (dbError) {
    // Clean up uploaded file on DB error
    await supabase.storage.from("documents").remove([filePath]);
    return {
      success: false,
      message: `保存に失敗しました: ${dbError.message}`,
    };
  }

  revalidatePath("/documents");
  return { success: true, message: "資料をアップロードしました" };
}

export async function deleteDocument(
  id: string,
): Promise<ActionState> {
  const user = await getUser();
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: doc, error: fetchError } = await supabase
    .from("documents")
    .select("id, file_path, uploaded_by")
    .eq("id", id)
    .single();

  if (fetchError || !doc) {
    return { success: false, message: "資料が見つかりません" };
  }

  // Only admin or the uploader can delete
  if (user.role !== "admin" && doc.uploaded_by !== user.id) {
    return { success: false, message: "削除権限がありません" };
  }

  const { error: storageError } = await supabase.storage
    .from("documents")
    .remove([doc.file_path]);

  if (storageError) {
    return {
      success: false,
      message: `ファイル削除に失敗しました: ${storageError.message}`,
    };
  }

  const { error: dbError } = await supabase
    .from("documents")
    .delete()
    .eq("id", id);

  if (dbError) {
    return {
      success: false,
      message: `削除に失敗しました: ${dbError.message}`,
    };
  }

  revalidatePath("/documents");
  return { success: true, message: "資料を削除しました" };
}
