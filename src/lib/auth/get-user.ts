import { redirect } from 'next/navigation'
import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type AuthUser = {
  id: string
  email: string
  name: string
  role: 'parent' | 'teacher' | 'admin' | 'entrance'
}

const getCachedProfile = unstable_cache(
  async (userId: string) => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, name, role')
      .eq('id', userId)
      .single<Pick<AuthUser, 'id' | 'email' | 'name' | 'role'>>()
    if (error || !data) return null
    return data
  },
  ['user-profile'],
  { revalidate: 300, tags: ['user-profile'] }
)

export const getUser = cache(async (): Promise<AuthUser> => {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const profile = await getCachedProfile(user.id)

  if (!profile) {
    redirect('/login')
  }

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role,
  }
})
