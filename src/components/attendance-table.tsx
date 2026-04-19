'use client'

type AttendanceRecord = {
  id: string
  student_id: string
  student_name: string
  date: string
  check_in_at: string
  check_out_at: string | null
}

type Props = {
  records: AttendanceRecord[]
  date: string
  onDateChange: (date: string) => void
}

function formatTime(isoString: string): string {
  const d = new Date(isoString)
  return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
}

export function AttendanceTable({ records, date, onDateChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <input
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                生徒名
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                入場
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                退場
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {records.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-500">
                  記録がありません
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {record.student_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {formatTime(record.check_in_at)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {record.check_out_at ? (
                      <span className="text-gray-700">
                        {formatTime(record.check_out_at)}
                      </span>
                    ) : (
                      <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        在室中
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
