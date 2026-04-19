'use client'

import { useActionState } from 'react'
import { createPublicNotice } from '@/app/(protected)/teacher/notices/actions'

export function NoticeForm() {
  async function handleAction(_prev: unknown, formData: FormData) {
    try {
      await createPublicNotice(formData)
      return { success: true, error: null }
    } catch (e) {
      return { success: false, error: (e as Error).message }
    }
  }

  const [state, action, isPending] = useActionState(handleAction, {
    success: false,
    error: null as string | null,
  })

  return (
    <form action={action} className="space-y-4 max-w-md">
      {state.error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm">
          お知らせを登録しました
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          タイトル
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="body" className="block text-sm font-medium text-gray-700">
          本文
        </label>
        <textarea
          id="body"
          name="body"
          required
          rows={4}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-[#F59F0A] px-4 py-2 text-sm font-medium text-white hover:bg-[#E09000] disabled:opacity-50 transition-colors"
      >
        {isPending ? '登録中...' : 'お知らせを登録'}
      </button>
    </form>
  )
}
