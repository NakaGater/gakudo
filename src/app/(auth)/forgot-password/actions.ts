'use server'

import { createClient } from '@/lib/supabase/server'

export type ForgotPasswordState = {
  error: string
  success: boolean
}

export async function forgotPassword(
  _prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const email = formData.get('email') as string

  if (!email) {
    return { error: 'メールアドレスを入力してください', success: false }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
  })

  if (error) {
    return { error: 'リセットメールの送信に失敗しました', success: false }
  }

  return { error: '', success: true }
}
