import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QrCardGenerator } from '@/components/qr-card-generator'

// Mock qrcode and jspdf
vi.mock('qrcode', () => ({
  default: { toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mock') },
  toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mock'),
}))

vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(() => ({
    addImage: vi.fn(),
    text: vi.fn(),
    addPage: vi.fn(),
    save: vi.fn(),
    internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
  })),
}))

describe('QrCardGenerator', () => {
  const students = [
    { id: '1', name: '山田太郎', class_name: 'A組', qr_token: 'token-1' },
    { id: '2', name: '佐藤花子', class_name: 'B組', qr_token: 'token-2' },
  ]

  it('renders "QRカードをPDF出力" button', () => {
    render(<QrCardGenerator students={students} />)
    expect(screen.getByRole('button', { name: 'QRカードをPDF出力' })).toBeInTheDocument()
  })
})
