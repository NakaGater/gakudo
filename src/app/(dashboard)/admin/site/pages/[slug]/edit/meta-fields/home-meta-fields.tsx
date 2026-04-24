"use client";

import { FEATURE_ICONS, FEATURE_ICON_KEYS } from "@/config/feature-icons";
import type { MetaFieldsProps } from "./types";

export function HomeMetaFields({
  meta,
  updateMeta,
}: MetaFieldsProps) {
  type FeatureItem = { icon: string; title: string; description: string };
  const features = (meta.features as FeatureItem[]) ?? [];

  const updateFeatureItem = (idx: number, field: keyof FeatureItem, value: string) => {
    const updated = [...features];
    updated[idx] = { ...updated[idx], [field]: value };
    updateMeta("features", updated);
  };

  const addFeatureItem = () => {
    updateMeta("features", [...features, { icon: "Star", title: "", description: "" }]);
  };

  const removeFeatureItem = (idx: number) => {
    updateMeta("features", features.filter((_, i) => i !== idx));
  };

  return (
    <>
      <fieldset className="border border-border rounded-md p-4">
        <legend className="text-sm font-bold text-fg px-2">ヒーローセクション</legend>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-fg-muted">メインタイトル（改行で行分割）</label>
            <textarea
              value={(meta.hero_title as string) ?? "子どもたちの\n笑顔あふれる\n放課後を"}
              onChange={(e) => updateMeta("hero_title", e.target.value)}
              rows={3}
              className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm resize-y"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-fg-muted">強調キーワード（クレヨン下線）</label>
            <input
              type="text"
              value={(meta.hero_emphasis as string) ?? "笑顔あふれる"}
              onChange={(e) => updateMeta("hero_emphasis", e.target.value)}
              className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="border border-border rounded-md p-4">
        <legend className="text-sm font-bold text-fg px-2">特徴セクション</legend>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-fg-muted">セクション見出し</label>
            <input
              type="text"
              value={(meta.features_heading as string) ?? "施設の特徴"}
              onChange={(e) => updateMeta("features_heading", e.target.value)}
              className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-fg-muted">セクション説明</label>
            <input
              type="text"
              value={(meta.features_subtitle as string) ?? ""}
              onChange={(e) => updateMeta("features_subtitle", e.target.value)}
              className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="border border-border rounded-md p-4">
        <legend className="text-sm font-bold text-fg px-2">特徴カード</legend>
        <div className="flex flex-col gap-4">
          {features.map((item, idx) => (
            <div key={idx} className="flex flex-col gap-2 p-3 border border-border/50 rounded-md bg-bg">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  {(() => {
                    const entry = FEATURE_ICONS[item.icon];
                    const Icon = entry?.component;
                    return Icon ? <Icon size={16} strokeWidth={1.75} /> : null;
                  })()}
                  <select
                    value={item.icon}
                    onChange={(e) => updateFeatureItem(idx, "icon", e.target.value)}
                    className="w-28 rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
                  >
                    {FEATURE_ICON_KEYS.map((key) => (
                      <option key={key} value={key}>
                        {FEATURE_ICONS[key].label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => removeFeatureItem(idx)}
                  className="text-danger hover:text-danger/80 text-sm px-2 shrink-0"
                >
                  ✕
                </button>
              </div>
              <input
                type="text"
                placeholder="タイトル"
                value={item.title}
                onChange={(e) => updateFeatureItem(idx, "title", e.target.value)}
                className="w-full rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
              />
              <textarea
                placeholder="説明文"
                value={item.description}
                onChange={(e) => updateFeatureItem(idx, "description", e.target.value)}
                rows={2}
                className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm resize-y"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={addFeatureItem}
            className="self-start text-sm text-accent hover:text-accent-hv"
          >
            ＋ 追加
          </button>
        </div>
      </fieldset>

      <fieldset className="border border-border rounded-md p-4">
        <legend className="text-sm font-bold text-fg px-2">アクセス情報</legend>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-fg-muted">所在地</label>
            <textarea
              value={(meta.access_address as string) ?? ""}
              onChange={(e) => updateMeta("access_address", e.target.value)}
              rows={2}
              className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm resize-y"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-fg-muted">アクセスセクション説明</label>
            <input
              type="text"
              value={(meta.access_subtitle as string) ?? ""}
              onChange={(e) => updateMeta("access_subtitle", e.target.value)}
              className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-fg-muted">電話番号</label>
              <input
                type="text"
                value={(meta.access_phone as string) ?? ""}
                onChange={(e) => updateMeta("access_phone", e.target.value)}
                className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-fg-muted">電話受付時間</label>
              <input
                type="text"
                value={(meta.access_phone_hours as string) ?? ""}
                onChange={(e) => updateMeta("access_phone_hours", e.target.value)}
                className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-fg-muted">開所時間</label>
            <textarea
              value={(meta.access_opening_hours as string) ?? ""}
              onChange={(e) => updateMeta("access_opening_hours", e.target.value)}
              rows={2}
              className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm resize-y"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-fg-muted">見学案内の見出し</label>
            <input
              type="text"
              value={(meta.access_visit_heading as string) ?? ""}
              onChange={(e) => updateMeta("access_visit_heading", e.target.value)}
              className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-fg-muted">見学案内のテキスト</label>
            <textarea
              value={(meta.access_visit_text as string) ?? ""}
              onChange={(e) => updateMeta("access_visit_text", e.target.value)}
              rows={3}
              className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm resize-y"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-fg-muted">Google Maps 埋め込みURL</label>
            <input
              type="url"
              value={(meta.access_map_embed_url as string) ?? ""}
              onChange={(e) => updateMeta("access_map_embed_url", e.target.value)}
              placeholder="https://www.google.com/maps/embed?pb=..."
              className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
            />
            <p className="text-[10px] text-fg-muted">
              Google Mapsで「共有→地図を埋め込む」からiframeのsrc URLをコピーして貼り付け
            </p>
          </div>
        </div>
      </fieldset>
    </>
  );
}
