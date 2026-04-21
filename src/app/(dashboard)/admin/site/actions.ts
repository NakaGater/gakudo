"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import type { Database, Json } from "@/lib/supabase/types";
import type { ActionState } from "@/lib/actions/types";

export type { ActionState };

type SitePageUpdate = Database["public"]["Tables"]["site_pages"]["Update"];

export async function updateSitePage(
  slug: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getUser();
  if (user.role !== "admin") redirect("/");

  const title = formData.get("title");
  const content = formData.get("content");
  const metadataRaw = formData.get("metadata");

  if (typeof title !== "string" || !title.trim()) {
    return { success: false, message: "タイトルを入力してください" };
  }
  if (typeof content !== "string") {
    return { success: false, message: "コンテンツを入力してください" };
  }

  let metadata: Record<string, unknown> = {};
  if (typeof metadataRaw === "string" && metadataRaw.trim()) {
    try {
      metadata = JSON.parse(metadataRaw);
    } catch {
      return { success: false, message: "メタデータのJSON形式が不正です" };
    }
  }

  const supabase = await createClient();
  const updateData: SitePageUpdate = {
    title: title.trim(),
    content,
    metadata: metadata as unknown as Json,
    updated_by: user.id,
  };
  // Supabase PostgREST builder .update() resolves to `never` with TS 5.9
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("site_pages") as any)
    .update(updateData)
    .eq("slug", slug);

  if (error) {
    return { success: false, message: `保存に失敗しました: ${error.message}` };
  }

  revalidatePath("/");
  revalidatePath(`/admin/site/pages/${slug}/edit`);

  return { success: true, message: "保存しました" };
}
