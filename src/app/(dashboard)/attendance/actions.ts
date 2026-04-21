"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { isStaff } from "@/lib/auth/roles";
import { sendAttendanceNotification } from "@/lib/notifications/send";
import { ERROR_MESSAGES } from "@/config/constants";

export type AttendanceResult = {
  success: boolean;
  message: string;
  childName?: string;
  type?: "enter" | "exit";
  recordedAt?: string;
};

/** JST today boundaries as ISO strings */
function todayRangeJST(): { start: string; end: string } {
  const now = new Date();
  // JST = UTC+9
  const jstOffset = 9 * 60 * 60 * 1000;
  const jstNow = new Date(now.getTime() + jstOffset);
  const y = jstNow.getUTCFullYear();
  const m = String(jstNow.getUTCMonth() + 1).padStart(2, "0");
  const d = String(jstNow.getUTCDate()).padStart(2, "0");
  // Start of day in JST → convert back to UTC
  const start = new Date(`${y}-${m}-${d}T00:00:00+09:00`).toISOString();
  const end = new Date(`${y}-${m}-${String(Number(d) + 1).padStart(2, "0")}T00:00:00+09:00`);
  // Handle month rollover by adding 1 day to start instead
  const startDate = new Date(start);
  const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
  return { start, end: endDate.toISOString() };
}

export type ChildAttendanceStatus = {
  childId: string;
  name: string;
  grade: number;
  status: "none" | "entered" | "exited";
  lastRecordedAt: string | null;
};

export async function getTodayAttendanceStatus(): Promise<ChildAttendanceStatus[]> {
  const user = await getUser();
  if (!isStaff(user.role)) {
    return [];
  }

  const supabase = await createClient();
  const { start, end } = todayRangeJST();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: children } = await (supabase.from("children") as any)
    .select("id, name, grade")
    .order("grade", { ascending: true })
    .order("name", { ascending: true });

  if (!children || children.length === 0) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: attendances } = await (supabase.from("attendances") as any)
    .select("child_id, type, recorded_at")
    .gte("recorded_at", start)
    .lt("recorded_at", end)
    .order("recorded_at", { ascending: false });

  // Build a map of child_id → latest attendance record
  const latestMap = new Map<string, { type: string; recorded_at: string }>();
  for (const a of attendances ?? []) {
    if (!latestMap.has(a.child_id)) {
      latestMap.set(a.child_id, { type: a.type, recorded_at: a.recorded_at });
    }
  }

  return (children as { id: string; name: string; grade: number }[]).map((c) => {
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

export type DashboardChildStatus = {
  childId: string;
  name: string;
  grade: number;
  status: "none" | "entered" | "exited";
  enterTime: string | null;
  exitTime: string | null;
};

export async function getDashboardAttendanceStatus(): Promise<
  DashboardChildStatus[]
> {
  const user = await getUser();
  if (!isStaff(user.role)) return [];

  const supabase = await createClient();
  const { start, end } = todayRangeJST();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: children } = await (supabase.from("children") as any)
    .select("id, name, grade")
    .order("grade", { ascending: true })
    .order("name", { ascending: true });

  if (!children || children.length === 0) return [];

  // Fetch today's records sorted ascending so we can find first enter & latest record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: attendances } = await (supabase.from("attendances") as any)
    .select("child_id, type, recorded_at")
    .gte("recorded_at", start)
    .lt("recorded_at", end)
    .order("recorded_at", { ascending: true });

  const enterMap = new Map<string, string>();
  const latestMap = new Map<string, { type: string; recorded_at: string }>();

  for (const a of (attendances ?? []) as {
    child_id: string;
    type: string;
    recorded_at: string;
  }[]) {
    if (a.type === "enter" && !enterMap.has(a.child_id)) {
      enterMap.set(a.child_id, a.recorded_at);
    }
    latestMap.set(a.child_id, { type: a.type, recorded_at: a.recorded_at });
  }

  return (children as { id: string; name: string; grade: number }[]).map(
    (c) => {
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
    },
  );
}

export async function recordManualAttendance(
  childId: string,
): Promise<AttendanceResult> {
  const user = await getUser();
  if (!isStaff(user.role)) {
    return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED };
  }

  const supabase = await createClient();

  // 1. Verify child exists
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: child } = await (supabase.from("children") as any)
    .select("id, name")
    .eq("id", childId)
    .single();

  if (!child) {
    return { success: false, message: "児童が見つかりません" };
  }

  // 2. Get latest attendance for this child today (JST)
  const { start, end } = todayRangeJST();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: latest } = await (supabase.from("attendances") as any)
    .select("id, type, recorded_at")
    .eq("child_id", child.id)
    .gte("recorded_at", start)
    .lt("recorded_at", end)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .single();

  // 3. Determine enter/exit
  const actionType: "enter" | "exit" =
    !latest || latest.type === "exit" ? "enter" : "exit";

  // 4. Insert attendance record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: record, error: insertError } = await (supabase.from("attendances") as any)
    .insert({
      child_id: child.id,
      type: actionType,
      method: "manual",
      recorded_by: user.id,
    })
    .select("id, type, recorded_at")
    .single();

  if (insertError) {
    return { success: false, message: `記録に失敗しました: ${insertError.message}` };
  }

  revalidatePath("/attendance");
  revalidatePath("/attendance/manual");

  // Non-blocking: fire and forget
  sendAttendanceNotification(child.id, actionType, record.recorded_at).catch((err) => {
    console.error("[attendance] notification error:", err);
  });

  return {
    success: true,
    message: actionType === "enter" ? "入室しました" : "退室しました",
    childName: child.name,
    type: record.type,
    recordedAt: record.recorded_at,
  };
}

export async function recordAttendance(
  qrCode: string,
): Promise<AttendanceResult> {
  const user = await getUser();
  if (!isStaff(user.role)) {
    return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED };
  }

  const supabase = await createClient();

  // 1. Look up child by qr_code
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: child } = await (supabase.from("children") as any)
    .select("id, name, qr_active")
    .eq("qr_code", qrCode)
    .single();

  if (!child) {
    return { success: false, message: "児童が見つかりません" };
  }

  if (!child.qr_active) {
    return { success: false, message: "このQRコードは無効です" };
  }

  // 2. Get latest attendance for this child today (JST)
  const { start, end } = todayRangeJST();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: latest } = await (supabase.from("attendances") as any)
    .select("id, type, recorded_at")
    .eq("child_id", child.id)
    .gte("recorded_at", start)
    .lt("recorded_at", end)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .single();

  // 3. Determine enter/exit
  const actionType: "enter" | "exit" =
    !latest || latest.type === "exit" ? "enter" : "exit";

  // 4. Insert attendance record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: record, error: insertError } = await (supabase.from("attendances") as any)
    .insert({
      child_id: child.id,
      type: actionType,
      method: "qr",
      recorded_by: user.id,
    })
    .select("id, type, recorded_at")
    .single();

  if (insertError) {
    return { success: false, message: `記録に失敗しました: ${insertError.message}` };
  }

  revalidatePath("/attendance");

  // Non-blocking: fire and forget
  sendAttendanceNotification(child.id, actionType, record.recorded_at).catch((err) => {
    console.error("[attendance] notification error:", err);
  });

  return {
    success: true,
    message: actionType === "enter" ? "入室しました" : "退室しました",
    childName: child.name,
    type: record.type,
    recordedAt: record.recorded_at,
  };
}
