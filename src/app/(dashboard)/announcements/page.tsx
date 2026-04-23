import Link from "next/link";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { Button } from "@/components/ui/button";
import { AnnouncementCard } from "./announcement-card";

const PAGE_SIZE = 10;

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function AnnouncementsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const user = await getUser();
  const supabase = await createClient();
  const isStaff = user.role === "teacher" || user.role === "admin";

  // Parallel: count + data fetch
  const countQuery = supabase
    .from("announcements")
    .select("*", { count: "exact", head: true });

  const dataQuery = supabase
    .from("announcements")
    .select(
      `id, title, body, created_at,
       author:profiles!announcements_posted_by_fkey(name)${
         isStaff ? "" : `, announcement_reads!left(user_id)`
       }`,
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (!isStaff) {
    dataQuery.eq("announcement_reads.user_id", user.id);
  }

  const [{ count }, { data }] = await Promise.all([countQuery, dataQuery]);
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  type AnnouncementRow = {
    id: string;
    title: string;
    body: string;
    created_at: string;
    author: { name: string };
    announcement_reads: { user_id: string }[];
  };

  const announcements = (data ?? []) as unknown as AnnouncementRow[];

  return (
    <>
      {/* Header */}
      <div className="main__hdr">
        <h1 className="main__title font-story">📢 お知らせ</h1>
        {isStaff && (
          <Link href="/announcements/new">
            <Button size="sm">＋ 新規作成</Button>
          </Link>
        )}
      </div>

      {/* List */}
      {announcements.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-ink-mid">
          <Bell className="h-10 w-10" />
          <p>お知らせはまだありません</p>
        </div>
      ) : (
        <div className="letter-paper flex flex-col gap-4">
          {announcements.map((a) => {
            const isRead = isStaff
              ? true
              : (a.announcement_reads?.length ?? 0) > 0;
            return (
              <AnnouncementCard
                key={a.id}
                id={a.id}
                title={a.title}
                body={a.body}
                author={a.author?.name ?? ""}
                date={a.created_at}
                isRead={isRead}
              />
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-4">
          {page > 1 ? (
            <Link href={`/announcements?page=${page - 1}`}>
              <Button variant="secondary" size="sm">
                前のページ
              </Button>
            </Link>
          ) : (
            <Button variant="secondary" size="sm" disabled>
              前のページ
            </Button>
          )}
          <span className="text-sm text-ink-mid">
            {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={`/announcements?page=${page + 1}`}>
              <Button variant="secondary" size="sm">
                次のページ
              </Button>
            </Link>
          ) : (
            <Button variant="secondary" size="sm" disabled>
              次のページ
            </Button>
          )}
        </nav>
      )}
    </>
  );
}
