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

export async function getStudents() {
  const { supabase } = await requireTeacher()
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

export async function createStudent(formData: FormData) {
  const name = formData.get('name') as string | null
  if (!name || name.trim() === '') {
    throw new Error('Name is required')
  }

  const { supabase } = await requireTeacher()
  const class_name = (formData.get('class_name') as string | null) || null
  const qr_token = crypto.randomUUID()

  const { error } = await supabase
    .from('students')
    .insert({ name: name.trim(), class_name, qr_token })
  if (error) throw error

  revalidatePath('/teacher/students')
}

export async function updateStudent(id: string, formData: FormData) {
  if (!id || id.trim() === '') {
    throw new Error('Student ID is required')
  }

  const name = formData.get('name') as string | null
  if (!name || name.trim() === '') {
    throw new Error('Name is required')
  }

  const { supabase } = await requireTeacher()
  const class_name = (formData.get('class_name') as string | null) || null

  const { error } = await supabase
    .from('students')
    .update({ name: name.trim(), class_name })
    .eq('id', id)
  if (error) throw error

  revalidatePath('/teacher/students')
}
