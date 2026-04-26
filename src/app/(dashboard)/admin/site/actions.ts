"use server";

import { revalidatePath } from "next/cache";
import { withAuth } from "@/lib/actions/middleware";
import { sanitizeError } from "@/lib/errors/sanitize";
import type { ActionResult, ActionState } from "@/lib/actions/types";
import type { Database, Json } from "@/lib/supabase/types";

type SitePageUpdate = Database["public"]["Tables"]["site_pages"]["Update"];

// Note: previously a non-admin caller was server-side `redirect("/")`'d.
// withAuth uniformly returns ERROR_MESSAGES.UNAUTHORIZED instead. The
// edit page itself is already gated by (dashboard)/layout.tsx's role
// check, so a non-admin can't reach the form to submit it under normal
// flow; this just removes the stale redirect from the action layer.
export const updateSitePage = withAuth(
  "admin",
  async (
    { user, supabase },
    slug: string,
    _prev: ActionState,
    formData: FormData,
  ): Promise<ActionResult> => {
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

    const updateData: SitePageUpdate = {
      title: title.trim(),
      content,
      metadata: metadata as Json,
      updated_by: user.id,
    };
    const { error } = await supabase.from("site_pages").update(updateData).eq("slug", slug);

    if (error) {
      return { success: false, message: sanitizeError(error, "保存に失敗しました") };
    }

    revalidatePath("/");
    revalidatePath(`/admin/site/pages/${slug}/edit`);

    return { success: true, message: "保存しました" };
  },
);
