import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock the actions module
vi.mock('../actions', () => ({
  getMyChildrenAttendance: vi.fn(() => Promise.resolve([])),
}))

import ParentAttendancePage from '../page'

describe('ParentAttendancePage', () => {
  it('renders "入退場" heading', async () => {
    const Page = await ParentAttendancePage()
    render(Page)
    expect(screen.getByRole('heading', { name: '入退場' })).toBeInTheDocument()
  })
})
