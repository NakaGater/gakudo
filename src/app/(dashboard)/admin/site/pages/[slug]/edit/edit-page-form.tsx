"use client";

import { useActionState, useState, useCallback } from "react";
import { Button, Input } from "@/components/ui";
import type { ActionState } from "@/lib/actions/types";
import { updateSitePage } from "../../../actions";
import { cn } from "@/lib/utils";
import { FEATURE_ICONS, FEATURE_ICON_KEYS } from "@/config/feature-icons";

type ScheduleItem = { time: string; label: string; emoji: string };
type FacilityItem = { label: string; value: string };
type StaffMember = { name: string; role: string; photo_url: string; profile: string };

type Props = {
  slug: string;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
};

export function EditPageForm({ slug, title, content, metadata }: Props) {
  const boundAction = updateSitePage.bind(null, slug);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    boundAction,
    null,
  );

  // Metadata state
  const [meta, setMeta] = useState<Record<string, unknown>>(metadata ?? {});

  const updateMeta = useCallback((key: string, value: unknown) => {
    setMeta((prev) => ({ ...prev, [key]: value }));
  }, []);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.message && (
        <div
          role="alert"
          className={cn(
            "rounded-md px-4 py-3 text-sm",
            state.success
              ? "bg-success/10 text-success"
              : "bg-danger/10 text-danger",
          )}
        >
          {state.message}
        </div>
      )}

      {/* hidden field for metadata JSON */}
      <input type="hidden" name="metadata" value={JSON.stringify(meta)} />

      <Input
        name="title"
        label="タイトル"
        defaultValue={title}
        required
      />

      {/* サブタイトル — 全ページ共通 */}
      <div className="flex flex-col gap-1">
        <label htmlFor="meta-subtitle" className="text-sm font-medium text-fg">
          サブタイトル
        </label>
        <input
          id="meta-subtitle"
          type="text"
          value={(meta.subtitle as string) ?? ""}
          onChange={(e) => updateMeta("subtitle", e.target.value)}
          className={cn(
            "w-full rounded-sm border border-border bg-bg-elev px-3 py-2 text-fg text-sm",
            "focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none",
          )}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="content" className="text-sm font-medium text-fg">
          本文
        </label>
        <textarea
          id="content"
          name="content"
          defaultValue={content}
          rows={10}
          className={cn(
            "w-full rounded-sm border border-border bg-bg-elev px-3 py-2 text-fg",
            "placeholder:text-fg-muted",
            "focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none",
            "resize-y font-mono text-sm leading-relaxed",
          )}
        />
      </div>

      {/* Home ページ固有フィールド */}
      {slug === "home" && (
        <HomeMetaFields meta={meta} updateMeta={updateMeta} />
      )}

      {/* About ページ固有フィールド */}
      {slug === "about" && (
        <AboutMetaFields meta={meta} updateMeta={updateMeta} />
      )}

      {/* FAQ ページ固有フィールド */}
      {slug === "faq" && (
        <FaqMetaFields meta={meta} setMeta={setMeta} />
      )}

      {/* 日々の生活ページ固有フィールド */}
      {slug === "daily-life" && (
        <DailyLifeMetaFields meta={meta} setMeta={setMeta} />
      )}

      {/* 入所案内ページ固有フィールド */}
      {slug === "enrollment" && (
        <EnrollmentMetaFields meta={meta} setMeta={setMeta} />
      )}

      <div className="flex justify-end">
        <Button type="submit" loading={isPending}>
          保存する
        </Button>
      </div>
    </form>
  );
}

/* ================================================================
   Home ページ: 施設の特徴
   ================================================================ */
