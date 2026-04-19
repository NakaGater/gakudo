import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AttendanceTable } from '../attendance-table'

describe('AttendanceTable', () => {
  it('renders table headers (生徒名, 入場, 退場)', () => {
    render(
      <AttendanceTable
        records={[]}
        date="2026-04-19"
        onDateChange={() => {}}
      />
    )
    expect(screen.getByText('生徒名')).toBeInTheDocument()
    expect(screen.getByText('入場')).toBeInTheDocument()
    expect(screen.getByText('退場')).toBeInTheDocument()
  })

  it('renders student records with check-in and check-out times', () => {
    render(
      <AttendanceTable
        records={[
          {
            id: '1',
            student_id: 's1',
            student_name: 'テスト太郎',
            date: '2026-04-19',
            check_in_at: '2026-04-19T08:30:00.000Z',
            check_out_at: '2026-04-19T17:00:00.000Z',
          },
        ]}
        date="2026-04-19"
        onDateChange={() => {}}
      />
    )
    expect(screen.getByText('テスト太郎')).toBeInTheDocument()
  })

  it('shows "在室中" when check_out_at is null', () => {
    render(
      <AttendanceTable
        records={[
          {
            id: '2',
            student_id: 's2',
            student_name: 'テスト花子',
            date: '2026-04-19',
            check_in_at: '2026-04-19T09:00:00.000Z',
            check_out_at: null,
          },
        ]}
        date="2026-04-19"
        onDateChange={() => {}}
      />
    )
    expect(screen.getByText('在室中')).toBeInTheDocument()
  })

  it('renders date picker input', () => {
    render(
      <AttendanceTable
        records={[]}
        date="2026-04-19"
        onDateChange={() => {}}
      />
    )
    const dateInput = screen.getByDisplayValue('2026-04-19')
    expect(dateInput).toBeInTheDocument()
    expect(dateInput).toHaveAttribute('type', 'date')
  })
})
