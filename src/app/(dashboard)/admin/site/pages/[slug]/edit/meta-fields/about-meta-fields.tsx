"use client";

import { useState } from "react";
import type { MetaFieldsProps, ScheduleItem, FacilityItem, StaffMember } from "./types";

export function AboutMetaFields({
  meta,
  updateMeta,
}: MetaFieldsProps) {
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
      {/* 理念セクション */}
      <fieldset className="border border-border rounded-md p-2 sm:p-4 overflow-hidden">
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
      <fieldset className="border border-border rounded-md p-2 sm:p-4 overflow-hidden">
        <legend className="text-sm font-bold text-fg px-2">1日の流れ</legend>
        <div className="flex flex-col gap-3">
          {schedule.map((item, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center gap-2">
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
                <button
                  type="button"
                  onClick={() => removeScheduleItem(idx)}
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
                  onChange={(e) => updateScheduleItem(idx, "label", e.target.value)}
                  className="flex-1 rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeScheduleItem(idx)}
                  className="text-danger hover:text-danger/80 text-sm px-2 hidden sm:inline shrink-0"
                >
                  ✕
                </button>
              </div>
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
      <fieldset className="border border-border rounded-md p-2 sm:p-4 overflow-hidden">
        <legend className="text-sm font-bold text-fg px-2">施設概要</legend>
        <div className="flex flex-col gap-3">
          {facilityInfo.map((item, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2">
              <input
                type="text"
                placeholder="項目名"
                value={item.label}
                onChange={(e) => updateFacilityItem(idx, "label", e.target.value)}
                className="w-full sm:w-32 rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
              />
              <div className="flex items-center gap-2 flex-1">
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
                  className="text-danger hover:text-danger/80 text-sm px-2 shrink-0"
                >
                  ✕
                </button>
              </div>
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

      {/* 職員紹介 */}
      <StaffMetaFields meta={meta} updateMeta={updateMeta} />
    </>
  );
}

/* ================================================================
   職員紹介セクション（About ページ内で使用）
   ================================================================ */
function StaffMetaFields({
  meta,
  updateMeta,
}: MetaFieldsProps) {
  const staff = (meta.staff_members as StaffMember[]) ?? [];
  const [uploading, setUploading] = useState<number | null>(null);

  const updateStaff = (idx: number, key: keyof StaffMember, value: string) => {
    const next = staff.map((s, i) => (i === idx ? { ...s, [key]: value } : s));
    updateMeta("staff_members", next);
  };

  const addStaff = () => {
    updateMeta("staff_members", [
      ...staff,
      { name: "", role: "", photo_url: "", profile: "" },
    ]);
  };

  const removeStaff = (idx: number) => {
    updateMeta(
      "staff_members",
      staff.filter((_, i) => i !== idx),
    );
  };

  const moveStaff = (idx: number, dir: -1 | 1) => {
    const next = [...staff];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    updateMeta("staff_members", next);
  };

  const handlePhotoUpload = async (idx: number, file: File) => {
    setUploading(idx);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `staff/${Date.now()}-${idx}.${ext}`;
      const { error } = await supabase.storage
        .from("photos")
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("photos").getPublicUrl(path);
      updateStaff(idx, "photo_url", data.publicUrl);
    } catch (err) {
      console.error("写真アップロードエラー:", err);
      alert("写真のアップロードに失敗しました");
    } finally {
      setUploading(null);
    }
  };

  return (
    <fieldset className="border border-border rounded-md p-2 sm:p-4 overflow-hidden">
      <legend className="text-sm font-bold text-fg px-2">職員紹介</legend>
      <div className="flex flex-col gap-4">
        {staff.map((member, idx) => (
          <div
            key={idx}
            className="border border-border/50 rounded-md p-3 flex flex-col gap-3 bg-bg-elev/50"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-fg-muted">
                職員 {idx + 1}
              </span>
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
                  disabled={idx === staff.length - 1}
                  className="text-fg-muted hover:text-fg disabled:opacity-30 text-sm px-1"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeStaff(idx)}
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
                  onChange={(e) => updateStaff(idx, "name", e.target.value)}
                  placeholder="山田太郎"
                  className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-fg-muted">役職</label>
                <input
                  type="text"
                  value={member.role}
                  onChange={(e) => updateStaff(idx, "role", e.target.value)}
                  placeholder="施設長"
                  className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-fg-muted">写真</label>
              <div className="flex items-center gap-3">
                {member.photo_url && (
                  <img
                    src={member.photo_url}
                    alt={member.name || "職員写真"}
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
              <label className="text-xs font-medium text-fg-muted">
                プロフィール
              </label>
              <textarea
                value={member.profile}
                onChange={(e) => updateStaff(idx, "profile", e.target.value)}
                placeholder="自己紹介文..."
                rows={3}
                className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm resize-y"
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addStaff}
          className="self-start text-sm text-accent hover:text-accent-hv"
        >
          ＋ 職員を追加
        </button>
      </div>
    </fieldset>
  );
}
