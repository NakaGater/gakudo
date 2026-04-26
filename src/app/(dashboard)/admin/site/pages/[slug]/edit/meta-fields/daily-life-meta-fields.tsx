"use client";

import { useArrayEditor } from "@/components/forms/use-array-editor";
import type { MetaFieldsProps } from "./types";

type Activity = { emoji: string; title: string; description: string };
type Event = { emoji: string; title: string; season: string };

export function DailyLifeMetaFields({ meta, updateMeta }: MetaFieldsProps) {
  const activities = (meta.activities as Activity[]) ?? [];
  const events = (meta.events as Event[]) ?? [];

  const activityEditor = useArrayEditor<Activity>(
    activities,
    (next) => updateMeta("activities", next),
    { emoji: "🎯", title: "", description: "" },
  );
  const eventEditor = useArrayEditor<Event>(
    events,
    (next) => updateMeta("events", next),
    { emoji: "🎉", title: "", season: "通年" },
  );

  return (
    <>
      <fieldset className="border border-border rounded-md p-2 sm:p-4 w-full box-border">
        <legend className="text-sm font-bold text-fg px-2">活動カード</legend>
        <div className="flex flex-col gap-4">
          {activityEditor.items.map((item, i) => (
            <div
              key={i}
              className="rounded-md border border-border p-2 sm:p-3 bg-bg-elev/50 min-w-0"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-fg-muted">活動 {i + 1}</span>
                <button
                  type="button"
                  onClick={() => activityEditor.remove(i)}
                  className="text-xs px-1.5 py-0.5 rounded border border-red-300 text-red-600 hover:bg-red-50 cursor-pointer"
                >
                  削除
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 min-w-0">
                  <input
                    type="text"
                    value={item.emoji}
                    onChange={(e) => activityEditor.update(i, { emoji: e.target.value })}
                    placeholder="絵文字"
                    className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm w-16 shrink-0"
                  />
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => activityEditor.update(i, { title: e.target.value })}
                    placeholder="活動名"
                    className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm flex-1 min-w-0"
                  />
                </div>
                <textarea
                  value={item.description}
                  onChange={(e) => activityEditor.update(i, { description: e.target.value })}
                  placeholder="説明"
                  rows={2}
                  className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm resize-y"
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={activityEditor.add}
            className="self-start text-sm px-3 py-1.5 rounded-md border-2 border-dashed border-border text-fg-muted hover:border-fg-muted hover:text-fg transition-colors cursor-pointer"
          >
            ＋ 活動を追加
          </button>
        </div>
      </fieldset>

      <fieldset className="border border-border rounded-md p-2 sm:p-4 w-full box-border">
        <legend className="text-sm font-bold text-fg px-2">季節の行事</legend>
        <div className="flex flex-col gap-3">
          {eventEditor.items.map((item, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={item.emoji}
                  onChange={(e) => eventEditor.update(i, { emoji: e.target.value })}
                  placeholder="絵文字"
                  className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm w-16"
                />
                <select
                  value={item.season}
                  onChange={(e) => eventEditor.update(i, { season: e.target.value })}
                  className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
                >
                  <option value="春">春</option>
                  <option value="夏">夏</option>
                  <option value="秋">秋</option>
                  <option value="冬">冬</option>
                  <option value="通年">通年</option>
                </select>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => eventEditor.update(i, { title: e.target.value })}
                  placeholder="行事名"
                  className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm flex-1"
                />
                <button
                  type="button"
                  onClick={() => eventEditor.remove(i)}
                  className="text-xs px-1.5 py-0.5 rounded border border-red-300 text-red-600 hover:bg-red-50 cursor-pointer shrink-0"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={eventEditor.add}
            className="self-start text-sm px-3 py-1.5 rounded-md border-2 border-dashed border-border text-fg-muted hover:border-fg-muted hover:text-fg transition-colors cursor-pointer"
          >
            ＋ 行事を追加
          </button>
        </div>
      </fieldset>

      <fieldset className="border border-border rounded-md p-2 sm:p-4 w-full box-border">
        <legend className="text-sm font-bold text-fg px-2">理念セクション</legend>
        <div className="flex flex-col gap-3">
          <div className="flex gap-2 min-w-0">
            <input
              type="text"
              value={(meta.philosophy_emoji as string) ?? "🤝"}
              onChange={(e) => updateMeta("philosophy_emoji", e.target.value)}
              placeholder="絵文字"
              className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm w-16 shrink-0"
            />
            <input
              type="text"
              value={(meta.philosophy_heading as string) ?? ""}
              onChange={(e) => updateMeta("philosophy_heading", e.target.value)}
              placeholder="見出し"
              className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm flex-1 min-w-0"
            />
          </div>
          <textarea
            value={(meta.philosophy_text as string) ?? ""}
            onChange={(e) => updateMeta("philosophy_text", e.target.value)}
            placeholder="理念テキスト"
            rows={4}
            className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm resize-y"
          />
        </div>
      </fieldset>
    </>
  );
}
