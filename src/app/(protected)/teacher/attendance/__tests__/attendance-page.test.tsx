import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AttendanceHistoryPage from '../page'

// Mock the server action
vi.mock('../actions', () => ({
  getAttendanceByDate: vi.fn().mockResolvedValue({
    success: true,
    records: [],
  }),
}))

// Mock the client component
vi.mock('../attendance-history-client', () => ({
  AttendanceHistoryClient: ({ initialRecords, initialDate }: { initialRecords: unknown[]; initialDate: string }) => (
    <div data-testid="attendance-table">
      <input type="date" defaultValue={initialDate} />
    </div>
  ),
}))

describe('AttendanceHistoryPage', () => {
  it('renders "入退場記録" heading', async () => {
    const page = await AttendanceHistoryPage({})
    render(page)
    expect(screen.getByText('入退場記録')).toBeInTheDocument()
  })

  it('renders date picker input', async () => {
    const page = await AttendanceHistoryPage({})
    render(page)
    const dateInput = screen.getByTestId('attendance-table').querySelector('input[type="date"]')
    expect(dateInput).toBeInTheDocument()
  })
})
