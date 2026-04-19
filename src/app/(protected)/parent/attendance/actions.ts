'use server'

import { createClient } from '@/lib/supabase/server'

export type ChildAttendance = {
  studentId: string
  studentName: string
  checkInAt: string | null
  checkOutAt: string | null
}

export async function getMyChildrenAttendance(): Promise<ChildAttendance[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const today = new Date().toISOString().slice(0, 10)

  // Get parent's children via parent_students
  const { data: links, error: linksError } = await supabase
    .from('parent_students')
    .select('student_id')
    .eq('parent_id', user.id)

  if (linksError) throw linksError
  if (!links || links.length === 0) return []

  const studentIds = links.map((l) => l.student_id)

  // Get student names
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id, name')
    .in('id', studentIds)

  if (studentsError) throw studentsError

  // Get today's attendance records
  const { data: records, error: recordsError } = await supabase
    .from('attendance_records')
    .select('student_id, check_in_at, check_out_at')
    .in('student_id', studentIds)
    .eq('date', today)

  if (recordsError) throw recordsError

  const recordMap = new Map(
    (records ?? []).map((r) => [r.student_id, r])
  )

  return (students ?? []).map((s) => {
    const record = recordMap.get(s.id)
    return {
      studentId: s.id,
      studentName: s.name,
      checkInAt: record?.check_in_at ?? null,
      checkOutAt: record?.check_out_at ?? null,
    }
  })
}
