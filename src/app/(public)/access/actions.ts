"use server";

import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/ratelimit/check";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult, ActionState } from "@/lib/actions/types";

// Public form, abuse-prone. 10 submissions per hour per (IP, email)
// pair is well above any legitimate use and well below what a basic
// flood would generate.
const INQUIRY_MAX = 10;
const INQUIRY_WINDOW_MS = 60 * 60 * 1000; // 1h

async function callerIp(): Promise<string> {
  const h = await headers();
  // Vercel and most proxies fan out to one of these. Take the first
  // hop in x-forwarded-for since it's the closest to the client; a
  // chained list means upstream proxies appended their own.
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

export async function submitInquiry(_prev: ActionState, formData: FormData): Promise<ActionResult> {
  const type = formData.get("type") as string;
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || null;
  const preferredDate = (formData.get("preferred_date") as string)?.trim() || null;
  const message = (formData.get("message") as string)?.trim();

  // バリデーション
  if (!type || !["visit", "general"].includes(type)) {
    return { success: false, message: "種別を選択してください。" };
  }
  if (!name) {
    return { success: false, message: "お名前を入力してください。" };
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, message: "有効なメールアドレスを入力してください。" };
  }
  if (!message) {
    return { success: false, message: "メッセージを入力してください。" };
  }
  if (type === "visit" && !preferredDate) {
    return { success: false, message: "見学予約の場合は希望日時を入力してください。" };
  }

  const ip = await callerIp();
  const rateKey = `inquiry|${ip}|${email}`;
  const limit = await checkRateLimit(rateKey, INQUIRY_MAX, INQUIRY_WINDOW_MS);
  if (!limit.ok) {
    const minutes = Math.ceil(limit.retryAfterSeconds / 60);
    return {
      success: false,
      message: `送信回数が上限に達しました。約${minutes}分後にもう一度お試しください。`,
    };
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("inquiries").insert({
      type,
      name,
      email,
      phone,
      preferred_date: preferredDate,
      message,
    });

    if (error) {
      console.error("[inquiry] Insert failed:", error.message);
      return { success: false, message: "送信に失敗しました。もう一度お試しください。" };
    }

    // 確認メール送信（失敗してもフォーム送信自体は成功扱い）
    try {
      await sendConfirmationEmail(name, email, type);
    } catch (err) {
      console.error("[inquiry] Confirmation email failed:", err);
    }

    return {
      success: true,
      message: "お問い合わせを受け付けました。確認メールをお送りしましたのでご確認ください。",
    };
  } catch {
    return { success: false, message: "送信に失敗しました。もう一度お試しください。" };
  }
}

async function sendConfirmationEmail(name: string, email: string, type: string) {
  const { sendEmail } = await import("@/lib/email/send");

  const typeLabel = type === "visit" ? "見学予約" : "お問い合わせ";

  await sendEmail({
    to: email,
    subject: `【星ヶ丘こどもクラブ】${typeLabel}を受け付けました`,
    text: `${name} 様\n\nこの度は${typeLabel}のお申し込みをいただき、ありがとうございます。\n内容を確認の上、担当者よりご連絡いたします。\n\nしばらくお待ちくださいますようお願いいたします。\n\n星ヶ丘こどもクラブ`,
  });
}
