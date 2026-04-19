import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ParentForm } from '@/components/parent-form'

// Mock the server action module
vi.mock('@/app/(protected)/teacher/parents/actions', () => ({
  createParent: vi.fn(),
}))

describe('ParentForm', () => {
  const defaultStudents = [
    { id: '1', name: '山田太郎', class_name: 'A組' },
    { id: '2', name: '佐藤花子', class_name: 'B組' },
  ]

  it('renders email input', () => {
    render(<ParentForm students={defaultStudents} />)
    expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument()
  })

  it('renders password input', () => {
    render(<ParentForm students={defaultStudents} />)
    expect(screen.getByLabelText('パスワード')).toBeInTheDocument()
  })

  it('renders name input', () => {
    render(<ParentForm students={defaultStudents} />)
    expect(screen.getByLabelText('名前')).toBeInTheDocument()
  })

  it('renders create button "保護者を登録"', () => {
    render(<ParentForm students={defaultStudents} />)
    expect(screen.getByRole('button', { name: '保護者を登録' })).toBeInTheDocument()
  })

  it('renders student checkboxes', () => {
    render(<ParentForm students={defaultStudents} />)
    expect(screen.getByLabelText(/山田太郎/)).toBeInTheDocument()
    expect(screen.getByLabelText(/佐藤花子/)).toBeInTheDocument()
  })

  it('shows message when no students available', () => {
    render(<ParentForm students={[]} />)
    expect(screen.getByText('生徒が登録されていません')).toBeInTheDocument()
  })
})
