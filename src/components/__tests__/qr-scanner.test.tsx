import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QrScanner } from '@/components/qr-scanner'

// Mock html5-qrcode
vi.mock('html5-qrcode', () => {
  class MockHtml5Qrcode {
    start = vi.fn().mockResolvedValue(undefined)
    stop = vi.fn().mockResolvedValue(undefined)
    clear = vi.fn()
  }
  return { Html5Qrcode: MockHtml5Qrcode }
})

// Mock server action
vi.mock('@/app/(protected)/teacher/attendance/actions', () => ({
  scanAttendance: vi.fn(),
}))

describe('QrScanner', () => {
  it('renders camera area container', () => {
    render(<QrScanner />)
    expect(screen.getByTestId('qr-reader')).toBeInTheDocument()
  })

  it('renders back link/button', () => {
    render(<QrScanner />)
    const backLink = screen.getByRole('link', { name: /戻る/ })
    expect(backLink).toBeInTheDocument()
  })
})
