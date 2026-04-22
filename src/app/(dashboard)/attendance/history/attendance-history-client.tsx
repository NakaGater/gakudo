"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Card, CardContent, Badge } from "@/components/ui";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type AttendancePair = {
  enterTime: string | null; // ISO string
  exitTime: string | null;
};

export type DayRecord = {
  date: string; // YYYY-MM-DD
  pairs: AttendancePair[];
};

export type ChildOption = {
  id: string;
  name: string;
};

export type AttendanceHistoryProps = {
  days: DayRecord[];
  childOptions: ChildOption[];
  startDate: string;
  endDate: string;
  selectedChildId: string;
  isStaff: boolean;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

import { formatTimeJST } from "@/lib/time/jst";

const formatTime = formatTimeJST;

export { formatTime };

export function calcDuration(
  enterIso: string | null,
  exitIso: string | null,
): string {
  if (!enterIso || !exitIso) return "—";
  const diffMs = new Date(exitIso).getTime() - new Date(enterIso).getTime();
  if (diffMs <= 0) return "—";
  const totalMin = Math.floor(diffMs / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}分`;
  return `${h}時間${m}分`;
}

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  const dt = new Date(Number(y), Number(m) - 1, Number(d));
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][dt.getDay()];
  return `${Number(m)}/${Number(d)} (${weekday})`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AttendanceHistoryClient({
  days,
  childOptions,
  startDate,
  endDate,
  selectedChildId,
  isStaff,
}: AttendanceHistoryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const applyFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/attendance/history?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-fg mb-6">入退室履歴</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label htmlFor="startDate" className="block text-sm text-fg-muted mb-1">
            開始日
          </label>
          <input
            id="startDate"
            type="date"
            defaultValue={startDate}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
            onChange={(e) => applyFilter("start", e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm text-fg-muted mb-1">
            終了日
          </label>
          <input
            id="endDate"
            type="date"
            defaultValue={endDate}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
            onChange={(e) => applyFilter("end", e.target.value)}
          />
        </div>
        {childOptions.length > 1 && (
          <div>
            <label htmlFor="childFilter" className="block text-sm text-fg-muted mb-1">
              児童
            </label>
            <select
              id="childFilter"
              defaultValue={selectedChildId}
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
              onChange={(e) => applyFilter("child", e.target.value)}
            >
              <option value="">全員</option>
              {childOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-sm text-fg-muted">
              <th className="pb-3 font-medium">日付</th>
              {isStaff && <th className="pb-3 font-medium">児童</th>}
              <th className="pb-3 font-medium">入室</th>
              <th className="pb-3 font-medium">退室</th>
              <th className="pb-3 font-medium">滞在時間</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) =>
              day.pairs.length === 0 ? (
                <tr
                  key={day.date}
                  className="border-b border-border last:border-0"
                >
                  <td className="py-3">{formatDateLabel(day.date)}</td>
                  {isStaff && <td className="py-3" />}
                  <td className="py-3 text-fg-muted" colSpan={3}>
                    記録なし
                  </td>
                </tr>
              ) : (
                day.pairs.map((pair, i) => (
                  <tr
                    key={`${day.date}-${i}`}
                    className="border-b border-border last:border-0"
                  >
                    <td className="py-3">
                      {i === 0 ? formatDateLabel(day.date) : ""}
                    </td>
                    {isStaff && <td className="py-3" />}
                    <td className="py-3">
                      {pair.enterTime ? (
                        <Badge variant="enter">{formatTime(pair.enterTime)}</Badge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3">
                      {pair.exitTime ? (
                        <Badge variant="exit">{formatTime(pair.exitTime)}</Badge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3">
                      {calcDuration(pair.enterTime, pair.exitTime)}
                    </td>
                  </tr>
                ))
              ),
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {days.map((day) => (
          <Card key={day.date}>
            <CardContent>
              <p className="font-medium text-fg mb-2">
                {formatDateLabel(day.date)}
              </p>
              {day.pairs.length === 0 ? (
                <p className="text-sm text-fg-muted">記録なし</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {day.pairs.map((pair, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>
                        入室{" "}
                        <Badge variant="enter">{formatTime(pair.enterTime)}</Badge>
                      </span>
                      <span>
                        退室{" "}
                        <Badge variant="exit">{formatTime(pair.exitTime)}</Badge>
                      </span>
                      <span className="text-fg-muted">
                        {calcDuration(pair.enterTime, pair.exitTime)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {days.length === 0 && (
        <p className="text-center text-fg-muted py-12">
          該当する履歴がありません
        </p>
      )}
    </div>
  );
}
