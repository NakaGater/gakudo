import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TeacherNav } from '../teacher-nav'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/teacher',
}))

describe('TeacherNav', () => {
  it('renders logo text "がくどう"', () => {
    render(<TeacherNav />)
    // Mobile + desktop sidebars both render logo
    const logos = screen.getAllByText('がくどう')
    expect(logos.length).toBeGreaterThanOrEqual(1)
  })

  it('renders all navigation items', () => {
    render(<TeacherNav />)
    expect(screen.getAllByText('生徒管理').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('入退場記録').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('入退場スキャン').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('連絡事項').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('写真').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('公開お知らせ').length).toBeGreaterThanOrEqual(1)
  })

  it('renders navigation links with correct hrefs', () => {
    render(<TeacherNav />)
    const studentLinks = screen.getAllByRole('link', { name: '生徒管理' })
    expect(studentLinks[0]).toHaveAttribute('href', '/teacher/students')

    const attendanceLinks = screen.getAllByRole('link', { name: '入退場記録' })
    expect(attendanceLinks[0]).toHaveAttribute('href', '/teacher/attendance')

    const scanLinks = screen.getAllByRole('link', { name: '入退場スキャン' })
    expect(scanLinks[0]).toHaveAttribute('href', '/teacher/attendance/scan')

    const announcementLinks = screen.getAllByRole('link', { name: '連絡事項' })
    expect(announcementLinks[0]).toHaveAttribute('href', '/teacher/announcements')

    const photoLinks = screen.getAllByRole('link', { name: '写真' })
    expect(photoLinks[0]).toHaveAttribute('href', '/teacher/photos')

    const noticeLinks = screen.getAllByRole('link', { name: '公開お知らせ' })
    expect(noticeLinks[0]).toHaveAttribute('href', '/teacher/notices')
  })

  it('renders logout button', () => {
    render(<TeacherNav />)
    const buttons = screen.getAllByRole('button', { name: /ログアウト/i })
    expect(buttons.length).toBeGreaterThanOrEqual(1)
  })
})
