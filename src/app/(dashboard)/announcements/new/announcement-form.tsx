"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { FileUploader } from "@/components/attachments/file-uploader";
import { Button, Input, Card, CardContent, CardHeader } from "@/components/ui";
import { createAnnouncement } from "../actions";
import { RecipientPicker } from "./recipient-picker";
import type { ActionResult, ActionState } from "@/lib/actions/types";
import type { SelectableParent } from "@/lib/announcements/recipients-server";

type FileInfo = { file: File };

interface Props {
  parents: SelectableParent[];
}

export function AnnouncementForm({ parents }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pendingFiles, setPendingFiles] = useState<FileInfo[]>([]);

  const wrappedAction = async (_prev: ActionState, formData: FormData): Promise<ActionResult> => {
    // フォームデータに添付ファイルを追加
    for (const f of pendingFiles) {
      formData.append("files", f.file);
    }
    return createAnnouncement(_prev, formData);
  };

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(wrappedAction, null);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-fg mb-6">お知らせ作成</h1>

      <Card>
        <CardHeader>
          <p className="text-sm text-fg-muted">
            保護者向けのお知らせを作成します。送信対象は「全員」または「個別選択」から選べます。
          </p>
        </CardHeader>
        <CardContent>
          <form ref={formRef} action={formAction} className="flex flex-col gap-4">
            <Input
              name="title"
              label="タイトル"
              required
              maxLength={200}
              placeholder="お知らせのタイトル"
              error={state?.fieldErrors?.title}
            />

            <div className="flex flex-col gap-1">
              <label htmlFor="body" className="text-sm font-medium text-fg">
                本文
              </label>
              <textarea
                id="body"
                name="body"
                required
                placeholder="お知らせの内容を入力してください"
                className="w-full min-h-[200px] rounded-sm border border-border bg-bg-elev px-3 py-2 text-fg placeholder:text-fg-muted focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {state?.fieldErrors?.body && (
                <p className="text-sm text-danger">{state.fieldErrors.body}</p>
              )}
            </div>

            <RecipientPicker
              parents={parents}
              error={state?.fieldErrors?.recipients}
              disabled={isPending}
            />

            <FileUploader files={pendingFiles} onChange={setPendingFiles} disabled={isPending} />

            {state && !state.success && !state.fieldErrors && (
              <p className="text-sm text-danger">{state.message}</p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" loading={isPending}>
                {isPending ? "投稿中..." : "投稿する"}
              </Button>
              <Link href="/announcements">
                <Button type="button" variant="secondary">
                  キャンセル
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
