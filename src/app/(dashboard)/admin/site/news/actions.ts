"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { withAuth } from "@/lib/actions/middleware";
import { deleteAttachment, uploadAttachment } from "@/lib/attachments/actions";
import { getUser } from "@/lib/auth/get-user";
import { isAdmin } from "@/lib/auth/roles";
import { sanitizeError } from "@/lib/errors/sanitize";
import { createClient } from "@/lib/supabase/server";
import { getString } from "@/lib/validation/form";
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
    // Phase 2-D: getString centralizes the typeof / trim plumbing.
    const titleR = getString(formData, "title", { message: "タイトルを入力してください" });
    if (!titleR.ok) return { success: false, message: titleR.error };
    const bodyR = getString(formData, "body", { message: "本文を入力してください" });
    if (!bodyR.ok) return { success: false, message: bodyR.error };

    const insertData: SiteNewsInsert = {
      title: titleR.value,
      body: bodyR.value,
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

/**
 * Snapshot of an attachment row taken at the time of an edit. Stored
 * verbatim in `site_news_revisions.attachments` (JSONB) so the
 * revision keeps showing what was attached even after the underlying
 * attachment row or storage object is removed by a later edit.
 */
type AttachmentSnapshot = {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
};

// The auto-generated `Database` type does not (yet) include the
// `site_news_revisions` table — that arrives the next time
// `npm run db:types` is run after migration 00013 lands. Until then
// route the writes/reads through a hand-rolled minimal client view.
// The runtime shape is asserted by the SQL schema, RLS, and these
// action tests.
type RevisionsClient = {
  from: (t: "site_news_revisions") => {
    insert: (row: Record<string, unknown>) => Promise<{ error: unknown }>;
    select: (cols: string) => {
      eq: (
        col: string,
        val: string,
      ) => {
        order: (
          col: string,
          opts: { ascending: boolean },
        ) => Promise<{ data: NewsRevision[] | null }>;
      };
    };
  };
};

export const updateNews = withAuth(
  "admin",
  async (
    { user, supabase },
    id: string,
    _prev: ActionState,
    formData: FormData,
  ): Promise<ActionResult> => {
    const titleR = getString(formData, "title", { message: "タイトルを入力してください" });
    if (!titleR.ok) return { success: false, message: titleR.error };
    const bodyR = getString(formData, "body", { message: "本文を入力してください" });
    if (!bodyR.ok) return { success: false, message: bodyR.error };

    // 1. Read the current row + attachments so we can snapshot them
    //    into the revision history BEFORE we mutate anything.
    const { data: current, error: readError } = await supabase
      .from("site_news")
      .select("title, body")
      .eq("id", id)
      .single();
    if (readError || !current) {
      return {
        success: false,
        message: sanitizeError(readError, "お知らせが見つかりませんでした"),
      };
    }

    const { data: liveAttachments } = await supabase
      .from("attachments")
      .select("id, file_name, file_path, file_size, mime_type")
      .eq("entity_type", "news")
      .eq("entity_id", id)
      .returns<AttachmentSnapshot[]>();

    // 2. Append a revision row carrying the pre-edit snapshot.
    await (supabase as unknown as RevisionsClient).from("site_news_revisions").insert({
      news_id: id,
      title: current.title,
      body: current.body,
      attachments: liveAttachments ?? [],
      edited_by: user.id,
    });

    // 3. Update the live row. The trigger added in 00013 bumps
    //    updated_at automatically; we set updated_by ourselves. The
    //    `as never` cast bypasses `exactOptionalPropertyTypes` rejecting
    //    `updated_by` — that column was added in migration 00013 and
    //    hasn't been folded into the auto-generated Database type yet
    //    (run `npm run db:types` after this PR's migration to drop the
    //    cast). Runtime shape is enforced by SQL.
    const { error: updateError } = await supabase
      .from("site_news")
      .update({
        title: titleR.value,
        body: bodyR.value,
        updated_by: user.id,
      } as never)
      .eq("id", id);

    if (updateError) {
      return { success: false, message: sanitizeError(updateError, "更新に失敗しました") };
    }

    // 4. Apply attachment removals.
    const removedIds = formData.getAll("removed_attachment_ids");
    for (const removedId of removedIds) {
      if (typeof removedId === "string" && removedId.length > 0) {
        await deleteAttachment(removedId);
      }
    }

    // 5. Apply new uploads.
    const files = formData.getAll("files");
    for (const file of files) {
      if (file instanceof File && file.size > 0) {
        const fd = new FormData();
        fd.set("file", file);
        await uploadAttachment("news", id, fd);
      }
    }

    // Public caches: list + this entry's static detail page.
    // Deliberately NOT revalidating /admin/site/news/${id}/edit — that
    // would force Next to attach a fresh RSC payload for the current
    // page to the Server Action response (the same root cause of the
    // ~30s flow18/19 flake fixed earlier; see admin/site/actions.ts).
    // The form uses an Optimistic-UI submit so it surfaces "保存しま
    // した" without needing the page itself to refresh.
    revalidatePath("/news");
    revalidatePath(`/news/${id}`);
    revalidatePath("/admin/site/news");

    return { success: true, message: "保存しました" };
  },
);

/**
 * Edit history for a news entry, newest first. Returns an empty list
 * for non-admin callers so consumers don't have to re-check the role.
 */
export type NewsRevision = {
  id: string;
  title: string;
  body: string;
  attachments: AttachmentSnapshot[];
  edited_at: string;
  edited_by: string | null;
};

export async function getNewsRevisions(newsId: string): Promise<NewsRevision[]> {
  const user = await getUser();
  if (!isAdmin(user.role)) return [];

  const supabase = await createClient();

  const { data } = await (supabase as unknown as RevisionsClient)
    .from("site_news_revisions")
    .select("id, title, body, attachments, edited_at, edited_by")
    .eq("news_id", newsId)
    .order("edited_at", { ascending: false });

  return data ?? [];
}
