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

export async function getTodayAttendanceStatus(): Promise<ChildAttendanceStatus[]> {
  const user = await getUser();
  if (!isStaff(user.role)) {
    return [];
  }

  const supabase = await createClient();
  const { start, end } = todayRangeJST();

  const { data: children } = await supabase.from("children")
    .select("id, name, grade")
    .order("grade", { ascending: true })
    .order("name", { ascending: true });

  if (!children || children.length === 0) return [];

  const { data: attendances } = await supabase.from("attendances")
    .select("child_id, type, recorded_at")
    .gte("recorded_at", start)
    .lt("recorded_at", end)
    .order("recorded_at", { ascending: false });

  // Build a map of child_id → latest attendance record
  const latestMap = new Map<string, { type: string; recorded_at: string | null }>();
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

  const { data: children } = await supabase.from("children")
    .select("id, name, grade")
    .order("grade", { ascending: true })
    .order("name", { ascending: true });

  if (!children || children.length === 0) return [];

  // Fetch today's records sorted ascending so we can find first enter & latest record
  const { data: attendances } = await supabase.from("attendances")
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

export type ParentAttendanceData = {
  myChildren: DashboardChildStatus[];
  summary: { entered: number; exited: number; none: number; total: number };
};

export async function getParentAttendanceStatus(): Promise<ParentAttendanceData> {
  const user = await getUser();
  const supabase = await createClient();
  const { start, end } = todayRangeJST();

  // Get summary via RPC (SECURITY DEFINER, bypasses RLS)
  const { data: summaryData } = await supabase.rpc("get_attendance_summary");
  const summary = (summaryData as { entered: number; exited: number; none: number; total: number } | null) ?? {
    entered: 0, exited: 0, none: 0, total: 0,
  };

  // Get parent's children (RLS allows parent to see own children)
  const { data: myChildren } = await supabase.from("children")
    .select("id, name, grade")
    .order("grade", { ascending: true })
    .order("name", { ascending: true });

  if (!myChildren || myChildren.length === 0) {
    return { myChildren: [], summary };
  }

  // Get attendance for parent's children (RLS filters automatically)
  const { data: attendances } = await supabase.from("attendances")
    .select("child_id, type, recorded_at")
    .gte("recorded_at", start)
    .lt("recorded_at", end)
    .order("recorded_at", { ascending: true });

  const enterMap = new Map<string, string>();
  const latestMap = new Map<string, { type: string; recorded_at: string }>();
  for (const a of (attendances ?? []) as { child_id: string; type: string; recorded_at: string }[]) {
    if (a.type === "enter" && !enterMap.has(a.child_id)) {
      enterMap.set(a.child_id, a.recorded_at);
    }
    latestMap.set(a.child_id, { type: a.type, recorded_at: a.recorded_at });
  }

  const myChildrenStatus: DashboardChildStatus[] = myChildren.map((c) => {
    const latest = latestMap.get(c.id);
    let status: "none" | "entered" | "exited" = "none";
    let exitTime: string | null = null;
    if (latest) {
      status = latest.type === "enter" ? "entered" : "exited";
      if (status === "exited") exitTime = latest.recorded_at;
    }
    return {
      childId: c.id, name: c.name, grade: c.grade, status,
      enterTime: enterMap.get(c.id) ?? null, exitTime,
    };
  });

  return { myChildren: myChildrenStatus, summary };
}

export async function recordManualAttendance(
  childId: string,
): Promise<AttendanceResult> {
  const user = await getUser();
  if (!isEntrance(user.role)) {
    return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED };
  }

  const supabase = await createClient();

  // 1. Verify child exists
  const { data: child } = await supabase.from("children")
    .select("id, name")
    .eq("id", childId)
    .single();

  if (!child) {
    return { success: false, message: "児童が見つかりません" };
  }

  // 2. Get latest attendance for this child today (JST)
  const { start, end } = todayRangeJST();

  const { data: latest } = await supabase.from("attendances")
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
  const { data: record, error: insertError } = await supabase.from("attendances")
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
  sendAttendanceNotification(child.id, actionType, record.recorded_at ?? new Date().toISOString()).catch((err) => {
    console.error("[attendance] notification error:", err);
  });

  return {
    success: true,
    message: actionType === "enter" ? "入室しました" : "退室しました",
    childName: child.name,
    type: record.type as "enter" | "exit",
    recordedAt: record.recorded_at ?? undefined,
  };
}

export async function recordAttendance(
  qrCode: string,
): Promise<AttendanceResult> {
  const user = await getUser();
  if (!isEntrance(user.role)) {
    return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED };
  }

  const supabase = await createClient();

  // 1. Look up child by qr_code
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

  // 2. Get latest attendance for this child today (JST)
  const { start, end } = todayRangeJST();

  const { data: latest } = await supabase.from("attendances")
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
  const { data: record, error: insertError } = await supabase.from("attendances")
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
  sendAttendanceNotification(child.id, actionType, record.recorded_at ?? new Date().toISOString()).catch((err) => {
    console.error("[attendance] notification error:", err);
  });

  return {
    success: true,
    message: actionType === "enter" ? "入室しました" : "退室しました",
    childName: child.name,
    type: record.type as "enter" | "exit",
    recordedAt: record.recorded_at ?? undefined,
  };
}
