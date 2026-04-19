import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import TeacherDashboardPage from '../page'

describe('TeacherDashboardPage', () => {
  it('renders dashboard heading "ダッシュボード"', () => {
    render(<TeacherDashboardPage />)
    expect(screen.getByRole('heading', { name: 'ダッシュボード' })).toBeInTheDocument()
  })
})
