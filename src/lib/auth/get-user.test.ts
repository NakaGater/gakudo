import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next/navigation
const mockRedirect = vi.fn<(url: string) => never>()
vi.mock('next/navigation', () => ({
  redirect: (...args: Parameters<typeof mockRedirect>) => {
    mockRedirect(...args)
    throw new Error(`NEXT_REDIRECT:${args[0]}`)
  },
}))

// Mock Supabase server client
const mockGetUser = vi.fn()
const mockFrom = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockFrom,
    }),
  ),
}))

// Import after mocks are set up
import { getUser } from './get-user'

describe('getUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns user profile when authenticated', async () => {
    const mockAuthUser = {
      id: 'user-123',
      email: 'test@example.com',
    }
    const mockProfile = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'parent' as const,
    }

    mockGetUser.mockResolvedValue({
      data: { user: mockAuthUser },
      error: null,
    })
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      }),
    })

    const result = await getUser()

    expect(result).toEqual({
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'parent',
    })
  })

  it('redirects to /login when not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    })

    await expect(getUser()).rejects.toThrow('NEXT_REDIRECT:/login')
    expect(mockRedirect).toHaveBeenCalledWith('/login')
  })

  it('redirects to /login when profile not found', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: 'user-123', email: 'test@example.com' },
      },
      error: null,
    })
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Not found' },
          }),
        }),
      }),
    })

    await expect(getUser()).rejects.toThrow('NEXT_REDIRECT:/login')
    expect(mockRedirect).toHaveBeenCalledWith('/login')
  })
})
