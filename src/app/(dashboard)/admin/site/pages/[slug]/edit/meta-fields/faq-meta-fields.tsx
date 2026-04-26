"use client";

import { useArrayEditor } from "@/components/forms/use-array-editor";
import type { MetaFieldsProps } from "./types";

type Question = { q: string; a: string };

export function FaqMetaFields({ meta, updateMeta }: MetaFieldsProps) {
  const questions = (meta.questions as Question[]) ?? [];
  const editor = useArrayEditor<Question>(questions, (next) => updateMeta("questions", next), {
    q: "",
    a: "",
  });

  const moveQuestion = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= questions.length) return;
    const updated = [...questions];
    [updated[index], updated[newIndex]] = [updated[newIndex]!, updated[index]!];
    editor.set(updated);
  };

  return (
    <fieldset className="border border-border rounded-md p-2 sm:p-4 w-full box-border">
      <legend className="text-sm font-bold text-fg px-2">Q&A 項目</legend>
      <div className="flex flex-col gap-4">
        {editor.items.map((item, i) => (
          <div key={i} className="rounded-md border border-border p-3 bg-bg-elev/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-fg-muted">質問 {i + 1}</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => moveQuestion(i, -1)}
                  disabled={i === 0}
                  className="text-xs px-1.5 py-0.5 rounded border border-border hover:bg-bg-elev disabled:opacity-30 cursor-pointer disabled:cursor-default"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveQuestion(i, 1)}
                  disabled={i === editor.items.length - 1}
                  className="text-xs px-1.5 py-0.5 rounded border border-border hover:bg-bg-elev disabled:opacity-30 cursor-pointer disabled:cursor-default"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => editor.remove(i)}
                  className="text-xs px-1.5 py-0.5 rounded border border-red-300 text-red-600 hover:bg-red-50 cursor-pointer"
                >
                  削除
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={item.q}
                onChange={(e) => editor.update(i, { q: e.target.value })}
                placeholder="質問を入力"
                className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
              />
              <textarea
                value={item.a}
                onChange={(e) => editor.update(i, { a: e.target.value })}
                placeholder="回答を入力"
                rows={2}
                className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm resize-y"
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={editor.add}
          className="self-start text-sm px-3 py-1.5 rounded-md border-2 border-dashed border-border text-fg-muted hover:border-fg-muted hover:text-fg transition-colors cursor-pointer"
        >
          ＋ 質問を追加
        </button>
      </div>
    </fieldset>
  );
}
