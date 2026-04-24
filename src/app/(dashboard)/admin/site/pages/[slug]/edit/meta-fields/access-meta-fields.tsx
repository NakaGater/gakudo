"use client";

import type { MetaFieldsProps } from "./types";

export function AccessMetaFields({
  meta,
  updateMeta,
}: MetaFieldsProps) {
  return (
    <fieldset className="border border-border rounded-md p-2 sm:p-4">
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
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-fg-muted">Google Maps 埋め込みURL</label>
          <input
            type="url"
            value={(meta.map_embed_url as string) ?? ""}
            onChange={(e) => updateMeta("map_embed_url", e.target.value)}
            placeholder="https://www.google.com/maps/embed?pb=..."
            className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
          />
          <p className="text-[10px] text-fg-muted">
            Google Mapsで「共有→地図を埋め込む」からiframeのsrc URLをコピーして貼り付け
          </p>
        </div>
      </div>
    </fieldset>
  );
}
