"use client";

import { useActionState } from "react";
import { Button, Input } from "@/components/ui";
import { createNews, type ActionState } from "../actions";
import { cn } from "@/lib/utils";

export function CreateNewsForm() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    createNews,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.message && !state.success && (
        <div
          role="alert"
          className="rounded-md bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {state.message}
        </div>
      )}

      <Input name="title" label="タイトル" required />

      <div className="flex flex-col gap-1">
        <label htmlFor="body" className="text-sm font-medium text-fg">
          本文
        </label>
        <textarea
          id="body"
          name="body"
          required
          rows={12}
          className={cn(
            "w-full rounded-sm border border-border bg-bg-elev px-3 py-2 text-fg",
            "placeholder:text-fg-muted",
            "focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none",
            "resize-y text-sm leading-relaxed",
          )}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={isPending}>
          作成する
        </Button>
      </div>
    </form>
  );
}
