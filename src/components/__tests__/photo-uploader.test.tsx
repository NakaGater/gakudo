import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PhotoUploader } from '@/components/photo-uploader'

// Mock the server action
vi.mock('@/app/(protected)/teacher/photos/actions', () => ({
  uploadPhotos: vi.fn(),
}))

describe('PhotoUploader', () => {
  it('renders "写真をアップロード" button', () => {
    render(<PhotoUploader />)
    expect(screen.getByRole('button', { name: '写真をアップロード' })).toBeInTheDocument()
  })

  it('renders file input', () => {
    render(<PhotoUploader />)
    const fileInput = document.querySelector('input[type="file"]')
    expect(fileInput).toBeInTheDocument()
  })
})
