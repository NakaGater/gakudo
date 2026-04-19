'use server'

import { createClient } from '@/lib/supabase/server'

export type ResetPasswordState = {
  error: string
  success: boolean
}

export async function resetPassword(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!password || !confirmPassword) {
    return { error: 'パスワードを入力してください', success: false }
  }

  if (password !== confirmPassword) {
    return { error: 'パスワードが一致しません', success: false }
  }

  if (password.length < 6) {
    return { error: 'パスワードは6文字以上にしてください', success: false }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    return { error: 'パスワードの更新に失敗しました', success: false }
  }

  return { error: '', success: true }
}