function HomeMetaFields({
  meta,
  updateMeta,
}: {
  meta: Record<string, unknown>;
  updateMeta: (key: string, value: unknown) => void;
}) {
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

/* ================================================================
   About ページ: 1日の流れ + 施設概要
   ================================================================ */
function AboutMetaFields({
  meta,
  updateMeta,
}: {
  meta: Record<string, unknown>;
  updateMeta: (key: string, value: unknown) => void;
}) {
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
      <fieldset className="border border-border rounded-md p-4">
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
          <div className="grid grid-cols-2 gap-3">
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
      <fieldset className="border border-border rounded-md p-4">
        <legend className="text-sm font-bold text-fg px-2">1日の流れ</legend>
        <div className="flex flex-col gap-3">
          {schedule.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
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
                className="text-danger hover:text-danger/80 text-sm px-2"
              >
                ✕
              </button>
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
      <fieldset className="border border-border rounded-md p-4">
        <legend className="text-sm font-bold text-fg px-2">施設概要</legend>
        <div className="flex flex-col gap-3">
          {facilityInfo.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="項目名"
                value={item.label}
                onChange={(e) => updateFacilityItem(idx, "label", e.target.value)}
                className="w-32 rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
              />
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
                className="text-danger hover:text-danger/80 text-sm px-2"
              >
                ✕
              </button>
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
}: {
  meta: Record<string, unknown>;
  updateMeta: (key: string, value: unknown) => void;
}) {
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
    <fieldset className="border border-border rounded-md p-4">
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

            <div className="grid grid-cols-2 gap-3">
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

/* ================================================================
   Access ページ: 電話番号・受付時間・開所時間・見学案内
   ================================================================ */
function AccessMetaFields({
  meta,
  updateMeta,
}: {
  meta: Record<string, unknown>;
  updateMeta: (key: string, value: unknown) => void;
}) {
  return (
    <fieldset className="border border-border rounded-md p-4">
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

function FaqMetaFields({
  meta,
  setMeta,
}: {
  meta: Record<string, unknown>;
  setMeta: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
}) {
  const questions = (meta.questions as Array<{ q: string; a: string }>) || [];

  const updateQuestion = (index: number, field: "q" | "a", value: string) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setMeta((prev) => ({ ...prev, questions: updated }));
  };

  const addQuestion = () => {
    setMeta((prev) => ({
      ...prev,
      questions: [...questions, { q: "", a: "" }],
    }));
  };

  const removeQuestion = (index: number) => {
    setMeta((prev) => ({
      ...prev,
      questions: questions.filter((_, i) => i !== index),
    }));
  };

  const moveQuestion = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= questions.length) return;
    const updated = [...questions];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setMeta((prev) => ({ ...prev, questions: updated }));
  };

  return (
    <fieldset className="border border-border rounded-md p-4">
      <legend className="text-sm font-bold text-fg px-2">Q&A 項目</legend>
      <div className="flex flex-col gap-4">
        {questions.map((item, i) => (
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
                  disabled={i === questions.length - 1}
                  className="text-xs px-1.5 py-0.5 rounded border border-border hover:bg-bg-elev disabled:opacity-30 cursor-pointer disabled:cursor-default"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeQuestion(i)}
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
                onChange={(e) => updateQuestion(i, "q", e.target.value)}
                placeholder="質問を入力"
                className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
              />
              <textarea
                value={item.a}
                onChange={(e) => updateQuestion(i, "a", e.target.value)}
                placeholder="回答を入力"
                rows={2}
                className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm resize-y"
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addQuestion}
          className="self-start text-sm px-3 py-1.5 rounded-md border-2 border-dashed border-border text-fg-muted hover:border-fg-muted hover:text-fg transition-colors cursor-pointer"
        >
          ＋ 質問を追加
        </button>
      </div>
    </fieldset>
  );
}

function DailyLifeMetaFields({
  meta,
  setMeta,
}: {
  meta: Record<string, unknown>;
  setMeta: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
}) {
  const activities = (meta.activities as Array<{ emoji: string; title: string; description: string }>) || [];
  const events = (meta.events as Array<{ emoji: string; title: string; season: string }>) || [];

  const updateActivity = (index: number, field: string, value: string) => {
    const updated = [...activities];
    updated[index] = { ...updated[index], [field]: value };
    setMeta((prev) => ({ ...prev, activities: updated }));
  };

  const addActivity = () => {
    setMeta((prev) => ({
      ...prev,
      activities: [...activities, { emoji: "🎯", title: "", description: "" }],
    }));
  };

  const removeActivity = (index: number) => {
    setMeta((prev) => ({
      ...prev,
      activities: activities.filter((_, i) => i !== index),
    }));
  };

  const updateEvent = (index: number, field: string, value: string) => {
    const updated = [...events];
    updated[index] = { ...updated[index], [field]: value };
    setMeta((prev) => ({ ...prev, events: updated }));
  };

  const addEvent = () => {
    setMeta((prev) => ({
      ...prev,
      events: [...events, { emoji: "🎉", title: "", season: "通年" }],
    }));
  };

  const removeEvent = (index: number) => {
    setMeta((prev) => ({
      ...prev,
      events: events.filter((_, i) => i !== index),
    }));
  };

  const updateMeta = (key: string, value: unknown) => {
    setMeta((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <>
      <fieldset className="border border-border rounded-md p-4">
        <legend className="text-sm font-bold text-fg px-2">活動カード</legend>
        <div className="flex flex-col gap-4">
          {activities.map((item, i) => (
            <div key={i} className="rounded-md border border-border p-3 bg-bg-elev/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-fg-muted">活動 {i + 1}</span>
                <button
                  type="button"
                  onClick={() => removeActivity(i)}
                  className="text-xs px-1.5 py-0.5 rounded border border-red-300 text-red-600 hover:bg-red-50 cursor-pointer"
                >
                  削除
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={item.emoji}
                    onChange={(e) => updateActivity(i, "emoji", e.target.value)}
                    placeholder="絵文字"
                    className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm w-16"
                  />
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => updateActivity(i, "title", e.target.value)}
                    placeholder="活動名"
                    className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm flex-1"
                  />
                </div>
                <textarea
                  value={item.description}
                  onChange={(e) => updateActivity(i, "description", e.target.value)}
                  placeholder="説明"
                  rows={2}
                  className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm resize-y"
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addActivity}
            className="self-start text-sm px-3 py-1.5 rounded-md border-2 border-dashed border-border text-fg-muted hover:border-fg-muted hover:text-fg transition-colors cursor-pointer"
          >
            ＋ 活動を追加
          </button>
        </div>
      </fieldset>

      <fieldset className="border border-border rounded-md p-4">
        <legend className="text-sm font-bold text-fg px-2">季節の行事</legend>
        <div className="flex flex-col gap-3">
          {events.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={item.emoji}
                onChange={(e) => updateEvent(i, "emoji", e.target.value)}
                placeholder="絵文字"
                className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm w-16"
              />
              <input
                type="text"
                value={item.title}
                onChange={(e) => updateEvent(i, "title", e.target.value)}
                placeholder="行事名"
                className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm flex-1"
              />
              <select
                value={item.season}
                onChange={(e) => updateEvent(i, "season", e.target.value)}
                className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
              >
                <option value="春">春</option>
                <option value="夏">夏</option>
                <option value="秋">秋</option>
                <option value="冬">冬</option>
                <option value="通年">通年</option>
              </select>
              <button
                type="button"
                onClick={() => removeEvent(i)}
                className="text-xs px-1.5 py-0.5 rounded border border-red-300 text-red-600 hover:bg-red-50 cursor-pointer shrink-0"
              >
                削除
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addEvent}
            className="self-start text-sm px-3 py-1.5 rounded-md border-2 border-dashed border-border text-fg-muted hover:border-fg-muted hover:text-fg transition-colors cursor-pointer"
          >
            ＋ 行事を追加
          </button>
        </div>
      </fieldset>

      <fieldset className="border border-border rounded-md p-4">
        <legend className="text-sm font-bold text-fg px-2">理念セクション</legend>
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={(meta.philosophy_emoji as string) ?? "🤝"}
              onChange={(e) => updateMeta("philosophy_emoji", e.target.value)}
              placeholder="絵文字"
              className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm w-16"
            />
            <input
              type="text"
              value={(meta.philosophy_heading as string) ?? ""}
              onChange={(e) => updateMeta("philosophy_heading", e.target.value)}
              placeholder="見出し"
              className="rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm flex-1"
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

/* ================================================================
   Enrollment ページ: 入所案内・料金
   ================================================================ */
function EnrollmentMetaFields({
  meta,
  setMeta,
}: {
  meta: Record<string, unknown>;
  setMeta: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
}) {
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
      <fieldset className="rounded-md border border-border p-3 space-y-2">
        <legend className="px-1 text-xs font-bold text-ink-mid">対象・定員</legend>
        <div className="grid grid-cols-2 gap-2">
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
      <fieldset className="rounded-md border border-border p-3 space-y-2">
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
      <fieldset className="rounded-md border border-border p-3 space-y-2">
        <legend className="px-1 text-xs font-bold text-ink-mid">料金（学年別）</legend>
        {fees.map((f, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              value={f.label}
              onChange={(e) => { const u = [...fees]; u[i] = { ...f, label: e.target.value }; setMeta((m) => ({ ...m, fees: u })); }}
              placeholder="低学年"
              className="w-1/3 rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
            />
            <input
              value={f.amount}
              onChange={(e) => { const u = [...fees]; u[i] = { ...f, amount: e.target.value }; setMeta((m) => ({ ...m, fees: u })); }}
              placeholder="15,000円/月"
              className="w-1/4 rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
            />
            <input
              value={f.note}
              onChange={(e) => { const u = [...fees]; u[i] = { ...f, note: e.target.value }; setMeta((m) => ({ ...m, fees: u })); }}
              placeholder="備考"
              className="flex-1 rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
            />
            <button type="button" onClick={() => setMeta((m) => ({ ...m, fees: fees.filter((_, j) => j !== i) }))} className="text-cr-red text-xs">✕</button>
          </div>
        ))}
        <button type="button" onClick={() => setMeta((m) => ({ ...m, fees: [...fees, { label: "", amount: "", note: "" }] }))} className="text-xs text-cr-blue">＋ 料金を追加</button>
      </fieldset>

      {/* 兄弟割引料金 */}
      <fieldset className="rounded-md border border-border p-3 space-y-2">
        <legend className="px-1 text-xs font-bold text-ink-mid">兄弟割引料金</legend>
        {siblingFees.map((f, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              value={f.label}
              onChange={(e) => { const u = [...siblingFees]; u[i] = { ...f, label: e.target.value }; setMeta((m) => ({ ...m, sibling_fees: u })); }}
              placeholder="2人目（低学年）"
              className="w-1/3 rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
            />
            <input
              value={f.amount}
              onChange={(e) => { const u = [...siblingFees]; u[i] = { ...f, amount: e.target.value }; setMeta((m) => ({ ...m, sibling_fees: u })); }}
              placeholder="12,000円/月"
              className="w-1/4 rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
            />
            <input
              value={f.note}
              onChange={(e) => { const u = [...siblingFees]; u[i] = { ...f, note: e.target.value }; setMeta((m) => ({ ...m, sibling_fees: u })); }}
              placeholder="備考"
              className="flex-1 rounded-sm border border-border bg-bg-elev px-2 py-1.5 text-sm"
            />
            <button type="button" onClick={() => setMeta((m) => ({ ...m, sibling_fees: siblingFees.filter((_, j) => j !== i) }))} className="text-cr-red text-xs">✕</button>
          </div>
        ))}
        <button type="button" onClick={() => setMeta((m) => ({ ...m, sibling_fees: [...siblingFees, { label: "", amount: "", note: "" }] }))} className="text-xs text-cr-blue">＋ 兄弟割引を追加</button>
      </fieldset>

      {/* 入所の流れ */}
      <fieldset className="rounded-md border border-border p-3 space-y-2">
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
      <fieldset className="rounded-md border border-border p-3 space-y-2">
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
      <fieldset className="rounded-md border border-border p-3 space-y-2">
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
