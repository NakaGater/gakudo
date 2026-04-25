"use server";

import { revalidatePath } from "next/cache";
import { FILE_LIMITS } from "@/config/constants";
import { withAuth } from "@/lib/actions/middleware";
import { sanitizeError } from "@/lib/errors/sanitize";
import { validateFile, validateFileMagicBytes, validateFileType } from "@/lib/files/validation";
import type { ActionResult, ActionState } from "@/lib/actions/types";

const ALLOWED_TYPES = FILE_LIMITS.ALLOWED_DOCUMENT_TYPES;

export const uploadDocument = withAuth(
  ["admin", "teacher", "entrance"],
  async ({ user, supabase }, _prev: ActionState, formData: FormData): Promise<ActionResult> => {
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
    } else {
      const fileVal = validateFile(file);
      if (!fileVal.valid) {
        fieldErrors.file = fileVal.message;
      } else {
        const typeVal = validateFileType(
          file,
          ALLOWED_TYPES,
          "PDF または画像ファイルを選択してください",
        );
        if (!typeVal.valid) {
          fieldErrors.file = typeVal.message;
        } else {
          // Defense-in-depth: file.type comes from the browser. Verify
          // the bytes actually match before accepting the upload.
          const magicVal = await validateFileMagicBytes(
            file,
            ALLOWED_TYPES,
            "ファイルの内容が宣言された形式と一致しません",
          );
          if (!magicVal.valid) {
            fieldErrors.file = magicVal.message;
          }
        }
      }
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

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, validFile, {
        contentType: validFile.type,
        upsert: false,
      });

    if (uploadError) {
      return {
        success: false,
        message: sanitizeError(uploadError, "アップロードに失敗しました"),
      };
    }

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
        message: sanitizeError(dbError, "保存に失敗しました"),
      };
    }

    revalidatePath("/documents");
    return { success: true, message: "資料をアップロードしました" };
  },
);

// Any authenticated user reaches the body; the admin-OR-uploader check
// below decides actual permission. withAuth's allow-all guard keeps
// the boilerplate consistent and routes the rejection through the
// same "permission" message.
export const deleteDocument = withAuth(
  ["parent", "teacher", "admin", "entrance"],
  async ({ user, supabase }, id: string): Promise<ActionResult> => {
    const { data: doc, error: fetchError } = await supabase
      .from("documents")
      .select("id, file_path, uploaded_by")
      .eq("id", id)
      .single();

    if (fetchError || !doc) {
      return { success: false, message: "資料が見つかりません" };
    }

    if (user.role !== "admin" && doc.uploaded_by !== user.id) {
      return { success: false, message: "削除権限がありません" };
    }

    const { error: storageError } = await supabase.storage
      .from("documents")
      .remove([doc.file_path]);

    if (storageError) {
      return {
        success: false,
        message: sanitizeError(storageError, "ファイル削除に失敗しました"),
      };
    }

    const { error: dbError } = await supabase.from("documents").delete().eq("id", id);

    if (dbError) {
      return {
        success: false,
        message: sanitizeError(dbError, "削除に失敗しました"),
      };
    }

    revalidatePath("/documents");
    return { success: true, message: "資料を削除しました" };
  },
);
