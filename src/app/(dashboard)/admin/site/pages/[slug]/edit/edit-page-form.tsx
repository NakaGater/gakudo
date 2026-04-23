"use client";

import { useActionState, useState, useCallback } from "react";
import { Button, Input } from "@/components/ui";
import type { ActionState } from "@/lib/actions/types";
import { updateSitePage } from "../../../actions";
import { cn } from "@/lib/utils";
import { HomeMetaFields } from "./meta-fields/home-meta-fields";
import { AboutMetaFields } from "./meta-fields/about-meta-fields";
import { AccessMetaFields } from "./meta-fields/access-meta-fields";
import { FaqMetaFields } from "./meta-fields/faq-meta-fields";
import { DailyLifeMetaFields } from "./meta-fields/daily-life-meta-fields";
import { EnrollmentMetaFields } from "./meta-fields/enrollment-meta-fields";

type Props = {
  slug: string;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
};

export function EditPageForm({ slug, title, content, metadata }: Props) {
  const boundAction = updateSitePage.bind(null, slug);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    boundAction,
    null,
  );

  // Metadata state
  const [meta, setMeta] = useState<Record<string, unknown>>(metadata ?? {});

  const updateMeta = useCallback((key: string, value: unknown) => {
    setMeta((prev) => ({ ...prev, [key]: value }));
  }, []);

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

      {/* hidden field for metadata JSON */}
      <input type="hidden" name="metadata" value={JSON.stringify(meta)} />

      <Input
        name="title"
        label="タイトル"
        defaultValue={title}
        required
      />

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
      {slug === "home" && (
        <HomeMetaFields meta={meta} updateMeta={updateMeta} />
      )}

      {/* About ページ固有フィールド */}
      {slug === "about" && (
        <AboutMetaFields meta={meta} updateMeta={updateMeta} />
      )}

      {/* FAQ ページ固有フィールド */}
      {slug === "faq" && (
        <FaqMetaFields meta={meta} setMeta={setMeta} />
      )}

      {/* 日々の生活ページ固有フィールド */}
      {slug === "daily-life" && (
        <DailyLifeMetaFields meta={meta} setMeta={setMeta} />
      )}

      {/* 入所案内ページ固有フィールド */}
      {slug === "enrollment" && (
        <EnrollmentMetaFields meta={meta} setMeta={setMeta} />
      )}

      {/* アクセスページ固有フィールド */}
      {slug === "access" && (
        <AccessMetaFields meta={meta} updateMeta={updateMeta} />
      )}

      <div className="flex justify-end">
        <Button type="submit" loading={isPending}>
          保存する
        </Button>
      </div>
    </form>
  );
}
