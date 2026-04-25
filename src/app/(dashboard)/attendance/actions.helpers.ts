export type DashboardChildStatus = {
  childId: string;
  name: string;
  grade: number;
  status: "none" | "entered" | "exited";
  enterTime: string | null;
  exitTime: string | null;
};

export type AttendanceRecord = { child_id: string; type: string; recorded_at: string };

/** その日のレコード列から、子毎の「初回 enter 時刻」と「最新 record」を構築する */
export function buildAttendanceMaps(attendances: AttendanceRecord[]): {
  enterMap: Map<string, string>;
  latestMap: Map<string, { type: string; recorded_at: string }>;
} {
  const enterMap = new Map<string, string>();
  const latestMap = new Map<string, { type: string; recorded_at: string }>();

  for (const a of attendances) {
    if (a.type === "enter" && !enterMap.has(a.child_id)) {
      enterMap.set(a.child_id, a.recorded_at);
    }
    latestMap.set(a.child_id, { type: a.type, recorded_at: a.recorded_at });
  }

  return { enterMap, latestMap };
}

/** 児童一覧 + 入退室マップから、ダッシュボード表示用の状態配列を組み立てる */
export function toDashboardStatuses(
  children: { id: string; name: string; grade: number }[],
  enterMap: Map<string, string>,
  latestMap: Map<string, { type: string; recorded_at: string }>,
): DashboardChildStatus[] {
  return children.map((c) => {
    const latest = latestMap.get(c.id);
    let status: "none" | "entered" | "exited" = "none";
    let exitTime: string | null = null;

    if (latest) {
      if (latest.type === "enter") {
        status = "entered";
      } else {
        status = "exited";
        exitTime = latest.recorded_at;
      }
    }

    return {
      childId: c.id,
      name: c.name,
      grade: c.grade,
      status,
      enterTime: enterMap.get(c.id) ?? null,
      exitTime,
    };
  });
}

/**
 * 直近の出席レコードから次に記録すべきタイプを決定する。
 * - レコード無し / 直近が exit → 次は enter
 * - 直近が enter → 次は exit
 */
export function decideNextAttendanceType(
  latest: { type: string } | null | undefined,
): "enter" | "exit" {
  return !latest || latest.type === "exit" ? "enter" : "exit";
}
