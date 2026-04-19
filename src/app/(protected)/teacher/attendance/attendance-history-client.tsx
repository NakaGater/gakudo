'use client'

import { useState, useTransition } from 'react'
import { AttendanceTable } from '@/components/attendance-table'
import { getAttendanceByDate } from './actions'

type AttendanceRecord = {
  id: string
  student_id: string
  student_name: string
  date: string
  check_in_at: string
  check_out_at: string | null
}

type Props = {
  initialRecords: AttendanceRecord[]
  initialDate: string
}

export function AttendanceHistoryClient({ initialRecords, initialDate }: Props) {
  const [records, setRecords] = useState(initialRecords)
  const [date, setDate] = useState(initialDate)
  const [isPending, startTransition] = useTransition()

  function handleDateChange(newDate: string) {
    setDate(newDate)
    startTransition(async () => {
      const result = await getAttendanceByDate(newDate)
      if (result.success) {
        setRecords(result.records)
      }
    })
  }

  return (
    <div>
      {isPending && (
        <p className="text-sm text-gray-500 mb-2">読み込み中...</p>
      )}
      <AttendanceTable
        records={records}
        date={date}
        onDateChange={handleDateChange}
      />
    </div>
  )
}
