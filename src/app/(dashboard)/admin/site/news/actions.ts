"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { uploadAttachment } from "@/lib/attachments/actions";
import { getUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, ActionState } from "@/lib/actions/types";
import type { Database } from "@/lib/supabase/types";

type SiteNewsInsert = Database["public"]["Tables"]["site_news"]["Insert"];

export async function createNews(_prev: ActionState, formData: FormData): Promise<ActionResult> {
  const user = await getUser();
  if (user.role !== "admin") redirect("/");

  const title = formData.get("title");
  const body = formData.get("body");

  if (typeof title !== "string" || !title.trim()) {
    return { success: false, message: "タイトルを入力してください" };
  }
  if (typeof body !== "string" || !body.trim()) {
    return { success: false, message: "本文を入力してください" };
  }

  const supabase = await createClient();
  const insertData: SiteNewsInsert = {
    title: title.trim(),
    body: body.trim(),
    created_by: user.id,
  };
  const { data, error } = await supabase.from("site_news").insert(insertData).select("id").single();

  if (error) {
    return { success: false, message: `作成に失敗しました: ${error.message}` };
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
}

export async function deleteNews(id: string): Promise<ActionResult> {
  const user = await getUser();
  if (user.role !== "admin") redirect("/");

  const supabase = await createClient();
  const { error } = await supabase.from("site_news").delete().eq("id", id);

  if (error) {
    return { success: false, message: `削除に失敗しました: ${error.message}` };
  }

  revalidatePath("/news");
  // /news/[id] is now ISR-cached; invalidate the deleted entry so its
  // public detail page returns 404 immediately instead of waiting for
  // the 1-hour lazy refresh.
  revalidatePath(`/news/${id}`);
  revalidatePath("/admin/site/news");

  return { success: true, message: "削除しました" };
}
