import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type AuthUser = {
  id: string
  email: string
  name: string
  role: 'parent' | 'teacher' | 'admin'
}

export async function getUser(): Promise<AuthUser> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, name, role')
    .eq('id', user.id)
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
}
