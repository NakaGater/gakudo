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

import PublicHomePage from '../page'

describe('PublicHomePage', () => {
  it('renders facility name "ひまわり学童クラブ"', async () => {
    const Page = await PublicHomePage()
    render(Page)
    expect(screen.getByRole('heading', { name: 'ひまわり学童クラブ' })).toBeInTheDocument()
  })
})
