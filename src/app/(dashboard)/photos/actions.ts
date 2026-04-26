"use server";

import { revalidatePath } from "next/cache";
import { withAuth } from "@/lib/actions/middleware";
import { sanitizeError } from "@/lib/errors/sanitize";
import { validateFileMagicBytes } from "@/lib/files/validation";
import type { ActionResult } from "@/lib/actions/types";

const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;

export const uploadPhoto = withAuth(
  ["admin", "teacher", "entrance"],
  async ({ user, supabase }, formData: FormData): Promise<ActionResult> => {
    const files = formData.getAll("files") as File[];
    const eventName = (formData.get("event_name") as string)?.trim() || null;
    const caption = (formData.get("caption") as string)?.trim() || null;
    const visibility =
      user.role === "admin" && formData.get("visibility") === "public" ? "public" : "private";

    if (files.length === 0 || !files[0]?.size) {
      return { success: false, message: "ファイルを選択してください" };
    }

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

      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        errors.push(`${file.name}: ${sanitizeError(uploadError, "アップロードに失敗しました")}`);
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
        errors.push(`${file.name}: ${sanitizeError(insertError, "保存に失敗しました")}`);
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
  },
);

export const setPhotoVisibility = withAuth(
  "admin",
  async ({ supabase }, id: string, visibility: "public" | "private"): Promise<ActionResult> => {
    const { error } = await supabase.from("photos").update({ visibility }).eq("id", id);

    if (error) {
      return { success: false, message: sanitizeError(error, "更新に失敗しました") };
    }

    revalidatePath("/photos");
    return { success: true, message: "更新しました" };
  },
);

// Staff (admin/teacher/entrance) reach the body. The admin-OR-uploader
// rule is enforced inside before any storage / DB mutation runs.
export const deletePhoto = withAuth(
  ["admin", "teacher", "entrance"],
  async ({ user, supabase }, id: string): Promise<ActionResult> => {
    const { data: photo, error: fetchError } = await supabase
      .from("photos")
      .select("storage_path, uploaded_by")
      .eq("id", id)
      .single();

    if (fetchError || !photo) {
      return { success: false, message: "写真が見つかりません" };
    }

    if (user.role !== "admin" && photo.uploaded_by !== user.id) {
      return { success: false, message: "削除権限がありません" };
    }

    const { error: storageError } = await supabase.storage
      .from("photos")
      .remove([photo.storage_path]);

    if (storageError) {
      return {
        success: false,
        message: sanitizeError(storageError, "ストレージ削除に失敗しました"),
      };
    }

    const { error: dbError } = await supabase.from("photos").delete().eq("id", id);

    if (dbError) {
      return { success: false, message: sanitizeError(dbError, "削除に失敗しました") };
    }

    revalidatePath("/photos");
    return { success: true, message: "削除しました" };
  },
);
