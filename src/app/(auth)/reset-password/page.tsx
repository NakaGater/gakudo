'use client'

import Link from 'next/link'
import { resetPassword } from './actions'
import { useActionState } from 'react'

export default function ResetPasswordPage() {
  const [state, formAction, isPending] = useActionState(resetPassword, {
    error: '',
    success: false,
  })

  return (
    <div className="w-full max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-center mb-8">パスワード再設定</h1>

      {state.success ? (
        <div className="space-y-4">
          <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
            パスワードを更新しました。
          </div>
          <p className="text-center text-sm text-gray-500">
            <Link href="/login" className="text-[#F59F0A] hover:underline">
              ログインに戻る
            </Link>
          </p>
        </div>
      ) : (
        <form action={formAction} className="space-y-6">
          {state.error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-700" role="alert">
              {state.error}
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              新しいパスワード
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#F59F0A] focus:outline-none focus:ring-1 focus:ring-[#F59F0A]"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              パスワード確認
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#F59F0A] focus:outline-none focus:ring-1 focus:ring-[#F59F0A]"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md bg-[#F59F0A] px-4 py-2 text-white font-medium hover:bg-[#d88f09] focus:outline-none focus:ring-2 focus:ring-[#F59F0A] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? '更新中...' : 'パスワードを更新'}
          </button>
        </form>
      )}
    </div>
  )
}
