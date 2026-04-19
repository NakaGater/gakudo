'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type LoginState = {
  error: string
}

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'メールアドレスとパスワードを入力してください' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: 'メールアドレスまたはパスワードが正しくありません' }
  }

  // Get user's role to determine redirect
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'ログインに失敗しました' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'teacher') {
    redirect('/teacher')
  } else {
    redirect('/parent')
  }
}
