import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ScanPage from '@/app/(protected)/teacher/attendance/scan/page'

// Mock QrScanner component
vi.mock('@/components/qr-scanner', () => ({
  QrScanner: () => <div data-testid="qr-scanner-mock">QrScanner</div>,
}))

describe('ScanPage', () => {
  it('renders the scan page', () => {
    render(<ScanPage />)
    expect(screen.getByTestId('qr-scanner-mock')).toBeInTheDocument()
  })
})
