"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { uploadAttachment } from "@/lib/attachments/actions";
import { withAuth } from "@/lib/actions/middleware";
import { sanitizeError } from "@/lib/errors/sanitize";
import type { ActionResult, ActionState } from "@/lib/actions/types";
import type { Database } from "@/lib/supabase/types";

type SiteNewsInsert = Database["public"]["Tables"]["site_news"]["Insert"];

// Note: non-admin callers used to be `redirect("/")`'d here;
// withAuth replaces that with ERROR_MESSAGES.UNAUTHORIZED. The admin
// menu is already gated by (dashboard)/layout.tsx so reaching the form
// as a non-admin shouldn't happen under normal flow.
export const createNews = withAuth(
  "admin",
  async ({ user, supabase }, _prev: ActionState, formData: FormData): Promise<ActionResult> => {
    const title = formData.get("title");
    const body = formData.get("body");

    if (typeof title !== "string" || !title.trim()) {
      return { success: false, message: "タイトルを入力してください" };
    }
    if (typeof body !== "string" || !body.trim()) {
      return { success: false, message: "本文を入力してください" };
    }

    const insertData: SiteNewsInsert = {
      title: title.trim(),
      body: body.trim(),
      created_by: user.id,
    };
    const { data, error } = await supabase
      .from("site_news")
      .insert(insertData)
      .select("id")
      .single();

    if (error) {
      return { success: false, message: sanitizeError(error, "作成に失敗しました") };
    }

    const newsId = data.id as string;

    // 添付ファイルのアップロード
    const files = formData.getAll("files");
    for (const file of files) {
      if (file instanceof File && file.size > 0) {
        const fd = new FormData();
        fd.set("file", file);
        await uploadAttachment("news", newsId, fd);
      }
    }

    revalidatePath("/news");
    redirect("/admin/site/news");
  },
);

export const deleteNews = withAuth(
  "admin",
  async ({ supabase }, id: string): Promise<ActionResult> => {
    const { error } = await supabase.from("site_news").delete().eq("id", id);

    if (error) {
      return { success: false, message: sanitizeError(error, "削除に失敗しました") };
    }

    revalidatePath("/news");
    // /news/[id] is now ISR-cached; invalidate the deleted entry so its
    // public detail page returns 404 immediately instead of waiting for
    // the 1-hour lazy refresh.
    revalidatePath(`/news/${id}`);
    revalidatePath("/admin/site/news");

    return { success: true, message: "削除しました" };
  },
);
