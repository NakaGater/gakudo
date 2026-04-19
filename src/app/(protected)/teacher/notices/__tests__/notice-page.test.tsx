import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NoticeForm } from '@/components/notice-form'

// Mock the server action module
vi.mock('@/app/(protected)/teacher/notices/actions', () => ({
  createPublicNotice: vi.fn(),
}))

describe('NoticeForm', () => {
  it('renders "お知らせを登録" button', () => {
    render(<NoticeForm />)
    expect(screen.getByRole('button', { name: 'お知らせを登録' })).toBeInTheDocument()
  })

  it('renders title input', () => {
    render(<NoticeForm />)
    expect(screen.getByLabelText('タイトル')).toBeInTheDocument()
  })
})
