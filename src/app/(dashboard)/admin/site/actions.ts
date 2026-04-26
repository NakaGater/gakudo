"use server";

import { revalidatePath } from "next/cache";
import { withAuth } from "@/lib/actions/middleware";
import { sanitizeError } from "@/lib/errors/sanitize";
import { getString } from "@/lib/validation/form";
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
    // Phase 2-D: getString centralizes the typeof + trim plumbing.
    const titleR = getString(formData, "title", { message: "タイトルを入力してください" });
    if (!titleR.ok) return { success: false, message: titleR.error };

    // content may legitimately be an empty string (cleared page body),
    // but the field must be *present*; getString collapses null and ""
    // for required:false so we keep this one as a raw FormData read.
    const contentRaw = formData.get("content");
    if (typeof contentRaw !== "string") {
      return { success: false, message: "コンテンツを入力してください" };
    }
    const content = contentRaw;

    const metadataR = getString(formData, "metadata", { required: false });
    let metadata: Record<string, unknown> = {};
    if (metadataR.ok && metadataR.value) {
      try {
        metadata = JSON.parse(metadataR.value);
      } catch {
        return { success: false, message: "メタデータのJSON形式が不正です" };
      }
    }

    const updateData: SitePageUpdate = {
      title: titleR.value,
      content,
      metadata: metadata as Json,
      updated_by: user.id,
    };
    const { error } = await supabase.from("site_pages").update(updateData).eq("slug", slug);

    if (error) {
      return { success: false, message: sanitizeError(error, "保存に失敗しました") };
    }

    revalidatePath("/");
    revalidatePath(`/${slug}`);
    revalidatePath(`/admin/site/pages/${slug}/edit`);

    return { success: true, message: "保存しました" };
  },
);
