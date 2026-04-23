import { redirect } from 'next/navigation'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export type AuthUser = {
  id: string
  email: string
  name: string
  role: 'parent' | 'teacher' | 'admin' | 'entrance'
}

export const getUser = cache(async (): Promise<AuthUser> => {
  const supabase = await createClient()

  // getSession() reads JWT from cookie without network call (fast)
  // JWT signature still prevents tampering
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session?.user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, name, role')
    .eq('id', session.user.id)
    .single<Pick<AuthUser, 'id' | 'email' | 'name' | 'role'>>()

  if (profileError || !profile) {
    redirect('/login')
  }

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role,
  }
})
