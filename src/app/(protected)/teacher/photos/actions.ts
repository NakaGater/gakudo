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

export async function uploadPhotos(formData: FormData) {
  const files = formData.getAll('files') as File[]
  if (!files || files.length === 0) {
    throw new Error('No files provided')
  }

  // Validate that entries are actual files
  for (const file of files) {
    if (!(file instanceof File) || file.size === 0) {
      throw new Error('Invalid file provided')
    }
  }

  const { supabase, user } = await requireTeacher()

  const results = []

  for (const file of files) {
    const ext = file.name.split('.').pop() || 'jpg'
    const storagePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      })
    if (uploadError) throw uploadError

    const { error: insertError } = await supabase.from('photos').insert({
      storage_path: storagePath,
      thumbnail_path: storagePath, // same path for now; thumbnail generation can be added later
      uploaded_by: user.id,
    })
    if (insertError) throw insertError

    results.push(storagePath)
  }

  revalidatePath('/teacher/photos')
  return results
}

export async function getPhotos() {
  const { supabase } = await requireTeacher()

  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error

  // Generate signed URLs for each photo (1 hour expiry)
  const photosWithUrls = await Promise.all(
    (data ?? []).map(async (photo) => {
      const { data: signedUrlData } = await supabase.storage
        .from('photos')
        .createSignedUrl(photo.storage_path, 3600)

      const { data: thumbUrlData } = await supabase.storage
        .from('photos')
        .createSignedUrl(photo.thumbnail_path, 3600)

      return {
        ...photo,
        url: signedUrlData?.signedUrl ?? null,
        thumbnailUrl: thumbUrlData?.signedUrl ?? null,
      }
    })
  )

  return photosWithUrls
}
