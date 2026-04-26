"use server";

import { revalidatePath } from "next/cache";
import { ERROR_MESSAGES } from "@/config/constants";
import { getUser } from "@/lib/auth/get-user";
import { isStaff } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, ActionState } from "@/lib/actions/types";

export async function addInstagramPost(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getUser();
  if (!isStaff(user.role)) {
    return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED };
  }

  const postUrl = formData.get("post_url") as string;
  if (!postUrl?.trim()) {
    return { success: false, message: "Instagram URLを入力してください" };
  }

  // Instagram URL validation. The trailing `\/?$` anchors the match so
  // suffixes like `https://instagram.com/p/abc/<script>` are rejected
  // (Phase 2-A: hardened from Phase 0-C's skipped regression test).
  const igPattern = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[\w-]+\/?$/;
  if (!igPattern.test(postUrl.trim())) {
    return {
      success: false,
      message: "有効なInstagram投稿URLを入力してください（例: https://www.instagram.com/p/xxx/）",
    };
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
    return { success: false, message: "登録に失敗しました" };
  }

  revalidatePath("/photos/instagram");
  revalidatePath("/gallery");
  return { success: true, message: "" };
}

export async function deleteInstagramPost(id: string): Promise<ActionResult> {
  const user = await getUser();
  if (!isStaff(user.role)) {
    return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("instagram_posts").delete().eq("id", id);

  if (error) {
    return { success: false, message: "削除に失敗しました" };
  }

  revalidatePath("/photos/instagram");
  revalidatePath("/gallery");
  return { success: true, message: "" };
}

export async function toggleInstagramPostVisibility(
  id: string,
  currentVisible: boolean,
): Promise<ActionResult> {
  const user = await getUser();
  if (!isStaff(user.role)) {
    return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("instagram_posts")
    .update({ is_visible: !currentVisible })
    .eq("id", id);

  if (error) {
    return { success: false, message: "更新に失敗しました" };
  }

  revalidatePath("/photos/instagram");
  revalidatePath("/gallery");
  return { success: true, message: "" };
}
