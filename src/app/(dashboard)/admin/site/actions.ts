"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";

export type ActionState = {
  success: boolean;
  message: string;
} | null;

export async function updateSitePage(
  slug: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getUser();
  if (user.role !== "admin") redirect("/");

  const title = formData.get("title");
  const content = formData.get("content");

  if (typeof title !== "string" || !title.trim()) {
    return { success: false, message: "タイトルを入力してください" };
  }
  if (typeof content !== "string") {
    return { success: false, message: "コンテンツを入力してください" };
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("site_pages")
    .update({
      title: title.trim(),
      content,
      updated_by: user.id,
    })
    .eq("slug", slug);

  if (error) {
    return { success: false, message: `保存に失敗しました: ${error.message}` };
  }

  revalidatePath("/");
  revalidatePath(`/admin/site/pages/${slug}/edit`);

  return { success: true, message: "保存しました" };
}
