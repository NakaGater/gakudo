"use client";

import Image from "next/image";
import { useState } from "react";
import { useArrayEditor } from "@/components/forms/use-array-editor";
import type { MetaFieldsProps, ScheduleItem, FacilityItem, StaffMember } from "./types";

export function AboutMetaFields({ meta, updateMeta }: MetaFieldsProps) {
  const schedule = (meta.schedule as ScheduleItem[]) ?? [];
  const facilityInfo = (meta.facility_info as FacilityItem[]) ?? [];

  const scheduleEditor = useArrayEditor<ScheduleItem>(
    schedule,
    (next) => updateMeta("schedule", next),
    { time: "", label: "", emoji: "" },
  );
  const facilityEditor = useArrayEditor<FacilityItem>(
    facilityInfo,
    (next) => updateMeta("facility_info", next),
    { label: "", value: "" },
  );

  return (
    <>
      {/* 理念セクション */}
      <fieldset className="border border-border rounded-md p-2 sm:p-4 w-full box-border">
        <legend className="text-sm font-bold text-fg px-2">理念セクション</legend>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-fg-muted">セクション見出し</label>
            <input
              type="text"
              value={(meta.vision_heading as string) ?? "私たちの想い"}
              onChange={(e) => updateMeta("vision_heading", e.target.value)}
              className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-fg-muted">絵文字</label>
              <input
                type="text"
                value={(meta.vision_emoji as string) ?? "🏠"}
                onChange={(e) => updateMeta("vision_emoji", e.target.value)}
                className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm text-center"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-fg-muted">キャッチコピー</label>
              <input
                type="text"
                value={(meta.vision_tagline as string) ?? "家庭のようなあたたかさ"}
                onChange={(e) => updateMeta("vision_tagline", e.target.value)}
                className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
              />
            </div>
          </div>
        </div>
      </fieldset>

      {/* 1日の流れ */}
      <fieldset className="border border-border rounded-md p-2 sm:p-4 w-full box-border">
        <legend className="text-sm font-bold text-fg px-2">1日の流れ</legend>
        <div className="flex flex-col gap-3">
          {scheduleEditor.items.map((item, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="絵文字"
                  value={item.emoji}
                  onChange={(e) => scheduleEditor.update(idx, { emoji: e.target.value })}
                  className="w-14 rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm text-center"
                />
                <input
                  type="text"
                  placeholder="時間"
                  value={item.time}
                  onChange={(e) => scheduleEditor.update(idx, { time: e.target.value })}
                  className="w-20 rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => scheduleEditor.remove(idx)}
                  className="text-danger hover:text-danger/80 text-sm px-2 sm:hidden shrink-0"
                >
                  ✕
                </button>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  placeholder="内容"
                  value={item.label}
                  onChange={(e) => scheduleEditor.update(idx, { label: e.target.value })}
                  className="flex-1 rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => scheduleEditor.remove(idx)}
                  className="text-danger hover:text-danger/80 text-sm px-2 hidden sm:inline shrink-0"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={scheduleEditor.add}
            className="self-start text-sm text-accent hover:text-accent-hv"
          >
            ＋ 追加
          </button>
        </div>
      </fieldset>

      {/* 施設概要 */}
      <fieldset className="border border-border rounded-md p-2 sm:p-4 w-full box-border">
        <legend className="text-sm font-bold text-fg px-2">施設概要</legend>
        <div className="flex flex-col gap-3">
          {facilityEditor.items.map((item, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2">
              <input
                type="text"
                placeholder="項目名"
                value={item.label}
                onChange={(e) => facilityEditor.update(idx, { label: e.target.value })}
                className="w-full sm:w-32 rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
              />
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  placeholder="値"
                  value={item.value}
                  onChange={(e) => facilityEditor.update(idx, { value: e.target.value })}
                  className="flex-1 rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => facilityEditor.remove(idx)}
                  className="text-danger hover:text-danger/80 text-sm px-2 shrink-0"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={facilityEditor.add}
            className="self-start text-sm text-accent hover:text-accent-hv"
          >
            ＋ 追加
          </button>
        </div>
      </fieldset>

      {/* 職員紹介 */}
      <StaffMetaFields meta={meta} updateMeta={updateMeta} />
    </>
  );
}

/* ================================================================
   職員紹介セクション（About ページ内で使用）
   ================================================================ */
function StaffMetaFields({ meta, updateMeta }: MetaFieldsProps) {
  const staff = (meta.staff_members as StaffMember[]) ?? [];
  const [uploading, setUploading] = useState<number | null>(null);

  const editor = useArrayEditor<StaffMember>(
    staff,
    (next) => updateMeta("staff_members", next),
    { name: "", role: "", photo_url: "", profile: "" },
  );

  const moveStaff = (idx: number, dir: -1 | 1) => {
    const next = [...staff];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target]!, next[idx]!];
    editor.set(next);
  };

  const handlePhotoUpload = async (idx: number, file: File) => {
    setUploading(idx);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `staff/${Date.now()}-${idx}.${ext}`;
      const { error } = await supabase.storage.from("photos").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("photos").getPublicUrl(path);
      editor.update(idx, { photo_url: data.publicUrl });
    } catch (err) {
      console.error("写真アップロードエラー:", err);
      alert("写真のアップロードに失敗しました");
    } finally {
      setUploading(null);
    }
  };

  return (
    <fieldset className="border border-border rounded-md p-2 sm:p-4 w-full box-border">
      <legend className="text-sm font-bold text-fg px-2">職員紹介</legend>
      <div className="flex flex-col gap-4">
        {editor.items.map((member, idx) => (
          <div
            key={idx}
            className="border border-border/50 rounded-md p-3 flex flex-col gap-3 bg-bg-elev/50"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-fg-muted">職員 {idx + 1}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveStaff(idx, -1)}
                  disabled={idx === 0}
                  className="text-fg-muted hover:text-fg disabled:opacity-30 text-sm px-1"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveStaff(idx, 1)}
                  disabled={idx === editor.items.length - 1}
                  className="text-fg-muted hover:text-fg disabled:opacity-30 text-sm px-1"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => editor.remove(idx)}
                  className="text-danger hover:text-danger/80 text-sm px-2"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-fg-muted">名前</label>
                <input
                  type="text"
                  value={member.name}
                  onChange={(e) => editor.update(idx, { name: e.target.value })}
                  placeholder="山田太郎"
                  className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-fg-muted">役職</label>
                <input
                  type="text"
                  value={member.role}
                  onChange={(e) => editor.update(idx, { role: e.target.value })}
                  placeholder="施設長"
                  className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-fg-muted">写真</label>
              <div className="flex items-center gap-3">
                {member.photo_url && (
                  <Image
                    src={member.photo_url}
                    alt={member.name || "職員写真"}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full object-cover border border-border"
                  />
                )}
                <label className="cursor-pointer text-sm text-accent hover:text-accent-hv">
                  {uploading === idx
                    ? "アップロード中..."
                    : member.photo_url
                      ? "写真を変更"
                      : "写真を選択"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePhotoUpload(idx, file);
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-fg-muted">プロフィール</label>
              <textarea
                value={member.profile}
                onChange={(e) => editor.update(idx, { profile: e.target.value })}
                placeholder="自己紹介文..."
                rows={3}
                className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm resize-y"
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={editor.add}
          className="self-start text-sm text-accent hover:text-accent-hv"
        >
          ＋ 職員を追加
        </button>
      </div>
    </fieldset>
  );
}
