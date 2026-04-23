"use client";

import { useState, useTransition } from "react";
import { replyToInquiry } from "../actions";
import { cn } from "@/lib/utils";

type Props = {
  inquiryId: string;
  approveTemplate: string;
  declineTemplate: string;
};

export function InquiryReplyForm({ inquiryId, approveTemplate, declineTemplate }: Props) {
  const [mode, setMode] = useState<"approved" | "declined" | "replied" | null>(null);
  const [replyText, setReplyText] = useState("");
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleModeSelect = (m: "approved" | "declined" | "replied") => {
    setMode(m);
    setResult(null);
    if (m === "approved") setReplyText(approveTemplate);
    else if (m === "declined") setReplyText(declineTemplate);
    else setReplyText("");
  };

  const handleSubmit = () => {
    if (!mode || !replyText.trim()) return;
    startTransition(async () => {
      const res = await replyToInquiry(inquiryId, mode, replyText);
      setResult(res);
    });
  };

  if (result?.success) {
    return (
      <div className="rounded-lg border border-cr-green/30 bg-cr-green/5 p-5 text-center">
        <p className="text-4xl mb-2">✅</p>
        <p className="text-sm font-bold text-fg">{result.message}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-bg-elev p-5">
      <h3 className="font-bold text-fg text-sm mb-4">返信する</h3>

      {/* アクション選択 */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => handleModeSelect("approved")}
          className={cn(
            "flex-1 rounded-lg border-2 px-3 py-2 text-sm font-bold transition-all",
            mode === "approved"
              ? "border-cr-green bg-cr-green/10 text-cr-green"
              : "border-border bg-bg text-fg-muted hover:border-cr-green/50",
          )}
        >
          ✅ 承認
        </button>
        <button
          type="button"
          onClick={() => handleModeSelect("declined")}
          className={cn(
            "flex-1 rounded-lg border-2 px-3 py-2 text-sm font-bold transition-all",
            mode === "declined"
              ? "border-cr-red bg-cr-red/10 text-cr-red"
              : "border-border bg-bg text-fg-muted hover:border-cr-red/50",
          )}
        >
          ❌ お断り
        </button>
        <button
          type="button"
          onClick={() => handleModeSelect("replied")}
          className={cn(
            "flex-1 rounded-lg border-2 px-3 py-2 text-sm font-bold transition-all",
            mode === "replied"
              ? "border-cr-blue bg-cr-blue/10 text-cr-blue"
              : "border-border bg-bg text-fg-muted hover:border-cr-blue/50",
          )}
        >
          💬 自由返信
        </button>
      </div>

      {/* 返信テキスト */}
      {mode && (
        <>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={8}
            className={cn(
              "w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg resize-y",
              "focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none",
            )}
            placeholder="返信内容を入力..."
          />

          {result && !result.success && (
            <div role="alert" className="mt-2 rounded-md px-3 py-2 text-xs bg-danger/10 text-danger">
              {result.message}
            </div>
          )}

          <div className="flex justify-end mt-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || !replyText.trim()}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold text-white transition-all",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                mode === "approved" && "bg-cr-green hover:bg-cr-green/90",
                mode === "declined" && "bg-cr-red hover:bg-cr-red/90",
                mode === "replied" && "bg-cr-blue hover:bg-cr-blue/90",
              )}
            >
              {isPending ? "送信中..." : "メールを送信する"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
