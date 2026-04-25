"use client";

import { useMemo, useState } from "react";
import type { RecipientAudience } from "@/lib/announcements/recipients";
import type { SelectableParent } from "@/lib/announcements/recipients-server";

interface Props {
  parents: SelectableParent[];
  /** バリデーションエラー（サーバから返す） */
  error?: string;
  disabled?: boolean;
}

/**
 * 送信対象の選択 UI。
 *
 * - 「全員」を選ぶと audience=all のみが送信され、選択された個別ユーザーは
 *   非送信（フォーム送信時に hidden input をレンダリングしないため）。
 * - 「個別選択」を選ぶと audience=user で、チェック済みのユーザーIDが
 *   userIds[] として送信される。
 */
export function RecipientPicker({ parents, error, disabled }: Props) {
  const [audience, setAudience] = useState<RecipientAudience>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return parents;
    return parents.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.childrenLabel.toLowerCase().includes(q),
    );
  }, [parents, query]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-fg">送信対象</span>

      <div className="flex flex-col gap-2 rounded-sm border border-border bg-bg-elev p-3">
        <label className="flex items-center gap-2 text-sm text-fg cursor-pointer">
          <input
            type="radio"
            name="audience"
            value="all"
            checked={audience === "all"}
            onChange={() => setAudience("all")}
            disabled={disabled}
          />
          全員（全保護者に一斉送信）
        </label>
        <label className="flex items-center gap-2 text-sm text-fg cursor-pointer">
          <input
            type="radio"
            name="audience"
            value="user"
            checked={audience === "user"}
            onChange={() => setAudience("user")}
            disabled={disabled}
          />
          個別選択（特定の保護者のみに送信）
        </label>
      </div>

      {audience === "user" && (
        <div className="flex flex-col gap-2 rounded-sm border border-border bg-bg-elev p-3">
          <input
            type="search"
            placeholder="名前・メール・お子さん名で検索"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={disabled}
            className="w-full rounded-sm border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none disabled:opacity-50"
          />

          <div className="text-xs text-fg-muted">
            {selected.size > 0 ? `${selected.size}人を選択中` : "1人以上選択してください"}
          </div>

          <div className="max-h-72 overflow-y-auto flex flex-col gap-1">
            {filtered.length === 0 ? (
              <p className="text-sm text-fg-muted py-4 text-center">
                該当する保護者が見つかりません
              </p>
            ) : (
              filtered.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-bg cursor-pointer"
                >
                  <input
                    type="checkbox"
                    name="userIds"
                    value={p.id}
                    checked={selected.has(p.id)}
                    onChange={() => toggle(p.id)}
                    disabled={disabled}
                  />
                  <span className="flex-1 text-sm text-fg">{p.name}</span>
                  {p.childrenLabel && (
                    <span className="text-xs text-fg-muted">{p.childrenLabel}</span>
                  )}
                </label>
              ))
            )}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
