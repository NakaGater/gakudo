"use client";

import { useActionState, useState, useCallback } from "react";
import { Button, Input } from "@/components/ui";
import { updateSitePage, type ActionState } from "../../../actions";
import { cn } from "@/lib/utils";

type ScheduleItem = { time: string; label: string; emoji: string };
type FacilityItem = { label: string; value: string };

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

      {/* About ページ固有フィールド */}
      {slug === "about" && (
        <AboutMetaFields meta={meta} updateMeta={updateMeta} />
      )}

      {/* Access ページ固有フィールド */}
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

/* ================================================================
   About ページ: 1日の流れ + 施設概要
   ================================================================ */
function AboutMetaFields({
  meta,
  updateMeta,
}: {
  meta: Record<string, unknown>;
  updateMeta: (key: string, value: unknown) => void;
}) {
  const schedule = (meta.schedule as ScheduleItem[]) ?? [];
  const facilityInfo = (meta.facility_info as FacilityItem[]) ?? [];

  const updateScheduleItem = (idx: number, field: keyof ScheduleItem, value: string) => {
    const updated = [...schedule];
    updated[idx] = { ...updated[idx], [field]: value };
    updateMeta("schedule", updated);
  };

  const addScheduleItem = () => {
    updateMeta("schedule", [...schedule, { time: "", label: "", emoji: "" }]);
  };

  const removeScheduleItem = (idx: number) => {
    updateMeta("schedule", schedule.filter((_, i) => i !== idx));
  };

  const updateFacilityItem = (idx: number, field: keyof FacilityItem, value: string) => {
    const updated = [...facilityInfo];
    updated[idx] = { ...updated[idx], [field]: value };
    updateMeta("facility_info", updated);
  };

  const addFacilityItem = () => {
    updateMeta("facility_info", [...facilityInfo, { label: "", value: "" }]);
  };

  const removeFacilityItem = (idx: number) => {
    updateMeta("facility_info", facilityInfo.filter((_, i) => i !== idx));
  };

  return (
    <>
      {/* 1日の流れ */}
      <fieldset className="border border-border rounded-md p-4">
        <legend className="text-sm font-bold text-fg px-2">1日の流れ</legend>
        <div className="flex flex-col gap-3">
          {schedule.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="絵文字"
                value={item.emoji}
                onChange={(e) => updateScheduleItem(idx, "emoji", e.target.value)}
                className="w-14 rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm text-center"
              />
              <input
                type="text"
                placeholder="時間"
                value={item.time}
                onChange={(e) => updateScheduleItem(idx, "time", e.target.value)}
                className="w-20 rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
              />
              <input
                type="text"
                placeholder="内容"
                value={item.label}
                onChange={(e) => updateScheduleItem(idx, "label", e.target.value)}
                className="flex-1 rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={() => removeScheduleItem(idx)}
                className="text-danger hover:text-danger/80 text-sm px-2"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addScheduleItem}
            className="self-start text-sm text-accent hover:text-accent-hv"
          >
            ＋ 追加
          </button>
        </div>
      </fieldset>

      {/* 施設概要 */}
      <fieldset className="border border-border rounded-md p-4">
        <legend className="text-sm font-bold text-fg px-2">施設概要</legend>
        <div className="flex flex-col gap-3">
          {facilityInfo.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="項目名"
                value={item.label}
                onChange={(e) => updateFacilityItem(idx, "label", e.target.value)}
                className="w-32 rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
              />
              <input
                type="text"
                placeholder="値"
                value={item.value}
                onChange={(e) => updateFacilityItem(idx, "value", e.target.value)}
                className="flex-1 rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={() => removeFacilityItem(idx)}
                className="text-danger hover:text-danger/80 text-sm px-2"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addFacilityItem}
            className="self-start text-sm text-accent hover:text-accent-hv"
          >
            ＋ 追加
          </button>
        </div>
      </fieldset>
    </>
  );
}

/* ================================================================
   Access ページ: 電話番号・受付時間・開所時間・見学案内
   ================================================================ */
function AccessMetaFields({
  meta,
  updateMeta,
}: {
  meta: Record<string, unknown>;
  updateMeta: (key: string, value: unknown) => void;
}) {
  return (
    <fieldset className="border border-border rounded-md p-4">
      <legend className="text-sm font-bold text-fg px-2">アクセス情報</legend>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-fg-muted">電話番号</label>
            <input
              type="text"
              value={(meta.phone as string) ?? ""}
              onChange={(e) => updateMeta("phone", e.target.value)}
              className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-fg-muted">電話受付時間</label>
            <input
              type="text"
              value={(meta.phone_hours as string) ?? ""}
              onChange={(e) => updateMeta("phone_hours", e.target.value)}
              className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-fg-muted">開所時間</label>
          <textarea
            value={(meta.opening_hours as string) ?? ""}
            onChange={(e) => updateMeta("opening_hours", e.target.value)}
            rows={2}
            className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm resize-y"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-fg-muted">見学案内の見出し</label>
          <input
            type="text"
            value={(meta.visit_heading as string) ?? ""}
            onChange={(e) => updateMeta("visit_heading", e.target.value)}
            className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-fg-muted">見学案内のテキスト</label>
          <textarea
            value={(meta.visit_text as string) ?? ""}
            onChange={(e) => updateMeta("visit_text", e.target.value)}
            rows={3}
            className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm resize-y"
          />
        </div>
      </div>
    </fieldset>
  );
}
