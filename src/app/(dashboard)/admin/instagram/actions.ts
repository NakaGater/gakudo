"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { isAdmin } from "@/lib/auth/roles";
import { ERROR_MESSAGES } from "@/config/constants";
import type { ActionState } from "@/lib/actions/types";

export async function addInstagramPost(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getUser();
  if (!isAdmin(user.role)) {
    return { success: false, error: ERROR_MESSAGES.UNAUTHORIZED };
  }

  const postUrl = formData.get("post_url") as string;
  if (!postUrl?.trim()) {
    return { success: false, error: "Instagram URLを入力してください" };
  }

  // Instagram URL validation
  const igPattern = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[\w-]+/;
  if (!igPattern.test(postUrl.trim())) {
    return { success: false, error: "有効なInstagram投稿URLを入力してください（例: https://www.instagram.com/p/xxx/）" };
  }

  const caption = (formData.get("caption") as string) || null;

  const supabase = await createClient();

  // Get max display_order
  const { data: maxRow } = await supabase
    .from("instagram_posts")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .single();

  const nextOrder = (maxRow?.display_order ?? -1) + 1;

  const { error } = await supabase.from("instagram_posts").insert({
    post_url: postUrl.trim(),
    caption,
    display_order: nextOrder,
    created_by: user.id,
  });

  if (error) {
    return { success: false, error: "登録に失敗しました" };
  }

  revalidatePath("/admin/instagram");
  revalidatePath("/gallery");
  return { success: true };
}

export async function deleteInstagramPost(id: string): Promise<ActionState> {
  const user = await getUser();
  if (!isAdmin(user.role)) {
    return { success: false, error: ERROR_MESSAGES.UNAUTHORIZED };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("instagram_posts").delete().eq("id", id);

  if (error) {
    return { success: false, error: "削除に失敗しました" };
  }

  revalidatePath("/admin/instagram");
  revalidatePath("/gallery");
  return { success: true };
}

export async function toggleInstagramPostVisibility(
  id: string,
  currentVisible: boolean,
): Promise<ActionState> {
  const user = await getUser();
  if (!isAdmin(user.role)) {
    return { success: false, error: ERROR_MESSAGES.UNAUTHORIZED };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("instagram_posts")
    .update({ is_visible: !currentVisible })
    .eq("id", id);

  if (error) {
    return { success: false, error: "更新に失敗しました" };
  }

  revalidatePath("/admin/instagram");
  revalidatePath("/gallery");
  return { success: true };
}
