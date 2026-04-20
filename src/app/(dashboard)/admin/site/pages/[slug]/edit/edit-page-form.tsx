"use client";

import { useActionState } from "react";
import { Button, Input } from "@/components/ui";
import { updateSitePage, type ActionState } from "../../../actions";
import { cn } from "@/lib/utils";

type Props = {
  slug: string;
  title: string;
  content: string;
};

export function EditPageForm({ slug, title, content }: Props) {
  const boundAction = updateSitePage.bind(null, slug);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    boundAction,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.message && (
        <div
          role="alert"
          className={cn(
            "rounded-md px-4 py-3 text-sm",
            state.success
              ? "bg-success/10 text-success"
              : "bg-danger/10 text-danger",
          )}
        >
          {state.message}
        </div>
      )}

      <Input
        name="title"
        label="タイトル"
        defaultValue={title}
        required
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="content" className="text-sm font-medium text-fg">
          コンテンツ（Markdown）
        </label>
        <textarea
          id="content"
          name="content"
          defaultValue={content}
          rows={20}
          className={cn(
            "w-full rounded-sm border border-border bg-bg-elev px-3 py-2 text-fg",
            "placeholder:text-fg-muted",
            "focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none",
            "resize-y font-mono text-sm leading-relaxed",
          )}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={isPending}>
          保存する
        </Button>
      </div>
    </form>
  );
}
