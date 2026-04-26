import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AttachmentList } from "@/components/attachments/attachment-list";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { summarizeRecipients, type RecipientRow } from "@/lib/announcements/recipients";
import { getAttachments, getAttachmentUrl } from "@/lib/attachments/actions";
import { getUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { getReadCount } from "../actions";
import { MarkRead } from "./mark-read";

interface Props {
  params: Promise<{ id: string }>;
}

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  author: { name: string };
};

export default async function AnnouncementDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await getUser();
  const supabase = await createClient();
  const isStaff = user.role === "teacher" || user.role === "admin";

  // Phase 3-C: `.returns<T>()` collapses `data` to AnnouncementRow without
  // an `as unknown as` cast.
  const { data } = await supabase
    .from("announcements")
    .select(
      `id, title, body, created_at,
       author:profiles!announcements_posted_by_fkey(name)`,
    )
    .eq("id", id)
    .returns<AnnouncementRow[]>()
    .single();

  if (!data) notFound();

  const announcement = data;
  const readCount = isStaff ? await getReadCount(id) : null;

  // 送信対象（スタッフ向けに表示）
  let recipientLabel: string | null = null;
  if (isStaff) {
    const { data: recipientRows } = await supabase
      .from("announcement_recipients")
      .select("recipient_type, recipient_user_id")
      .eq("announcement_id", id);
    const rows = (recipientRows ?? []) as RecipientRow[];

    const userIds = rows
      .filter((r) => r.recipient_type === "user" && r.recipient_user_id)
      .map((r) => r.recipient_user_id as string);
    const nameByUserId = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: names } = await supabase.from("profiles").select("id, name").in("id", userIds);
      for (const n of (names ?? []) as { id: string; name: string }[]) {
        nameByUserId.set(n.id, n.name);
      }
    }
    recipientLabel = summarizeRecipients(rows, nameByUserId);
  }

  // 添付ファイル取得
  const attachments = await getAttachments("announcement", id);
  const downloadUrls: Record<string, string> = {};
  for (const att of attachments) {
    const url = await getAttachmentUrl(att.file_path);
    if (url) downloadUrls[att.id] = url;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Mark as read for parents */}
      {user.role === "parent" && <MarkRead announcementId={id} />}

      {/* Back link */}
      <Link
        href="/announcements"
        className="mb-6 inline-flex items-center gap-1 text-sm text-fg/60 hover:text-fg transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        お知らせ一覧へ戻る
      </Link>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold text-fg">{announcement.title}</h1>

          <div className="flex items-center flex-wrap gap-3 text-sm text-fg/50">
            <span>{announcement.author?.name ?? ""}</span>
            <time dateTime={announcement.created_at}>
              {dateFormatter.format(new Date(announcement.created_at))}
            </time>
            {isStaff && recipientLabel && <Badge>対象: {recipientLabel}</Badge>}
            {isStaff && readCount !== null && <Badge>{readCount}人が既読</Badge>}
          </div>

          <div className="whitespace-pre-wrap text-fg/80 leading-relaxed">{announcement.body}</div>

          {attachments.length > 0 && (
            <AttachmentList attachments={attachments} downloadUrls={downloadUrls} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
