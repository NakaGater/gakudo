'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function requireTeacher() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (error || profile?.role !== 'teacher') {
    throw new Error('Forbidden: teacher role required')
  }

  return { supabase, user }
}

type ScanResult =
  | { success: true; studentName: string; action: 'checkin' | 'checkout' }
  | { success: false; error: string }

export async function scanAttendance(qrToken: string): Promise<ScanResult> {
  if (!qrToken || qrToken.trim() === '') {
    return { success: false, error: 'QRトークンが必要です' }
  }

  const { supabase } = await requireTeacher()

  // 1. Find student by qr_token
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id, name')
    .eq('qr_token', qrToken.trim())
    .single()

  if (studentError || !student) {
    return { success: false, error: '生徒が見つかりません' }
  }

  // 2. Check today's attendance record
  const today = new Date().toISOString().split('T')[0]
  const { data: record, error: recordError } = await supabase
    .from('attendance_records')
    .select('id, check_in_at, check_out_at')
    .eq('student_id', student.id)
    .eq('date', today)
    .single()

  if (recordError && recordError.code !== 'PGRST116') {
    // PGRST116 = no rows returned — that's fine, means no record yet
    return { success: false, error: '出席記録の確認に失敗しました' }
  }

  // 3. No record → INSERT (check in)
  if (!record) {
    const now = new Date().toISOString()
    const { error: insertError } = await supabase
      .from('attendance_records')
      .insert({
        student_id: student.id,
        date: today,
        check_in_at: now,
      })
    if (insertError) {
      return { success: false, error: '入場記録の作成に失敗しました' }
    }
    revalidatePath('/teacher/attendance')
    return { success: true, studentName: student.name, action: 'checkin' }
  }

  // 4. Record exists, check_out_at null → UPDATE (check out)
  if (record.check_out_at === null) {
    const now = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('attendance_records')
      .update({ check_out_at: now })
      .eq('id', record.id)
    if (updateError) {
      return { success: false, error: '退場記録の更新に失敗しました' }
    }
    revalidatePath('/teacher/attendance')
    return { success: true, studentName: student.name, action: 'checkout' }
  }

  // 5. Already checked out
  return { success: false, error: '本日は退場済みです' }
}

type AttendanceListResult =
  | {
      success: true
      records: {
        id: string
        student_id: string
        student_name: string
        date: string
        check_in_at: string
        check_out_at: string | null
      }[]
    }
  | { success: false; error: string }

export async function getAttendanceByDate(date: string): Promise<AttendanceListResult> {
  if (!date || date.trim() === '') {
    return { success: false, error: '日付が必要です' }
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(date.trim())) {
    return { success: false, error: '無効な日付形式です' }
  }

  const { supabase } = await requireTeacher()

  const { data: records, error } = await supabase
    .from('attendance_records')
    .select('id, student_id, date, check_in_at, check_out_at')
    .eq('date', date.trim())
    .order('check_in_at', { ascending: true })

  if (error) {
    return { success: false, error: '出席記録の取得に失敗しました' }
  }

  // Fetch student names for all records
  const studentIds = [...new Set(records.map((r) => r.student_id))]
  const enrichedRecords = await Promise.all(
    records.map(async (record) => {
      const { data: student } = await supabase
        .from('students')
        .select('name')
        .eq('id', record.student_id)
        .single()
      return {
        ...record,
        student_name: student?.name ?? '不明',
      }
    })
  )

  // Suppress unused variable lint — studentIds reserved for future batch query optimization
  void studentIds

  revalidatePath('/teacher/attendance')
  return { success: true, records: enrichedRecords }
}
