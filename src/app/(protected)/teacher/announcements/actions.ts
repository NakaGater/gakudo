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

export async function getAnnouncements() {
  const { supabase } = await requireTeacher()
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createAnnouncement(formData: FormData) {
  const title = formData.get('title') as string | null
  if (!title || title.trim() === '') {
    throw new Error('Title is required')
  }

  const body = formData.get('body') as string | null
  if (!body || body.trim() === '') {
    throw new Error('Body is required')
  }

  const { supabase, user } = await requireTeacher()

  const { error } = await supabase
    .from('announcements')
    .insert({ title: title.trim(), body: body.trim(), author_id: user.id })
  if (error) throw error

  revalidatePath('/teacher/announcements')
  revalidatePath('/parent/announcements')
}

export async function updateAnnouncement(id: string, formData: FormData) {
  if (!id || id.trim() === '') {
    throw new Error('Announcement ID is required')
  }

  const title = formData.get('title') as string | null
  if (!title || title.trim() === '') {
    throw new Error('Title is required')
  }

  const body = formData.get('body') as string | null
  if (!body || body.trim() === '') {
    throw new Error('Body is required')
  }

  const { supabase } = await requireTeacher()

  const { error } = await supabase
    .from('announcements')
    .update({ title: title.trim(), body: body.trim(), updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error

  revalidatePath('/teacher/announcements')
  revalidatePath('/parent/announcements')
}
