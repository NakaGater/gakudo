import Link from "next/link";

export interface AnnouncementCardProps {
  id: string;
  title: string;
  body: string;
  author: string;
  date: string;
  isRead: boolean;
}

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "…";
}

export function AnnouncementCard({ id, title, body, author, date, isRead }: AnnouncementCardProps) {
  return (
    <Link href={`/announcements/${id}`} className="block">
      <div className={`ann-card ${!isRead ? "ann-card--unread" : "ann-card--read"}`}>
        <div className="flex items-center justify-between gap-2">
          <time className="ann-card__date" dateTime={date}>
            {dateFormatter.format(new Date(date))}
          </time>
          {!isRead && <span className="tag tag-warn">🔔 未読</span>}
        </div>
        <h2 className="ann-card__title truncate">{title}</h2>
        <p className="ann-card__body">{truncate(body, 80)}</p>
        <span className="ann-card__date">{author}</span>
      </div>
    </Link>
  );
}
