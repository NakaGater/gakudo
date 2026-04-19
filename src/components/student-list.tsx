'use client'

import { useState, useActionState } from 'react'
import { updateStudent } from '@/app/(protected)/teacher/students/actions'

type Student = {
  id: string
  name: string
  class_name: string | null
  qr_token: string
  created_at: string
}

type Props = {
  students: Student[]
}

export function StudentList({ students }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)

  async function handleUpdate(_prev: unknown, formData: FormData) {
    const id = formData.get('id') as string
    try {
      await updateStudent(id, formData)
      setEditingId(null)
      return { success: true, error: null }
    } catch (e) {
      return { success: false, error: (e as Error).message }
    }
  }

  const [state, action, isPending] = useActionState(handleUpdate, {
    success: false,
    error: null as string | null,
  })

  if (students.length === 0) {
    return <p className="text-sm text-gray-500">生徒が登録されていません</p>
  }

  return (
    <div className="space-y-3">
      {state.error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {state.error}
        </div>
      )}
      {students.map((student) => (
        <div
          key={student.id}
          className="border rounded-md p-4 bg-white shadow-sm"
        >
          {editingId === student.id ? (
            <form action={action} className="space-y-2">
              <input type="hidden" name="id" value={student.id} />
              <div>
                <label htmlFor={`name-${student.id}`} className="block text-sm font-medium text-gray-700">
                  名前
                </label>
                <input
                  id={`name-${student.id}`}
                  name="name"
                  type="text"
                  required
                  defaultValue={student.name}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor={`class-${student.id}`} className="block text-sm font-medium text-gray-700">
                  クラス名
                </label>
                <input
                  id={`class-${student.id}`}
                  name="class_name"
                  type="text"
                  defaultValue={student.class_name ?? ''}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-md bg-[#F59F0A] px-3 py-1 text-sm font-medium text-white hover:bg-[#E09000] disabled:opacity-50 transition-colors"
                >
                  {isPending ? '保存中...' : '保存'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{student.name}</p>
                {student.class_name && (
                  <p className="text-sm text-gray-500">{student.class_name}</p>
                )}
              </div>
              <button
                onClick={() => setEditingId(student.id)}
                className="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                編集
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
