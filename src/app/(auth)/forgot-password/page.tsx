'use client'

import Link from 'next/link'
import { forgotPassword } from './actions'
import { useActionState } from 'react'

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(forgotPassword, {
    error: '',
    success: false,
  })

  return (
    <div className="w-full max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-center mb-8">パスワードリセット</h1>

      {state.success ? (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
          リセット用のメールを送信しました。メールをご確認ください。
        </div>
      ) : (
        <form action={formAction} className="space-y-6">
          {state.error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-700" role="alert">
              {state.error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              メールアドレス
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#F59F0A] focus:outline-none focus:ring-1 focus:ring-[#F59F0A]"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md bg-[#F59F0A] px-4 py-2 text-white font-medium hover:bg-[#d88f09] focus:outline-none focus:ring-2 focus:ring-[#F59F0A] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? '送信中...' : 'リセットメールを送信'}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-gray-500">
        <Link href="/login" className="text-[#F59F0A] hover:underline">
          ログインに戻る
        </Link>
      </p>
    </div>
  )
}
