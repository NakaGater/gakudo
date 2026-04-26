"use server";

import { revalidatePath } from "next/cache";
import { withAuth } from "@/lib/actions/middleware";
import type { ActionResult, ActionState } from "@/lib/actions/types";

const STAFF_ROLES = ["admin", "teacher", "entrance"] as const;

export const addInstagramPost = withAuth(
  STAFF_ROLES,
  async ({ user, supabase }, _prev: ActionState, formData: FormData): Promise<ActionResult> => {
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
  },
);

export const deleteInstagramPost = withAuth(
  STAFF_ROLES,
  async ({ supabase }, id: string): Promise<ActionResult> => {
    const { error } = await supabase.from("instagram_posts").delete().eq("id", id);

    if (error) {
      return { success: false, message: "削除に失敗しました" };
    }

    revalidatePath("/photos/instagram");
    revalidatePath("/gallery");
    return { success: true, message: "" };
  },
);

export const toggleInstagramPostVisibility = withAuth(
  STAFF_ROLES,
  async ({ supabase }, id: string, currentVisible: boolean): Promise<ActionResult> => {
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
  },
);
