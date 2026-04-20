"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";

export type AttendanceResult = {
  success: boolean;
  message: string;
  childName?: string;
  type?: "enter" | "exit";
  recordedAt?: string;
};

function isStaff(role: string): boolean {
  return role === "admin" || role === "teacher";
}

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

export async function recordAttendance(
  qrCode: string,
): Promise<AttendanceResult> {
  const user = await getUser();
  if (!isStaff(user.role)) {
    return { success: false, message: "権限がありません" };
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

  return {
    success: true,
    message: actionType === "enter" ? "入室しました" : "退室しました",
    childName: child.name,
    type: record.type,
    recordedAt: record.recorded_at,
  };
}
