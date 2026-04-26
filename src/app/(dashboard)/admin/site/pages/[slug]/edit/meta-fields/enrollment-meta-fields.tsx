"use client";

import { useArrayEditor } from "@/components/forms/use-array-editor";
import type { MetaFieldsProps } from "./types";

type Hour = { label: string; time: string };
type Fee = { label: string; amount: string; note: string };
type Step = { emoji: string; title: string; description: string };

export function EnrollmentMetaFields({ meta, updateMeta }: MetaFieldsProps) {
  const eligibility = (meta.eligibility as { target: string; capacity: string }) ?? {
    target: "",
    capacity: "",
  };
  const hours = (meta.hours as Hour[]) ?? [];
  const fees = (meta.fees as Fee[]) ?? [];
  const siblingFees = (meta.sibling_fees as Fee[]) ?? [];
  const steps = (meta.steps as Step[]) ?? [];
  const documents = (meta.documents as string[]) ?? [];
  const notes = (meta.notes as string[]) ?? [];

  const hoursEditor = useArrayEditor<Hour>(hours, (next) => updateMeta("hours", next), {
    label: "",
    time: "",
  });
  const feesEditor = useArrayEditor<Fee>(fees, (next) => updateMeta("fees", next), {
    label: "",
    amount: "",
    note: "",
  });
  const siblingFeesEditor = useArrayEditor<Fee>(
    siblingFees,
    (next) => updateMeta("sibling_fees", next),
    { label: "", amount: "", note: "" },
  );
  const stepsEditor = useArrayEditor<Step>(steps, (next) => updateMeta("steps", next), {
    emoji: "📌",
    title: "",
    description: "",
  });

  const updateStringAt = (key: string, list: string[], idx: number, value: string) => {
    updateMeta(
      key,
      list.map((v, i) => (i === idx ? value : v)),
    );
  };
  const removeStringAt = (key: string, list: string[], idx: number) => {
    updateMeta(
      key,
      list.filter((_, i) => i !== idx),
    );
  };

  return (
    <>
      {/* 対象・定員 */}
      <fieldset className="rounded-md border border-border p-2 sm:p-3 space-y-2 w-full box-border">
        <legend className="px-1 text-xs font-bold text-ink-mid">対象・定員</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-ink-light">対象</label>
            <input
              value={eligibility.target}
              onChange={(e) =>
                updateMeta("eligibility", { ...eligibility, target: e.target.value })
              }
              className="w-full rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] text-ink-light">定員</label>
            <input
              value={eligibility.capacity}
              onChange={(e) =>
                updateMeta("eligibility", { ...eligibility, capacity: e.target.value })
              }
              className="w-full rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
            />
          </div>
        </div>
      </fieldset>

      {/* 開所時間 */}
      <fieldset className="rounded-md border border-border p-2 sm:p-3 space-y-2 w-full box-border">
        <legend className="px-1 text-xs font-bold text-ink-mid">開所時間</legend>
        {hoursEditor.items.map((h, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              value={h.label}
              onChange={(e) => hoursEditor.update(i, { label: e.target.value })}
              placeholder="平日"
              className="w-1/3 rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
            />
            <input
              value={h.time}
              onChange={(e) => hoursEditor.update(i, { time: e.target.value })}
              placeholder="放課後〜19:00"
              className="flex-1 rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={() => hoursEditor.remove(i)}
              className="text-cr-red text-xs"
            >
              ✕
            </button>
          </div>
        ))}
        <button type="button" onClick={hoursEditor.add} className="text-xs text-cr-blue">
          ＋ 時間帯を追加
        </button>
      </fieldset>

      {/* 料金（学年別） */}
      <fieldset className="rounded-md border border-border p-2 sm:p-3 space-y-2 w-full box-border">
        <legend className="px-1 text-xs font-bold text-ink-mid">料金（学年別）</legend>
        {feesEditor.items.map((f, i) => (
          <div
            key={i}
            className="flex flex-col gap-1.5 rounded-md border border-border/50 p-2 bg-bg-elev/30"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-ink-light">料金 {i + 1}</span>
              <button
                type="button"
                onClick={() => feesEditor.remove(i)}
                className="text-cr-red text-xs shrink-0"
              >
                ✕
              </button>
            </div>
            <input
              value={f.label}
              onChange={(e) => feesEditor.update(i, { label: e.target.value })}
              placeholder="低学年"
              className="w-full rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
            />
            <input
              value={f.amount}
              onChange={(e) => feesEditor.update(i, { amount: e.target.value })}
              placeholder="15,000円/月"
              className="w-full rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
            />
            <input
              value={f.note}
              onChange={(e) => feesEditor.update(i, { note: e.target.value })}
              placeholder="備考"
              className="w-full rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
            />
          </div>
        ))}
        <button type="button" onClick={feesEditor.add} className="text-xs text-cr-blue">
          ＋ 料金を追加
        </button>
      </fieldset>

      {/* 兄弟割引料金 */}
      <fieldset className="rounded-md border border-border p-2 sm:p-3 space-y-2 w-full box-border">
        <legend className="px-1 text-xs font-bold text-ink-mid">兄弟割引料金</legend>
        {siblingFeesEditor.items.map((f, i) => (
          <div
            key={i}
            className="flex flex-col gap-1.5 rounded-md border border-border/50 p-2 bg-bg-elev/30"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-ink-light">割引 {i + 1}</span>
              <button
                type="button"
                onClick={() => siblingFeesEditor.remove(i)}
                className="text-cr-red text-xs shrink-0"
              >
                ✕
              </button>
            </div>
            <input
              value={f.label}
              onChange={(e) => siblingFeesEditor.update(i, { label: e.target.value })}
              placeholder="2人目（低学年）"
              className="w-full rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
            />
            <input
              value={f.amount}
              onChange={(e) => siblingFeesEditor.update(i, { amount: e.target.value })}
              placeholder="12,000円/月"
              className="w-full rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
            />
            <input
              value={f.note}
              onChange={(e) => siblingFeesEditor.update(i, { note: e.target.value })}
              placeholder="備考"
              className="w-full rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
            />
          </div>
        ))}
        <button type="button" onClick={siblingFeesEditor.add} className="text-xs text-cr-blue">
          ＋ 兄弟割引を追加
        </button>
      </fieldset>

      {/* 入所の流れ */}
      <fieldset className="rounded-md border border-border p-2 sm:p-3 space-y-2 w-full box-border">
        <legend className="px-1 text-xs font-bold text-ink-mid">入所の流れ（ステップ）</legend>
        {stepsEditor.items.map((s, i) => (
          <div key={i} className="flex gap-2 items-start">
            <input
              value={s.emoji}
              onChange={(e) => stepsEditor.update(i, { emoji: e.target.value })}
              className="w-12 rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm text-center"
            />
            <div className="flex-1 space-y-1">
              <input
                value={s.title}
                onChange={(e) => stepsEditor.update(i, { title: e.target.value })}
                placeholder="タイトル"
                className="w-full rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
              />
              <textarea
                value={s.description}
                onChange={(e) => stepsEditor.update(i, { description: e.target.value })}
                placeholder="説明"
                rows={2}
                className="w-full rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm resize-y"
              />
            </div>
            <button
              type="button"
              onClick={() => stepsEditor.remove(i)}
              className="text-cr-red text-xs mt-2"
            >
              ✕
            </button>
          </div>
        ))}
        <button type="button" onClick={stepsEditor.add} className="text-xs text-cr-blue">
          ＋ ステップを追加
        </button>
      </fieldset>

      {/* 必要書類 */}
      <fieldset className="rounded-md border border-border p-2 sm:p-3 space-y-2 w-full box-border">
        <legend className="px-1 text-xs font-bold text-ink-mid">必要書類</legend>
        {documents.map((doc, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              value={doc}
              onChange={(e) => updateStringAt("documents", documents, i, e.target.value)}
              className="flex-1 rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={() => removeStringAt("documents", documents, i)}
              className="text-cr-red text-xs"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => updateMeta("documents", [...documents, ""])}
          className="text-xs text-cr-blue"
        >
          ＋ 書類を追加
        </button>
      </fieldset>

      {/* 注意事項 */}
      <fieldset className="rounded-md border border-border p-2 sm:p-3 space-y-2 w-full box-border">
        <legend className="px-1 text-xs font-bold text-ink-mid">注意事項</legend>
        {notes.map((note, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              value={note}
              onChange={(e) => updateStringAt("notes", notes, i, e.target.value)}
              className="flex-1 rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={() => removeStringAt("notes", notes, i)}
              className="text-cr-red text-xs"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => updateMeta("notes", [...notes, ""])}
          className="text-xs text-cr-blue"
        >
          ＋ 注意事項を追加
        </button>
      </fieldset>
    </>
  );
}
