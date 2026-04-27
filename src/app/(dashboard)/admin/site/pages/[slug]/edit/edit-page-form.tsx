"use client";

import { useCallback, useState, useTransition } from "react";
import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import { AboutMetaFields } from "./meta-fields/about-meta-fields";
import { AccessMetaFields } from "./meta-fields/access-meta-fields";
import { DailyLifeMetaFields } from "./meta-fields/daily-life-meta-fields";
import { EnrollmentMetaFields } from "./meta-fields/enrollment-meta-fields";
import { FaqMetaFields } from "./meta-fields/faq-meta-fields";
import { HomeMetaFields } from "./meta-fields/home-meta-fields";
import { updateSitePage } from "../../../actions";
import type { ActionResult, ActionState } from "@/lib/actions/types";

type Props = {
  slug: string;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
};

/**
 * Banner that surfaces the most recent save result. Extracted so unit
 * tests can drive every visible state shape directly without going
 * through the async action wiring.
 */
export function SaveResultBanner({ state }: { state: ActionState }) {
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

export function EditPageForm({ slug, title, content, metadata }: Props) {
  // Optimistic save UX (PR replacing useActionState):
  //
  // Calling a Server Action via `<form action={formAction}>` (the
  // useActionState pattern) makes Next 16 attach a fresh RSC payload
  // for the entire current page to the response. That means re-running
  // root layout + (dashboard) layout (getUser, getBadgeCounts → 2-3
  // Supabase round trips) + this edit page (another site_pages fetch)
  // before the form's state.message can update with "保存しました".
  // On production this is ~500ms-1s; on CI it's tens of seconds.
  //
  // We don't actually need any of that re-rendered tree here — the
  // form's <input defaultValue> is set once on initial mount and
  // doesn't refresh, and the banner is purely client state. So bypass
  // <form action> entirely:
  //   1. Show "保存しました" optimistically the moment the user submits.
  //   2. Call the Server Action as a plain async function (which does
  //      NOT include the RSC payload — that's only triggered by
  //      <form action> binding).
  //   3. If the action returns an error, replace the optimistic banner
  //      with the error message.
  //
  // Result: instant visual feedback, no layout-wide re-render cost,
  // and the public-facing static pages still get refreshed because the
  // action's revalidatePath calls run unchanged on the server.
  const [resultState, setResultState] = useState<ActionState>(null);
  const [isPending, startTransition] = useTransition();

  const boundAction = updateSitePage.bind(null, slug);

  // Metadata state
  const [meta, setMeta] = useState<Record<string, unknown>>(metadata ?? {});

  const updateMeta = useCallback((key: string, value: unknown) => {
    setMeta((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Optimistic banner — flips to error if the server disagrees below.
    setResultState({ success: true, message: "保存しました" });

    startTransition(async () => {
      const result: ActionResult = await boundAction(null, formData);
      if (!result.success) {
        setResultState({ success: false, message: result.message });
      }
      // On success, the optimistic state is already correct; do nothing
      // so we don't trigger an unnecessary re-render.
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 min-w-0 w-full">
      <SaveResultBanner state={resultState} />

      {/* hidden field for metadata JSON */}
      <input type="hidden" name="metadata" value={JSON.stringify(meta)} />

      <Input name="title" label="タイトル" defaultValue={title} required />

      {/* サブタイトル — 全ページ共通 */}
      <div className="flex flex-col gap-1">
        <label htmlFor="meta-subtitle" className="text-sm font-medium text-fg">
          サブタイトル
        </label>
        <input
          id="meta-subtitle"
          type="text"
          value={(meta.subtitle as string) ?? ""}
          onChange={(e) => updateMeta("subtitle", e.target.value)}
          className={cn(
            "w-full rounded-sm border border-border bg-bg-elev px-3 py-2 text-fg text-sm",
            "focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none",
          )}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="content" className="text-sm font-medium text-fg">
          本文
        </label>
        <textarea
          id="content"
          name="content"
          defaultValue={content}
          rows={10}
          className={cn(
            "w-full rounded-sm border border-border bg-bg-elev px-3 py-2 text-fg",
            "placeholder:text-fg-muted",
            "focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none",
            "resize-y font-mono text-sm leading-relaxed",
          )}
        />
      </div>

      {/* Home ページ固有フィールド */}
      {slug === "home" && <HomeMetaFields meta={meta} updateMeta={updateMeta} />}

      {/* About ページ固有フィールド */}
      {slug === "about" && <AboutMetaFields meta={meta} updateMeta={updateMeta} />}

      {/* FAQ ページ固有フィールド */}
      {slug === "faq" && <FaqMetaFields meta={meta} updateMeta={updateMeta} />}

      {/* 日々の生活ページ固有フィールド */}
      {slug === "daily-life" && <DailyLifeMetaFields meta={meta} updateMeta={updateMeta} />}

      {/* 入所案内ページ固有フィールド */}
      {slug === "enrollment" && <EnrollmentMetaFields meta={meta} updateMeta={updateMeta} />}

      {/* アクセスページ固有フィールド */}
      {slug === "access" && <AccessMetaFields meta={meta} updateMeta={updateMeta} />}

      <div className="flex justify-end">
        <Button type="submit" loading={isPending}>
          保存する
        </Button>
      </div>
    </form>
  );
}
