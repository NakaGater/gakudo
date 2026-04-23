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
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {(() => {
                    const entry = FEATURE_ICONS[item.icon];
                    const Icon = entry?.component;
                    return Icon ? <Icon size={16} strokeWidth={1.75} /> : null;
                  })()}
                  <select
                    value={item.icon}
                    onChange={(e) => updateFeatureItem(idx, "icon", e.target.value)}
                    className="w-32 rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
                  >
                    {FEATURE_ICON_KEYS.map((key) => (
                      <option key={key} value={key}>
                        {FEATURE_ICONS[key].label}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="タイトル"
                  value={item.title}
                  onChange={(e) => updateFeatureItem(idx, "title", e.target.value)}
                  className="flex-1 rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeFeatureItem(idx)}
                  className="text-danger hover:text-danger/80 text-sm px-2"
                >
                  ✕
                </button>
              </div>
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
    </>
  );
}
