"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { isStaff, isEntrance } from "@/lib/auth/roles";
import { sendAttendanceNotification } from "@/lib/notifications/send";
import { ERROR_MESSAGES } from "@/config/constants";
import { todayRangeJST } from "@/lib/time/jst";

export type AttendanceResult = {
  success: boolean;
  message: string;
  childName?: string;
  type?: "enter" | "exit";
  recordedAt?: string;
};

export type ChildAttendanceStatus = {
  childId: string;
  name: string;
  grade: number;
  status: "none" | "entered" | "exited";
  lastRecordedAt: string | null;
};

export type DashboardChildStatus = {
  childId: string;
  name: string;
  grade: number;
  status: "none" | "entered" | "exited";
  enterTime: string | null;
  exitTime: string | null;
};

export type ParentAttendanceData = {
  myChildren: DashboardChildStatus[];
  summary: { entered: number; exited: number; none: number; total: number };
};

type AttendanceRecord = { child_id: string; type: string; recorded_at: string };

/** Build enterMap (first enter time) and latestMap (latest record) from attendance records */
function buildAttendanceMaps(attendances: AttendanceRecord[]) {
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

/** Map children + attendance maps → DashboardChildStatus[] */
function toDashboardStatuses(
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

/** Shared logic: fetch today's children + attendance, return children list and maps */
async function fetchTodayChildrenAndAttendance(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ascending: boolean,
) {
  const { start, end } = todayRangeJST();

  const { data: children } = await supabase.from("children")
    .select("id, name, grade")
    .order("grade", { ascending: true })
    .order("name", { ascending: true });

  if (!children || children.length === 0) return null;

  const { data: attendances } = await supabase.from("attendances")
    .select("child_id, type, recorded_at")
    .gte("recorded_at", start)
    .lt("recorded_at", end)
    .order("recorded_at", { ascending });

  return {
    children: children as { id: string; name: string; grade: number }[],
    attendances: (attendances ?? []) as AttendanceRecord[],
  };
}

export async function getTodayAttendanceStatus(): Promise<ChildAttendanceStatus[]> {
  const user = await getUser();
  if (!isStaff(user.role)) return [];

  const supabase = await createClient();
  const result = await fetchTodayChildrenAndAttendance(supabase, true);
  if (!result) return [];

  const { latestMap } = buildAttendanceMaps(result.attendances);

  return result.children.map((c) => {
    const latest = latestMap.get(c.id);
    let status: "none" | "entered" | "exited" = "none";
    if (latest) {
      status = latest.type === "enter" ? "entered" : "exited";
    }
    return {
      childId: c.id,
      name: c.name,
      grade: c.grade,
      status,
      lastRecordedAt: latest?.recorded_at ?? null,
    };
  });
}

export async function getDashboardAttendanceStatus(): Promise<DashboardChildStatus[]> {
  const user = await getUser();
  if (!isStaff(user.role)) return [];

  const supabase = await createClient();
  const result = await fetchTodayChildrenAndAttendance(supabase, true);
  if (!result) return [];

  const { enterMap, latestMap } = buildAttendanceMaps(result.attendances);
  return toDashboardStatuses(result.children, enterMap, latestMap);
}

export async function getParentAttendanceStatus(): Promise<ParentAttendanceData> {
  await getUser();
  const supabase = await createClient();
  const { start, end } = todayRangeJST();

  const { data: summaryData } = await supabase.rpc("get_attendance_summary");
  const summary = (summaryData as { entered: number; exited: number; none: number; total: number } | null) ?? {
    entered: 0, exited: 0, none: 0, total: 0,
  };

  const { data: myChildren } = await supabase.from("children")
    .select("id, name, grade")
    .order("grade", { ascending: true })
    .order("name", { ascending: true });

  if (!myChildren || myChildren.length === 0) {
    return { myChildren: [], summary };
  }

  const { data: attendances } = await supabase.from("attendances")
    .select("child_id, type, recorded_at")
    .gte("recorded_at", start)
    .lt("recorded_at", end)
    .order("recorded_at", { ascending: true });

  const { enterMap, latestMap } = buildAttendanceMaps(
    (attendances ?? []) as AttendanceRecord[],
  );

  return {
    myChildren: toDashboardStatuses(
      myChildren as { id: string; name: string; grade: number }[],
      enterMap,
      latestMap,
    ),
    summary,
  };
}

/** Shared core: determine enter/exit, insert record, notify, return result */
async function createAttendanceRecord(
  childId: string,
  childName: string,
  method: "qr" | "manual",
  userId: string,
  revalidatePaths: string[],
): Promise<AttendanceResult> {
  const supabase = await createClient();
  const { start, end } = todayRangeJST();

  const { data: latest } = await supabase.from("attendances")
    .select("id, type, recorded_at")
    .eq("child_id", childId)
    .gte("recorded_at", start)
    .lt("recorded_at", end)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .single();

  const actionType: "enter" | "exit" =
    !latest || latest.type === "exit" ? "enter" : "exit";

  const { data: record, error: insertError } = await supabase.from("attendances")
    .insert({
      child_id: childId,
      type: actionType,
      method,
      recorded_by: userId,
    })
    .select("id, type, recorded_at")
    .single();

  if (insertError) {
    return { success: false, message: `記録に失敗しました: ${insertError.message}` };
  }

  for (const p of revalidatePaths) revalidatePath(p);

  // Non-blocking: notification is best-effort, don't block the response
  sendAttendanceNotification(
    childId, actionType, record.recorded_at ?? new Date().toISOString(),
  ).catch((err) => {
    console.error("[attendance] notification error:", err);
  });

  return {
    success: true,
    message: actionType === "enter" ? "入室しました" : "退室しました",
    childName,
    type: record.type as "enter" | "exit",
    recordedAt: record.recorded_at ?? undefined,
  };
}

export async function recordManualAttendance(
  childId: string,
): Promise<AttendanceResult> {
  const user = await getUser();
  if (!isEntrance(user.role)) {
    return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED };
  }

  const supabase = await createClient();
  const { data: child } = await supabase.from("children")
    .select("id, name")
    .eq("id", childId)
    .single();

  if (!child) {
    return { success: false, message: "児童が見つかりません" };
  }

  return createAttendanceRecord(
    child.id, child.name, "manual", user.id,
    ["/attendance", "/attendance/manual"],
  );
}

export async function recordAttendance(
  qrCode: string,
): Promise<AttendanceResult> {
  const user = await getUser();
  if (!isEntrance(user.role)) {
    return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED };
  }

  const supabase = await createClient();
  const { data: child } = await supabase.from("children")
    .select("id, name, qr_active")
    .eq("qr_code", qrCode)
    .single();

  if (!child) {
    return { success: false, message: "児童が見つかりません" };
  }

  if (!child.qr_active) {
    return { success: false, message: "このQRコードは無効です" };
  }

  return createAttendanceRecord(
    child.id, child.name, "qr", user.id,
    ["/attendance"],
  );
}
