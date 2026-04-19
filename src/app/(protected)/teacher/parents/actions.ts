'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function getParents() {
  const supabase = await createClient()
  const { data: parents, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'parent')
    .order('created_at', { ascending: false })
  if (error) throw error

  // Fetch linked students for each parent
  const parentIds = parents.map((p) => p.id)
  const { data: links, error: linkError } = await supabase
    .from('parent_students')
    .select('parent_id, student_id')
    .in('parent_id', parentIds.length > 0 ? parentIds : ['__none__'])
  if (linkError) throw linkError

  const studentIds = [...new Set(links.map((l) => l.student_id))]
  const { data: students, error: studentError } = await supabase
    .from('students')
    .select('*')
    .in('id', studentIds.length > 0 ? studentIds : ['__none__'])
  if (studentError) throw studentError

  const studentMap = new Map(students.map((s) => [s.id, s]))

  return parents.map((parent) => {
    const linkedStudentIds = links
      .filter((l) => l.parent_id === parent.id)
      .map((l) => l.student_id)
    return {
      ...parent,
      students: linkedStudentIds
        .map((sid) => studentMap.get(sid))
        .filter(Boolean),
    }
  })
}

export async function getStudents() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

export async function createParent(formData: FormData) {
  const admin = createAdminClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string
  const studentIds = formData.getAll('studentIds') as string[]

  // 1. Create auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (authError) throw authError

  const userId = authData.user.id

  // 2. Insert profile with role='parent'
  const { error: profileError } = await admin
    .from('profiles')
    .insert({ id: userId, email, name, role: 'parent' as const })
  if (profileError) throw profileError

  // 3. Insert parent_students links
  if (studentIds.length > 0) {
    const links = studentIds.map((studentId) => ({
      parent_id: userId,
      student_id: studentId,
    }))
    const { error: linkError } = await admin
      .from('parent_students')
      .insert(links)
    if (linkError) throw linkError
  }

  revalidatePath('/teacher/parents')
}
