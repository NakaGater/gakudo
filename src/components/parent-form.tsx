'use client'

import { useActionState } from 'react'
import { createParent } from '@/app/(protected)/teacher/parents/actions'

type Student = {
  id: string
  name: string
  class_name: string | null
}

type Props = {
  students: Student[]
}

export function ParentForm({ students }: Props) {
  async function handleAction(_prev: unknown, formData: FormData) {
    try {
      await createParent(formData)
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
          保護者を登録しました
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
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          パスワード
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          名前
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          紐付ける生徒
        </label>
        {students.length === 0 ? (
          <p className="text-sm text-gray-500">生徒が登録されていません</p>
        ) : (
          <div className="space-y-1 max-h-48 overflow-y-auto border rounded-md p-2">
            {students.map((student) => (
              <label key={student.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="studentIds"
                  value={student.id}
                />
                {student.name}
                {student.class_name && (
                  <span className="text-gray-400">({student.class_name})</span>
                )}
              </label>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-[#F59F0A] px-4 py-2 text-sm font-medium text-white hover:bg-[#E09000] disabled:opacity-50 transition-colors"
      >
        {isPending ? '登録中...' : '保護者を登録'}
      </button>
    </form>
  )
}
