"use server";

import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/ratelimit/check";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmail, getEnum, getString } from "@/lib/validation/form";
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
  if (fwd) return fwd.split(",")[0]?.trim() ?? "unknown";
  return h.get("x-real-ip") ?? "unknown";
}

export async function submitInquiry(_prev: ActionState, formData: FormData): Promise<ActionResult> {
  // Phase 2-D: validation through lib/validation/form.ts so the
  // typeof / trim / regex boilerplate lives in one tested place.
  const typeR = getEnum(formData, "type", ["visit", "general"] as const, {
    message: "種別を選択してください。",
  });
  if (!typeR.ok) return { success: false, message: typeR.error };
  const type = typeR.value;

  const nameR = getString(formData, "name", { message: "お名前を入力してください。" });
  if (!nameR.ok) return { success: false, message: nameR.error };
  const name = nameR.value;

  const emailR = getEmail(formData, "email", {
    message: "有効なメールアドレスを入力してください。",
  });
  if (!emailR.ok) return { success: false, message: emailR.error };
  const email = emailR.value;

  const phoneR = getString(formData, "phone", { required: false });
  const phone = phoneR.ok && phoneR.value ? phoneR.value : null;

  const preferredDateR = getString(formData, "preferred_date", { required: false });
  const preferredDate = preferredDateR.ok && preferredDateR.value ? preferredDateR.value : null;

  const messageR = getString(formData, "message", { message: "メッセージを入力してください。" });
  if (!messageR.ok) return { success: false, message: messageR.error };
  const message = messageR.value;

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
