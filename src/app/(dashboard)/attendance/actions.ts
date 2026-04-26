"use server";

import { revalidatePath } from "next/cache";
import { withAuth } from "@/lib/actions/middleware";
import type { ActionResult } from "@/lib/actions/types";
import { getUser } from "@/lib/auth/get-user";
import { isStaff } from "@/lib/auth/roles";
import { sanitizeError } from "@/lib/errors/sanitize";
import { sendAttendanceNotification } from "@/lib/notifications/send";
import { createClient } from "@/lib/supabase/server";
import { todayRangeJST } from "@/lib/time/jst";
import {
  buildAttendanceMaps,
  toDashboardStatuses,
  decideNextAttendanceType,
  type AttendanceRecord,
  type DashboardChildStatus,
} from "./actions.helpers";

export type { DashboardChildStatus } from "./actions.helpers";

// Phase 2-C: extends ActionResult so withAuth's `TResult | ActionResult`
// union collapses to a single shape and callsites can keep narrowing on
// `success && childName && type && recordedAt`.
export type AttendanceResult = ActionResult & {
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

export type ParentAttendanceData = {
  myChildren: DashboardChildStatus[];
  summary: { entered: number; exited: number; none: number; total: number };
};

/** Shared logic: fetch today's children + attendance, return children list and maps */
async function fetchTodayChildrenAndAttendance(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ascending: boolean,
) {
  const { start, end } = todayRangeJST();

  const { data: children } = await supabase
    .from("children")
    .select("id, name, grade")
    .order("grade", { ascending: true })
    .order("name", { ascending: true });

  if (!children || children.length === 0) return null;

  const { data: attendances } = await supabase
    .from("attendances")
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
  const summary = (summaryData as {
    entered: number;
    exited: number;
    none: number;
    total: number;
  } | null) ?? {
    entered: 0,
    exited: 0,
    none: 0,
    total: 0,
  };

  const { data: myChildren } = await supabase
    .from("children")
    .select("id, name, grade")
    .order("grade", { ascending: true })
    .order("name", { ascending: true });

  if (!myChildren || myChildren.length === 0) {
    return { myChildren: [], summary };
  }

  const { data: attendances } = await supabase
    .from("attendances")
    .select("child_id, type, recorded_at")
    .gte("recorded_at", start)
    .lt("recorded_at", end)
    .order("recorded_at", { ascending: true });

  const { enterMap, latestMap } = buildAttendanceMaps((attendances ?? []) as AttendanceRecord[]);

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

  const { data: latest } = await supabase
    .from("attendances")
    .select("id, type, recorded_at")
    .eq("child_id", childId)
    .gte("recorded_at", start)
    .lt("recorded_at", end)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .single();

  const actionType = decideNextAttendanceType(latest);

  const { data: record, error: insertError } = await supabase
    .from("attendances")
    .insert({
      child_id: childId,
      type: actionType,
      method,
      recorded_by: userId,
    })
    .select("id, type, recorded_at")
    .single();

  if (insertError) {
    return { success: false, message: sanitizeError(insertError, "記録に失敗しました") };
  }

  for (const p of revalidatePaths) revalidatePath(p);

  // Non-blocking: notification is best-effort, don't block the response
  sendAttendanceNotification(
    childId,
    actionType,
    record.recorded_at ?? new Date().toISOString(),
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

export const recordManualAttendance = withAuth(
  "entrance",
  async ({ user, supabase }, childId: string): Promise<AttendanceResult> => {
    const { data: child } = await supabase
      .from("children")
      .select("id, name")
      .eq("id", childId)
      .single();

    if (!child) {
      return { success: false, message: "児童が見つかりません" };
    }

    return createAttendanceRecord(child.id, child.name, "manual", user.id, [
      "/attendance",
      "/attendance/manual",
    ]);
  },
);

export const recordAttendance = withAuth(
  "entrance",
  async ({ user, supabase }, qrCode: string): Promise<AttendanceResult> => {
    const { data: child } = await supabase
      .from("children")
      .select("id, name, qr_active")
      .eq("qr_code", qrCode)
      .single();

    if (!child) {
      return { success: false, message: "児童が見つかりません" };
    }

    if (!child.qr_active) {
      return { success: false, message: "このQRコードは無効です" };
    }

    return createAttendanceRecord(child.id, child.name, "qr", user.id, ["/attendance"]);
  },
);
