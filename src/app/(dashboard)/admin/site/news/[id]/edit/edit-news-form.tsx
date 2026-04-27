"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { FileUploader } from "@/components/attachments/file-uploader";
import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import { updateNews } from "../../actions";
import type { ActionResult, ActionState } from "@/lib/actions/types";
import type { AttachmentRow } from "@/lib/attachments/actions";

type FileInfo = { file: File };

type Props = {
  id: string;
  title: string;
  body: string;
  attachments: AttachmentRow[];
};

/**
 * Banner that surfaces the result of the most recent save attempt.
 * Extracted so unit tests can drive each visible state shape directly
 * without going through React's async useTransition machinery.
 */
export function EditNewsResultBanner({ state }: { state: ActionState }) {
  if (!state?.message) return null;
  return (
    <div
      role="alert"
      className={cn(
        "rounded-md px-4 py-3 text-sm",
        state.success ? "bg-success/10 text-success" : "bg-danger/10 text-danger",
      )}
    >
      {state.message}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function EditNewsForm({ id, title, body, attachments }: Props) {
  // Optimistic UI (same pattern as the CMS edit form): bypass <form
  // action> to avoid Next 16 attaching a fresh full-page RSC payload
  // to the Server Action response, which on slow CI/prod takes
  // seconds and made flow18/19/20-style flakes. See
  // edit-page-form.tsx for the full rationale.
  const [resultState, setResultState] = useState<ActionState>(null);
  const [isPending, startTransition] = useTransition();

  // IDs of existing attachments the admin marked for removal in this
  // session. Sent to the action as `removed_attachment_ids[]`.
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  // New files queued for upload.
  const [pendingFiles, setPendingFiles] = useState<FileInfo[]>([]);

  const toggleRemove = (attachmentId: string) => {
    setRemovedIds((prev) => {
      const next = new Set(prev);
      if (next.has(attachmentId)) next.delete(attachmentId);
      else next.add(attachmentId);
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    for (const removedId of removedIds) {
      formData.append("removed_attachment_ids", removedId);
    }
    for (const f of pendingFiles) {
      formData.append("files", f.file);
    }

    setResultState({ success: true, message: "保存しました" });

    startTransition(async () => {
      const result: ActionResult = await updateNews(id, null, formData);
      if (!result.success) {
        setResultState({ success: false, message: result.message });
      } else {
        // On success, clear the local UI bookkeeping. The page itself
        // will re-fetch fresh attachments / revisions on the next nav.
        setRemovedIds(new Set());
        setPendingFiles([]);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <EditNewsResultBanner state={resultState} />

      <Input name="title" label="タイトル" defaultValue={title} required />

      <div className="flex flex-col gap-1">
        <label htmlFor="body" className="text-sm font-medium text-fg">
          本文
        </label>
        <textarea
          id="body"
          name="body"
          required
          rows={12}
          defaultValue={body}
          className={cn(
            "w-full rounded-sm border border-border bg-bg-elev px-3 py-2 text-fg",
            "placeholder:text-fg-muted",
            "focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none",
            "resize-y text-sm leading-relaxed",
          )}
        />
      </div>

      {attachments.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-fg">現在の添付ファイル</h3>
          <ul className="flex flex-col gap-1.5">
            {attachments.map((att) => {
              const marked = removedIds.has(att.id);
              return (
                <li
                  key={att.id}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm",
                    marked
                      ? "border-danger/40 bg-danger/5 text-danger line-through"
                      : "border-border bg-bg-elev text-fg",
                  )}
                >
                  <span className="truncate">
                    {att.file_name}
                    <span className="ml-2 text-xs text-fg-muted">{formatSize(att.file_size)}</span>
                    {marked && <span className="ml-2 text-xs">（保存時に削除）</span>}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleRemove(att.id)}
                    aria-label={
                      marked ? `${att.file_name} の削除を取り消す` : `${att.file_name} を削除`
                    }
                    className={cn(
                      "shrink-0 rounded p-1 transition-colors",
                      marked
                        ? "text-fg-muted hover:text-fg"
                        : "text-fg-muted hover:text-danger hover:bg-danger/10",
                    )}
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-fg">添付ファイルを追加</h3>
        <FileUploader files={pendingFiles} onChange={setPendingFiles} disabled={isPending} />
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={isPending}>
          {isPending ? "保存中..." : "保存する"}
        </Button>
      </div>
    </form>
  );
}
