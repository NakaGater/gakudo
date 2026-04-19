import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StudentForm } from '@/components/student-form'

// Mock the server action module
vi.mock('@/app/(protected)/teacher/students/actions', () => ({
  createStudent: vi.fn(),
  updateStudent: vi.fn(),
}))

describe('StudentForm', () => {
  it('renders "生徒を登録" button', () => {
    render(<StudentForm />)
    expect(screen.getByRole('button', { name: '生徒を登録' })).toBeInTheDocument()
  })

  it('renders student name input', () => {
    render(<StudentForm />)
    expect(screen.getByLabelText('名前')).toBeInTheDocument()
  })

  it('renders class name input', () => {
    render(<StudentForm />)
    expect(screen.getByLabelText('クラス名')).toBeInTheDocument()
  })
})
