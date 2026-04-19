import { getMyChildrenAttendance } from './actions'
import type { ChildAttendance } from './actions'

function formatTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function StatusBadge({ record }: { record: ChildAttendance }) {
  if (!record.checkInAt) {
    return (
      <span className="inline-block rounded-full bg-gray-200 px-3 py-0.5 text-xs font-medium text-gray-600">
        未登園
      </span>
    )
  }
  if (!record.checkOutAt) {
    return (
      <span className="inline-block rounded-full bg-green-100 px-3 py-0.5 text-xs font-medium text-green-700">
        在室中
      </span>
    )
  }
  return (
    <span className="inline-block rounded-full bg-blue-100 px-3 py-0.5 text-xs font-medium text-blue-700">
      退室済
    </span>
  )
}

export default async function ParentAttendancePage() {
  const children = await getMyChildrenAttendance()

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">入退場</h1>

      {children.length > 0 ? (
        <div className="space-y-3">
          {children.map((child) => (
            <div
              key={child.studentId}
              className="bg-white rounded-lg border border-[#F0E6D3] p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-gray-900">{child.studentName}</p>
                <StatusBadge record={child} />
              </div>
              <div className="flex gap-6 text-sm text-gray-500">
                <div>
                  <span className="text-xs text-gray-400">入場</span>
                  <p className="font-medium text-gray-700">{formatTime(child.checkInAt)}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-400">退場</span>
                  <p className="font-medium text-gray-700">{formatTime(child.checkOutAt)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">登録されたお子さまが見つかりません</p>
      )}
    </div>
  )
}
