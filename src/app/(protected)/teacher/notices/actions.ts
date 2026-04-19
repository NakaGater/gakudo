'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function requireTeacher() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'teacher') throw new Error('Forbidden')
  return { supabase, user }
}

export async function getPublicNotices() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('public_notices')
    .select('*')
    .order('published_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createPublicNotice(formData: FormData) {
  const { supabase, user } = await requireTeacher()

  const title = formData.get('title') as string
  const body = formData.get('body') as string

  const { error } = await supabase
    .from('public_notices')
    .insert({ title, body, author_id: user.id })
  if (error) throw error
  revalidatePath('/')
  revalidatePath('/teacher/notices')
}

export async function updatePublicNotice(id: string, formData: FormData) {
  const { supabase } = await requireTeacher()
  const title = formData.get('title') as string
  const body = formData.get('body') as string

  const { error } = await supabase
    .from('public_notices')
    .update({ title, body })
    .eq('id', id)
  if (error) throw error
  revalidatePath('/')
  revalidatePath('/teacher/notices')
}
