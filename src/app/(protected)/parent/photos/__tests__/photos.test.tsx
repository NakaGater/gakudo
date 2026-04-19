import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: () => ({
      select: () => ({
        order: () => ({ data: [], error: null }),
      }),
    }),
    storage: {
      from: () => ({
        createSignedUrl: () => ({ data: { signedUrl: 'https://example.com/photo.jpg' } }),
      }),
    },
  })),
}))

import ParentPhotosPage from '../page'

describe('ParentPhotosPage', () => {
  it('renders "写真" heading', async () => {
    const Page = await ParentPhotosPage()
    render(Page)
    expect(screen.getByRole('heading', { name: '写真' })).toBeInTheDocument()
  })
})
