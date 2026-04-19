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
  })),
}))

import ParentAnnouncementsPage from '../page'

describe('ParentAnnouncementsPage', () => {
  it('renders "連絡事項" heading', async () => {
    const Page = await ParentAnnouncementsPage()
    render(Page)
    expect(screen.getByRole('heading', { name: '連絡事項' })).toBeInTheDocument()
  })
})
