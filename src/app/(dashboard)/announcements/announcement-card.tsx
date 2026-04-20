import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

export function AnnouncementCard({
  id,
  title,
  body,
  author,
  date,
  isRead,
}: AnnouncementCardProps) {
  return (
    <Link href={`/announcements/${id}`} className="block">
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-fg truncate">{title}</h2>
            {!isRead && <Badge variant="warning">未読</Badge>}
          </div>
          <p className="text-sm text-fg/70">{truncate(body, 80)}</p>
          <div className="flex items-center justify-between text-xs text-fg/50">
            <span>{author}</span>
            <time dateTime={date}>
              {dateFormatter.format(new Date(date))}
            </time>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
