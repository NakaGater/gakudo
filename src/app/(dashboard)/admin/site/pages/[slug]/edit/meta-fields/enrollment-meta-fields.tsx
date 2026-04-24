"use client";

import type { MetaFieldsWithSetterProps } from "./types";

export function EnrollmentMetaFields({
  meta,
  setMeta,
}: MetaFieldsWithSetterProps) {
  const eligibility = (meta.eligibility as { target: string; capacity: string }) || { target: "", capacity: "" };
  const hours = (meta.hours as Array<{ label: string; time: string }>) || [];
  const fees = (meta.fees as Array<{ label: string; amount: string; note: string }>) || [];
  const siblingFees = (meta.sibling_fees as Array<{ label: string; amount: string; note: string }>) || [];
  const steps = (meta.steps as Array<{ emoji: string; title: string; description: string }>) || [];
  const documents = (meta.documents as string[]) || [];
  const notes = (meta.notes as string[]) || [];

  return (
    <>
      {/* 対象・定員 */}
      <fieldset className="rounded-md border border-border p-2 sm:p-3 space-y-2 overflow-hidden">
        <legend className="px-1 text-xs font-bold text-ink-mid">対象・定員</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-ink-light">対象</label>
            <input
              value={eligibility.target}
              onChange={(e) => setMeta((m) => ({ ...m, eligibility: { ...eligibility, target: e.target.value } }))}
              className="w-full rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] text-ink-light">定員</label>
            <input
              value={eligibility.capacity}
              onChange={(e) => setMeta((m) => ({ ...m, eligibility: { ...eligibility, capacity: e.target.value } }))}
              className="w-full rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
            />
          </div>
        </div>
      </fieldset>

      {/* 開所時間 */}
      <fieldset className="rounded-md border border-border p-2 sm:p-3 space-y-2 overflow-hidden">
        <legend className="px-1 text-xs font-bold text-ink-mid">開所時間</legend>
        {hours.map((h, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              value={h.label}
              onChange={(e) => {
                const updated = [...hours];
                updated[i] = { ...h, label: e.target.value };
                setMeta((m) => ({ ...m, hours: updated }));
              }}
              placeholder="平日"
              className="w-1/3 rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
            />
            <input
              value={h.time}
              onChange={(e) => {
                const updated = [...hours];
                updated[i] = { ...h, time: e.target.value };
                setMeta((m) => ({ ...m, hours: updated }));
              }}
              placeholder="放課後〜19:00"
              className="flex-1 rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
            />
            <button type="button" onClick={() => setMeta((m) => ({ ...m, hours: hours.filter((_, j) => j !== i) }))} className="text-cr-red text-xs">✕</button>
          </div>
        ))}
        <button type="button" onClick={() => setMeta((m) => ({ ...m, hours: [...hours, { label: "", time: "" }] }))} className="text-xs text-cr-blue">＋ 時間帯を追加</button>
      </fieldset>

      {/* 料金（学年別） */}
      <fieldset className="rounded-md border border-border p-2 sm:p-3 space-y-2 overflow-hidden">
        <legend className="px-1 text-xs font-bold text-ink-mid">料金（学年別）</legend>
        {fees.map((f, i) => (
          <div key={i} className="flex flex-col sm:flex-row gap-2 sm:items-center min-w-0">
            <div className="flex gap-2 items-center min-w-0">
              <input
                value={f.label}
                onChange={(e) => { const u = [...fees]; u[i] = { ...f, label: e.target.value }; setMeta((m) => ({ ...m, fees: u })); }}
                placeholder="低学年"
                className="flex-1 min-w-0 rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
              />
              <input
                value={f.amount}
                onChange={(e) => { const u = [...fees]; u[i] = { ...f, amount: e.target.value }; setMeta((m) => ({ ...m, fees: u })); }}
                placeholder="15,000円/月"
                className="w-28 shrink-0 rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
              />
            </div>
            <div className="flex gap-2 items-center flex-1 min-w-0">
              <input
                value={f.note}
                onChange={(e) => { const u = [...fees]; u[i] = { ...f, note: e.target.value }; setMeta((m) => ({ ...m, fees: u })); }}
                placeholder="備考"
                className="flex-1 min-w-0 rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
              />
              <button type="button" onClick={() => setMeta((m) => ({ ...m, fees: fees.filter((_, j) => j !== i) }))} className="text-cr-red text-xs shrink-0">✕</button>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => setMeta((m) => ({ ...m, fees: [...fees, { label: "", amount: "", note: "" }] }))} className="text-xs text-cr-blue">＋ 料金を追加</button>
      </fieldset>

      {/* 兄弟割引料金 */}
      <fieldset className="rounded-md border border-border p-2 sm:p-3 space-y-2 overflow-hidden">
        <legend className="px-1 text-xs font-bold text-ink-mid">兄弟割引料金</legend>
        {siblingFees.map((f, i) => (
          <div key={i} className="flex flex-col sm:flex-row gap-2 sm:items-center min-w-0">
            <div className="flex gap-2 items-center min-w-0">
              <input
                value={f.label}
                onChange={(e) => { const u = [...siblingFees]; u[i] = { ...f, label: e.target.value }; setMeta((m) => ({ ...m, sibling_fees: u })); }}
                placeholder="2人目（低学年）"
                className="flex-1 min-w-0 rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
              />
              <input
                value={f.amount}
                onChange={(e) => { const u = [...siblingFees]; u[i] = { ...f, amount: e.target.value }; setMeta((m) => ({ ...m, sibling_fees: u })); }}
                placeholder="12,000円/月"
                className="w-28 shrink-0 rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
              />
            </div>
            <div className="flex gap-2 items-center flex-1 min-w-0">
              <input
                value={f.note}
                onChange={(e) => { const u = [...siblingFees]; u[i] = { ...f, note: e.target.value }; setMeta((m) => ({ ...m, sibling_fees: u })); }}
                placeholder="備考"
                className="flex-1 min-w-0 rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
              />
              <button type="button" onClick={() => setMeta((m) => ({ ...m, sibling_fees: siblingFees.filter((_, j) => j !== i) }))} className="text-cr-red text-xs shrink-0">✕</button>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => setMeta((m) => ({ ...m, sibling_fees: [...siblingFees, { label: "", amount: "", note: "" }] }))} className="text-xs text-cr-blue">＋ 兄弟割引を追加</button>
      </fieldset>

      {/* 入所の流れ */}
      <fieldset className="rounded-md border border-border p-2 sm:p-3 space-y-2 overflow-hidden">
        <legend className="px-1 text-xs font-bold text-ink-mid">入所の流れ（ステップ）</legend>
        {steps.map((s, i) => (
          <div key={i} className="flex gap-2 items-start">
            <input
              value={s.emoji}
              onChange={(e) => { const u = [...steps]; u[i] = { ...s, emoji: e.target.value }; setMeta((m) => ({ ...m, steps: u })); }}
              className="w-12 rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm text-center"
            />
            <div className="flex-1 space-y-1">
              <input
                value={s.title}
                onChange={(e) => { const u = [...steps]; u[i] = { ...s, title: e.target.value }; setMeta((m) => ({ ...m, steps: u })); }}
                placeholder="タイトル"
                className="w-full rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
              />
              <textarea
                value={s.description}
                onChange={(e) => { const u = [...steps]; u[i] = { ...s, description: e.target.value }; setMeta((m) => ({ ...m, steps: u })); }}
                placeholder="説明"
                rows={2}
                className="w-full rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm resize-y"
              />
            </div>
            <button type="button" onClick={() => setMeta((m) => ({ ...m, steps: steps.filter((_, j) => j !== i) }))} className="text-cr-red text-xs mt-2">✕</button>
          </div>
        ))}
        <button type="button" onClick={() => setMeta((m) => ({ ...m, steps: [...steps, { emoji: "📌", title: "", description: "" }] }))} className="text-xs text-cr-blue">＋ ステップを追加</button>
      </fieldset>

      {/* 必要書類 */}
      <fieldset className="rounded-md border border-border p-2 sm:p-3 space-y-2 overflow-hidden">
        <legend className="px-1 text-xs font-bold text-ink-mid">必要書類</legend>
        {documents.map((doc, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              value={doc}
              onChange={(e) => { const u = [...documents]; u[i] = e.target.value; setMeta((m) => ({ ...m, documents: u })); }}
              className="flex-1 rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
            />
            <button type="button" onClick={() => setMeta((m) => ({ ...m, documents: documents.filter((_, j) => j !== i) }))} className="text-cr-red text-xs">✕</button>
          </div>
        ))}
        <button type="button" onClick={() => setMeta((m) => ({ ...m, documents: [...documents, ""] }))} className="text-xs text-cr-blue">＋ 書類を追加</button>
      </fieldset>

      {/* 注意事項 */}
      <fieldset className="rounded-md border border-border p-2 sm:p-3 space-y-2 overflow-hidden">
        <legend className="px-1 text-xs font-bold text-ink-mid">注意事項</legend>
        {notes.map((note, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              value={note}
              onChange={(e) => { const u = [...notes]; u[i] = e.target.value; setMeta((m) => ({ ...m, notes: u })); }}
              className="flex-1 rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
            />
            <button type="button" onClick={() => setMeta((m) => ({ ...m, notes: notes.filter((_, j) => j !== i) }))} className="text-cr-red text-xs">✕</button>
          </div>
        ))}
        <button type="button" onClick={() => setMeta((m) => ({ ...m, notes: [...notes, ""] }))} className="text-xs text-cr-blue">＋ 注意事項を追加</button>
      </fieldset>
    </>
  );
}
