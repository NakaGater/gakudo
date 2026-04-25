"use server";

import { revalidatePath } from "next/cache";
import { ERROR_MESSAGES } from "@/config/constants";
import { getUser } from "@/lib/auth/get-user";
import { isStaff } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/actions/types";

export type InquiryRow = {
  id: string;
  type: string;
  name: string;
  email: string;
  phone: string | null;
  preferred_date: string | null;
  message: string;
  status: string;
  admin_reply: string | null;
  replied_at: string | null;
  replied_by: string | null;
  created_at: string | null;
};

export async function getInquiries(status?: string): Promise<InquiryRow[]> {
  const user = await getUser();
  if (!isStaff(user.role)) return [];

  const supabase = await createClient();
  let query = supabase.from("inquiries").select("*").order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data } = await query;
  return (data as InquiryRow[]) ?? [];
}

export async function getInquiry(id: string): Promise<InquiryRow | null> {
  const user = await getUser();
  if (!isStaff(user.role)) return null;

  const supabase = await createClient();
  const { data } = await supabase.from("inquiries").select("*").eq("id", id).single();

  return (data as InquiryRow) ?? null;
}

export async function getPendingInquiryCount(): Promise<number> {
  const user = await getUser();
  if (!isStaff(user.role)) return 0;

  const supabase = await createClient();
  const { count } = await supabase
    .from("inquiries")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  return count ?? 0;
}

const REPLY_TEMPLATES = {
  approved: (name: string, preferredDate: string | null) =>
    `${name} 様\n\nこの度は見学のお申し込みをいただき、ありがとうございます。\n${preferredDate ? `${preferredDate}にお待ちしております。` : "日程の詳細は追ってご連絡いたします。"}\n\n当日は動きやすい服装でお越しください。\nご不明な点がございましたら、お気軽にお問い合わせください。\n\n星ヶ丘こどもクラブ`,
  declined: (name: string) =>
    `${name} 様\n\nこの度はお問い合わせいただき、ありがとうございます。\n誠に申し訳ございませんが、ご希望の日程での対応が難しい状況です。\n\n別の日程をご検討いただけますと幸いです。\nお手数ですが、改めてお申し込みいただけますようお願いいたします。\n\n星ヶ丘こどもクラブ`,
};

export async function getReplyTemplate(
  action: "approved" | "declined",
  name: string,
  preferredDate: string | null,
): Promise<string> {
  if (action === "approved") return REPLY_TEMPLATES.approved(name, preferredDate);
  return REPLY_TEMPLATES.declined(name);
}

export async function replyToInquiry(
  inquiryId: string,
  action: "approved" | "declined" | "replied",
  replyText: string,
): Promise<ActionResult> {
  const user = await getUser();
  if (!isStaff(user.role)) {
    return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED };
  }

  const supabase = await createClient();

  // 問い合わせ情報を取得
  const { data: inquiry } = await supabase
    .from("inquiries")
    .select("email, name")
    .eq("id", inquiryId)
    .single();

  if (!inquiry) {
    return { success: false, message: "お問い合わせが見つかりません。" };
  }

  // ステータス更新
  const { error } = await supabase
    .from("inquiries")
    .update({
      status: action,
      admin_reply: replyText,
      replied_at: new Date().toISOString(),
      replied_by: user.id,
    })
    .eq("id", inquiryId);

  if (error) {
    return { success: false, message: "更新に失敗しました。" };
  }

  // メール送信
  try {
    await sendReplyEmail(
      (inquiry as { email: string; name: string }).email,
      (inquiry as { email: string; name: string }).name,
      action,
      replyText,
    );
  } catch (err) {
    console.error("[inquiry] Reply email failed:", err);
  }

  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${inquiryId}`);

  const actionLabel = action === "approved" ? "承認" : action === "declined" ? "お断り" : "返信";
  return { success: true, message: `${actionLabel}メールを送信しました。` };
}

async function sendReplyEmail(email: string, name: string, action: string, replyText: string) {
  const { sendEmail } = await import("@/lib/email/send");

  const subjectMap: Record<string, string> = {
    approved: "見学のお申し込みを承認しました",
    declined: "お問い合わせへのご返信",
    replied: "お問い合わせへのご返信",
  };

  await sendEmail({
    to: email,
    subject: `【星ヶ丘こどもクラブ】${subjectMap[action] ?? "ご返信"}`,
    text: replyText,
  });
}
