"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, Input, Card, CardContent, CardHeader } from "@/components/ui";
import { createAnnouncement, type ActionState } from "../actions";

export function AnnouncementForm() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    createAnnouncement,
    null,
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-fg mb-6">お知らせ作成</h1>

      <Card>
        <CardHeader>
          <p className="text-sm text-fg-muted">
            保護者向けのお知らせを作成します。
          </p>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="flex flex-col gap-4">
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
                <p className="text-sm text-danger">
                  {state.fieldErrors.body}
                </p>
              )}
            </div>

            {state && !state.success && !state.fieldErrors && (
              <p className="text-sm text-danger">{state.message}</p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" loading={isPending}>
                投稿する
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
