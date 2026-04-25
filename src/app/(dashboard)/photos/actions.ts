"use server";

import { revalidatePath } from "next/cache";
import { ERROR_MESSAGES } from "@/config/constants";
import { getUser } from "@/lib/auth/get-user";
import { isStaff } from "@/lib/auth/roles";
import { validateFileMagicBytes } from "@/lib/files/validation";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/actions/types";

const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;

export async function uploadPhoto(formData: FormData): Promise<ActionResult> {
  const user = await getUser();
  if (!isStaff(user.role)) {
    return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED };
  }

  const files = formData.getAll("files") as File[];
  const eventName = (formData.get("event_name") as string)?.trim() || null;
  const caption = (formData.get("caption") as string)?.trim() || null;
  const visibility =
    user.role === "admin" && formData.get("visibility") === "public" ? "public" : "private";

  if (files.length === 0 || !files[0]?.size) {
    return { success: false, message: "ファイルを選択してください" };
  }

  const supabase = await createClient();
  const errors: string[] = [];

  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      errors.push(`${file.name}: 画像ファイルのみアップロードできます`);
      continue;
    }

    // Defense-in-depth: file.type is browser-supplied. Verify the
    // bytes match before uploading to storage.
    const magicVal = await validateFileMagicBytes(
      file,
      ALLOWED_PHOTO_TYPES,
      "ファイルの内容が画像形式と一致しません",
    );
    if (!magicVal.valid) {
      errors.push(`${file.name}: ${magicVal.message}`);
      continue;
    }

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${user.id}/${timestamp}-${safeName}`;

    const { error: uploadError } = await supabase.storage.from("photos").upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

    if (uploadError) {
      errors.push(`${file.name}: ${uploadError.message}`);
      continue;
    }

    const { error: insertError } = await supabase.from("photos").insert({
      storage_path: storagePath,
      caption,
      event_name: eventName,
      visibility,
      uploaded_by: user.id,
    });

    if (insertError) {
      // Clean up uploaded file on DB insert failure
      await supabase.storage.from("photos").remove([storagePath]);
      errors.push(`${file.name}: ${insertError.message}`);
    }
  }

  revalidatePath("/photos");

  if (errors.length > 0) {
    return {
      success: false,
      message: `一部アップロードに失敗しました:\n${errors.join("\n")}`,
    };
  }

  return { success: true, message: "アップロードしました" };
}

export async function setPhotoVisibility(
  id: string,
  visibility: "public" | "private",
): Promise<ActionResult> {
  const user = await getUser();
  if (user.role !== "admin") {
    return { success: false, message: "管理者権限が必要です" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("photos").update({ visibility }).eq("id", id);

  if (error) {
    return { success: false, message: `更新に失敗しました: ${error.message}` };
  }

  revalidatePath("/photos");
  return { success: true, message: "更新しました" };
}

export async function deletePhoto(id: string): Promise<ActionResult> {
  const user = await getUser();
  if (!isStaff(user.role)) {
    return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED };
  }

  const supabase = await createClient();

  // Fetch storage_path first
  const { data: photo, error: fetchError } = await supabase
    .from("photos")
    .select("storage_path, uploaded_by")
    .eq("id", id)
    .single();

  if (fetchError || !photo) {
    return { success: false, message: "写真が見つかりません" };
  }

  // Only admin or uploader can delete
  if (user.role !== "admin" && photo.uploaded_by !== user.id) {
    return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED };
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from("photos")
    .remove([photo.storage_path]);

  if (storageError) {
    return {
      success: false,
      message: `ストレージ削除に失敗しました: ${storageError.message}`,
    };
  }

  // Delete from DB
  const { error: dbError } = await supabase.from("photos").delete().eq("id", id);

  if (dbError) {
    return { success: false, message: `削除に失敗しました: ${dbError.message}` };
  }

  revalidatePath("/photos");
  return { success: true, message: "削除しました" };
}
