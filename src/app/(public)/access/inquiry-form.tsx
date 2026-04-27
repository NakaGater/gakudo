"use client";

import { Send } from "lucide-react";
import { useActionState, useState } from "react";
import { cn } from "@/lib/utils";
import { submitInquiry } from "./actions";
import type { ActionState } from "@/lib/actions/types";

type InquiryType = "visit" | "general";

type InquiryFormProps = {
  /**
   * Initial radio selection. Used by deep-links from the hero CTA
   * (`?inquiry=visit`) and the FAQ page footer (`?inquiry=general`) to
   * pre-select the right tab when the user lands on the form.
   */
  initialType?: InquiryType;
};

export function InquiryForm({ initialType = "visit" }: InquiryFormProps = {}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(submitInquiry, null);
  const [type, setType] = useState<InquiryType>(initialType);

  // 送信成功時
  if (state?.success) {
    return (
      <div className="rounded-xl border-2 border-cr-green bg-[#D5F5E3]/30 p-8 text-center">
        <div className="text-4xl mb-3">✅</div>
        <h3 className="font-story font-bold text-ink text-lg mb-2">送信完了</h3>
        <p className="text-sm text-ink-mid leading-relaxed">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.message && (
        <div role="alert" className="rounded-md px-4 py-3 text-sm bg-danger/10 text-danger">
          {state.message}
        </div>
      )}

      {/* 種別選択 */}
      <input type="hidden" name="type" value={type} />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType("visit")}
          className={cn(
            "flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-bold font-story transition-all",
            type === "visit"
              ? "border-cr-orange bg-cr-orange/10 text-cr-orange"
              : "border-page-edge bg-page-deep text-ink-mid hover:border-cr-orange/50",
          )}
        >
          🏫 見学予約
        </button>
        <button
          type="button"
          onClick={() => setType("general")}
          className={cn(
            "flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-bold font-story transition-all",
            type === "general"
              ? "border-cr-blue bg-cr-blue/10 text-cr-blue"
              : "border-page-edge bg-page-deep text-ink-mid hover:border-cr-blue/50",
          )}
        >
          💬 一般お問い合わせ
        </button>
      </div>

      {/* 名前 */}
      <div className="flex flex-col gap-1">
        <label htmlFor="inquiry-name" className="text-xs font-bold font-story text-ink">
          お名前 <span className="text-danger">*</span>
        </label>
        <input
          id="inquiry-name"
          name="name"
          type="text"
          required
          placeholder="山田 太郎"
          className={cn(
            "w-full rounded-lg border-2 border-page-edge bg-white px-3 py-2 text-sm text-ink",
            "placeholder:text-ink-light",
            "focus:border-cr-orange focus:ring-2 focus:ring-cr-orange/20 focus:outline-none",
          )}
        />
      </div>

      {/* メール */}
      <div className="flex flex-col gap-1">
        <label htmlFor="inquiry-email" className="text-xs font-bold font-story text-ink">
          メールアドレス <span className="text-danger">*</span>
        </label>
        <input
          id="inquiry-email"
          name="email"
          type="email"
          required
          placeholder="example@email.com"
          className={cn(
            "w-full rounded-lg border-2 border-page-edge bg-white px-3 py-2 text-sm text-ink",
            "placeholder:text-ink-light",
            "focus:border-cr-orange focus:ring-2 focus:ring-cr-orange/20 focus:outline-none",
          )}
        />
      </div>

      {/* 電話 */}
      <div className="flex flex-col gap-1">
        <label htmlFor="inquiry-phone" className="text-xs font-bold font-story text-ink">
          電話番号
        </label>
        <input
          id="inquiry-phone"
          name="phone"
          type="tel"
          placeholder="03-1234-5678"
          className={cn(
            "w-full rounded-lg border-2 border-page-edge bg-white px-3 py-2 text-sm text-ink",
            "placeholder:text-ink-light",
            "focus:border-cr-orange focus:ring-2 focus:ring-cr-orange/20 focus:outline-none",
          )}
        />
      </div>

      {/* 希望日時（見学予約時のみ） */}
      {type === "visit" && (
        <div className="flex flex-col gap-1">
          <label htmlFor="inquiry-date" className="text-xs font-bold font-story text-ink">
            見学希望日時 <span className="text-danger">*</span>
          </label>
          <input
            id="inquiry-date"
            name="preferred_date"
            type="text"
            required={type === "visit"}
            placeholder="例: 12月15日（金）15:00頃"
            className={cn(
              "w-full rounded-lg border-2 border-page-edge bg-white px-3 py-2 text-sm text-ink",
              "placeholder:text-ink-light",
              "focus:border-cr-orange focus:ring-2 focus:ring-cr-orange/20 focus:outline-none",
            )}
          />
        </div>
      )}

      {/* メッセージ */}
      <div className="flex flex-col gap-1">
        <label htmlFor="inquiry-message" className="text-xs font-bold font-story text-ink">
          メッセージ <span className="text-danger">*</span>
        </label>
        <textarea
          id="inquiry-message"
          name="message"
          required
          rows={4}
          placeholder={
            type === "visit"
              ? "見学に関するご質問やご要望がございましたらお書きください。"
              : "お問い合わせ内容をご記入ください。"
          }
          className={cn(
            "w-full rounded-lg border-2 border-page-edge bg-white px-3 py-2 text-sm text-ink resize-y",
            "placeholder:text-ink-light",
            "focus:border-cr-orange focus:ring-2 focus:ring-cr-orange/20 focus:outline-none",
          )}
        />
      </div>

      {/* 送信ボタン */}
      <button
        type="submit"
        disabled={isPending}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-[10px] border-2 border-[#B5663A]",
          "bg-cr-orange px-6 py-3 text-sm font-bold font-story text-white",
          "shadow-[0_3px_0_#B5663A] transition-all",
          "hover:-translate-y-px hover:shadow-[0_4px_0_#B5663A]",
          "active:translate-y-px active:shadow-[0_1px_0_#B5663A]",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0",
        )}
      >
        <Send size={16} />
        {isPending ? "送信中..." : "送信する"}
      </button>
    </form>
  );
}
