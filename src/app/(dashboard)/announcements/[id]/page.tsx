import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  const { data } = await supabase
    .from("announcements")
    .select(
      `id, title, body, created_at,
       author:profiles!announcements_posted_by_fkey(name)`,
    )
    .eq("id", id)
    .single();

  if (!data) notFound();

  const announcement = data as unknown as AnnouncementRow;
  const readCount = isStaff ? await getReadCount(id) : null;

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

          <div className="flex items-center gap-3 text-sm text-fg/50">
            <span>{announcement.author?.name ?? ""}</span>
            <time dateTime={announcement.created_at}>
              {dateFormatter.format(new Date(announcement.created_at))}
            </time>
            {isStaff && readCount !== null && (
              <Badge>{readCount}人が既読</Badge>
            )}
          </div>

          <div className="whitespace-pre-wrap text-fg/80 leading-relaxed">
            {announcement.body}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
