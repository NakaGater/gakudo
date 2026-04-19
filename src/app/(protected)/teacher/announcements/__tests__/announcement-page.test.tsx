import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AnnouncementForm } from '@/components/announcement-form'

// Mock the server action module
vi.mock('@/app/(protected)/teacher/announcements/actions', () => ({
  createAnnouncement: vi.fn(),
}))

describe('AnnouncementForm', () => {
  it('renders "連絡事項を登録" button', () => {
    render(<AnnouncementForm />)
    expect(screen.getByRole('button', { name: '連絡事項を登録' })).toBeInTheDocument()
  })

  it('renders title input', () => {
    render(<AnnouncementForm />)
    expect(screen.getByLabelText('タイトル')).toBeInTheDocument()
  })

  it('renders body textarea', () => {
    render(<AnnouncementForm />)
    expect(screen.getByLabelText('本文')).toBeInTheDocument()
  })
})
