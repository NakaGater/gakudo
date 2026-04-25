import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { isStaff } from "@/lib/auth/roles";
import { getInquiry, getReplyTemplate } from "../actions";
import { InquiryReplyForm } from "./reply-form";

export default async function InquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser();
  if (!isStaff(user.role)) redirect("/");

  const inquiry = await getInquiry(id);
  if (!inquiry) notFound();

  const approveTemplate = await getReplyTemplate("approved", inquiry.name, inquiry.preferred_date);
  const declineTemplate = await getReplyTemplate("declined", inquiry.name, inquiry.preferred_date);

  const typeLabel = inquiry.type === "visit" ? "🏫 見学予約" : "💬 一般お問い合わせ";
  const statusLabels: Record<string, string> = {
    pending: "未対応",
    approved: "承認済み",
    declined: "お断り",
    replied: "返信済み",
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/admin/inquiries"
        className="text-sm text-accent hover:text-accent-hv transition-colors"
      >
        ← 一覧に戻る
      </Link>

      <div className="mt-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm">{typeLabel}</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-bg-elev text-fg-muted border border-border">
            {statusLabels[inquiry.status] ?? inquiry.status}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-fg">{inquiry.name} さんからのお問い合わせ</h1>
        <p className="text-xs text-fg-muted mt-1">
          {inquiry.created_at
            ? new Date(inquiry.created_at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
            : ""}
        </p>
      </div>

      {/* 問い合わせ内容 */}
      <div className="rounded-lg border border-border bg-bg p-5 mb-6">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">
          <dt className="font-bold text-fg-muted">お名前</dt>
          <dd className="text-fg">{inquiry.name}</dd>

          <dt className="font-bold text-fg-muted">メール</dt>
          <dd className="text-fg">
            <a href={`mailto:${inquiry.email}`} className="text-accent hover:underline">
              {inquiry.email}
            </a>
          </dd>

          {inquiry.phone && (
            <>
              <dt className="font-bold text-fg-muted">電話番号</dt>
              <dd className="text-fg">{inquiry.phone}</dd>
            </>
          )}

          {inquiry.preferred_date && (
            <>
              <dt className="font-bold text-fg-muted">希望日時</dt>
              <dd className="text-fg text-cr-orange font-bold">{inquiry.preferred_date}</dd>
            </>
          )}

          <dt className="font-bold text-fg-muted">メッセージ</dt>
          <dd className="text-fg whitespace-pre-wrap">{inquiry.message}</dd>
        </dl>
      </div>

      {/* 返信済みの場合は返信内容を表示 */}
      {inquiry.admin_reply && (
        <div className="rounded-lg border border-cr-green/30 bg-cr-green/5 p-5 mb-6">
          <h3 className="font-bold text-fg text-sm mb-2">📤 送信済み返信</h3>
          <p className="text-sm text-fg whitespace-pre-wrap">{inquiry.admin_reply}</p>
          {inquiry.replied_at && (
            <p className="text-xs text-fg-muted mt-2">
              返信日時:{" "}
              {new Date(inquiry.replied_at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
            </p>
          )}
        </div>
      )}

      {/* 未対応の場合のみ返信フォームを表示 */}
      {inquiry.status === "pending" && (
        <InquiryReplyForm
          inquiryId={inquiry.id}
          approveTemplate={approveTemplate}
          declineTemplate={declineTemplate}
        />
      )}
    </div>
  );
}
