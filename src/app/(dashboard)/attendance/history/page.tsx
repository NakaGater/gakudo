import { getUser } from "@/lib/auth/get-user";
import { isStaff } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import {
  AttendanceHistoryClient,
  type DayRecord,
  type ChildOption,
  type AttendancePair,
} from "./attendance-history-client";

/** Current week Mon–Sun in JST as YYYY-MM-DD */
function defaultWeekRange(): { start: string; end: string } {
  const now = new Date();
  const jstOffset = 9 * 60 * 60 * 1000;
  const jstNow = new Date(now.getTime() + jstOffset);

  const day = jstNow.getUTCDay(); // 0=Sun
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(jstNow);
  mon.setUTCDate(mon.getUTCDate() + diffToMon);

  const sun = new Date(mon);
  sun.setUTCDate(sun.getUTCDate() + 6);

  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;

  return { start: fmt(mon), end: fmt(sun) };
}

/** Expand a date range to each individual YYYY-MM-DD */
function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(`${start}T00:00:00+09:00`);
  const last = new Date(`${end}T00:00:00+09:00`);
  while (cur <= last) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, "0");
    const d = String(cur.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${d}`);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

type AttendanceRow = {
  id: string;
  child_id: string;
  type: "enter" | "exit";
  recorded_at: string;
};

/** Group raw rows by date (JST) and pair enter/exit */
function buildDayRecords(allDates: string[], rows: AttendanceRow[]): DayRecord[] {
  // Group rows by JST date
  const byDate = new Map<string, AttendanceRow[]>();
  for (const r of rows) {
    const dt = new Date(r.recorded_at);
    const jst = new Date(dt.getTime() + 9 * 60 * 60 * 1000);
    const key = `${jst.getUTCFullYear()}-${String(jst.getUTCMonth() + 1).padStart(2, "0")}-${String(jst.getUTCDate()).padStart(2, "0")}`;
    const list = byDate.get(key) ?? [];
    list.push(r);
    byDate.set(key, list);
  }

  return allDates.map((date) => {
    const dayRows = byDate.get(date) ?? [];
    // Sort chronologically
    dayRows.sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());

    // Pair enter→exit
    const pairs: AttendancePair[] = [];
    let i = 0;
    while (i < dayRows.length) {
      if (dayRows[i].type === "enter") {
        const enter = dayRows[i].recorded_at;
        const exit =
          i + 1 < dayRows.length && dayRows[i + 1].type === "exit"
            ? dayRows[i + 1].recorded_at
            : null;
        pairs.push({ enterTime: enter, exitTime: exit });
        i += exit ? 2 : 1;
      } else {
        // Orphan exit without preceding enter
        pairs.push({ enterTime: null, exitTime: dayRows[i].recorded_at });
        i += 1;
      }
    }

    return { date, pairs };
  });
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

type Props = {
  searchParams: Promise<{ start?: string; end?: string; child?: string }>;
};

export default async function AttendanceHistoryPage({ searchParams }: Props) {
  const params = await searchParams;
  const user = await getUser();
  const supabase = await createClient();
  const staff = isStaff(user.role);

  // Date range
  const defaults = defaultWeekRange();
  const startDate = params.start || defaults.start;
  const endDate = params.end || defaults.end;

  // Convert to UTC range for query
  const rangeStart = new Date(`${startDate}T00:00:00+09:00`).toISOString();
  const rangeEnd = new Date(
    new Date(`${endDate}T00:00:00+09:00`).getTime() + 24 * 60 * 60 * 1000,
  ).toISOString();

  // Fetch children the user can see
  let childrenOptions: ChildOption[] = [];
  if (staff) {
    const { data } = await supabase.from("children").select("id, name").order("name");
    childrenOptions = (data ?? []) as ChildOption[];
  } else {
    // Parent: get children via child_parents
    const { data } = await supabase
      .from("child_parents")
      .select("child_id, children(id, name)")
      .eq("parent_id", user.id);

    childrenOptions = (data ?? []).map((row: { children: { id: string; name: string } }) => ({
      id: row.children.id,
      name: row.children.name,
    }));
  }

  const childIds = params.child ? [params.child] : childrenOptions.map((c) => c.id);

  if (childIds.length === 0) {
    return (
      <AttendanceHistoryClient
        days={[]}
        childOptions={childrenOptions}
        startDate={startDate}
        endDate={endDate}
        selectedChildId={params.child ?? ""}
        isStaff={staff}
      />
    );
  }

  // Fetch attendance records
  let query = supabase
    .from("attendances")
    .select("id, child_id, type, recorded_at")
    .gte("recorded_at", rangeStart)
    .lt("recorded_at", rangeEnd)
    .order("recorded_at", { ascending: true });

  if (childIds.length === 1) {
    query = query.eq("child_id", childIds[0]);
  } else {
    query = query.in("child_id", childIds);
  }

  const { data: records } = await query;
  const attendanceRows: AttendanceRow[] = (records ?? []) as AttendanceRow[];

  // Build day records
  const allDates = dateRange(startDate, endDate);
  const days = buildDayRecords(allDates, attendanceRows);

  return (
    <AttendanceHistoryClient
      days={days}
      childOptions={childrenOptions}
      startDate={startDate}
      endDate={endDate}
      selectedChildId={params.child ?? ""}
      isStaff={staff}
    />
  );
}
