import { getAttendanceByDate } from './actions'
import { AttendanceHistoryClient } from './attendance-history-client'

export default async function AttendanceHistoryPage({}: {
  searchParams?: Promise<{ date?: string }>
}) {
  const today = new Date().toISOString().split('T')[0]
  const result = await getAttendanceByDate(today)
  const records = result.success ? result.records : []

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">入退場記録</h1>
      <AttendanceHistoryClient initialRecords={records} initialDate={today} />
    </div>
  )
}
