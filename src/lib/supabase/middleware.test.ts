import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock NextResponse
const mockRedirect = vi.fn().mockImplementation((url) => ({ type: 'redirect', url: url.toString() }))
const mockNext = vi.fn().mockImplementation(() => ({
  cookies: { set: vi.fn() },
}))

vi.mock('next/server', () => ({
  NextResponse: {
    next: (...args: unknown[]) => mockNext(...args),
    redirect: (...args: unknown[]) => mockRedirect(...args),
  },
}))

// Mock supabase auth
const mockSupabaseGetUser = vi.fn()
const mockSupabaseProfileSelect = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: { getUser: () => mockSupabaseGetUser() },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => mockSupabaseProfileSelect(),
        }),
      }),
    }),
  }),
}))

import { updateSession } from './middleware'

function makeNextRequest(pathname: string) {
  const url = new URL(`http://localhost${pathname}`)
  return {
    cookies: {
      getAll: () => [],
      set: vi.fn(),
    },
    nextUrl: {
      pathname,
      clone: () => new URL(url),
    },
  } as unknown as import('next/server').NextRequest
}

describe('updateSession middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns next response for unauthenticated user', async () => {
    mockSupabaseGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const req = makeNextRequest('/attendance')
    const res = await updateSession(req)

    expect(mockNext).toHaveBeenCalled()
  })

  it('returns next response for non-entrance role accessing any path', async () => {
    mockSupabaseGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockSupabaseProfileSelect.mockResolvedValue({
      data: { role: 'parent' },
      error: null,
    })

    const req = makeNextRequest('/children')
    const res = await updateSession(req)

    expect(mockNext).toHaveBeenCalled()
  })

  it('allows entrance role to access /attendance', async () => {
    mockSupabaseGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockSupabaseProfileSelect.mockResolvedValue({
      data: { role: 'entrance' },
      error: null,
    })

    const req = makeNextRequest('/attendance')
    const res = await updateSession(req)

    expect(mockNext).toHaveBeenCalled()
  })

  it('allows entrance role to access /attendance/manual', async () => {
    mockSupabaseGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockSupabaseProfileSelect.mockResolvedValue({
      data: { role: 'entrance' },
      error: null,
    })

    const req = makeNextRequest('/attendance/manual')
    const res = await updateSession(req)

    expect(mockNext).toHaveBeenCalled()
  })

  it('allows entrance role to access /api/ paths', async () => {
    mockSupabaseGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockSupabaseProfileSelect.mockResolvedValue({
      data: { role: 'entrance' },
      error: null,
    })

    const req = makeNextRequest('/api/some/endpoint')
    const res = await updateSession(req)

    expect(mockNext).toHaveBeenCalled()
  })

  it('redirects entrance role from /children to /attendance/dashboard', async () => {
    mockSupabaseGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockSupabaseProfileSelect.mockResolvedValue({
      data: { role: 'entrance' },
      error: null,
    })

    const req = makeNextRequest('/children')
    const res = await updateSession(req)

    expect(mockRedirect).toHaveBeenCalled()
    const callArgs = mockRedirect.mock.calls[0][0]
    expect(callArgs.toString()).toContain('/attendance/dashboard')
  })

  it('redirects entrance role from /announcements to /attendance/dashboard', async () => {
    mockSupabaseGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockSupabaseProfileSelect.mockResolvedValue({
      data: { role: 'entrance' },
      error: null,
    })

    const req = makeNextRequest('/announcements')
    const res = await updateSession(req)

    expect(mockRedirect).toHaveBeenCalled()
    const callArgs = mockRedirect.mock.calls[0][0]
    expect(callArgs.toString()).toContain('/attendance/dashboard')
  })

  it('does NOT redirect entrance role on public paths (/, /login)', async () => {
    mockSupabaseGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockSupabaseProfileSelect.mockResolvedValue({
      data: { role: 'entrance' },
      error: null,
    })

    const req1 = makeNextRequest('/')
    const res1 = await updateSession(req1)
    expect(mockNext).toHaveBeenCalled()

    vi.clearAllMocks()
    mockSupabaseGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })
    mockSupabaseProfileSelect.mockResolvedValue({
      data: { role: 'entrance' },
      error: null,
    })

    const req2 = makeNextRequest('/login')
    const res2 = await updateSession(req2)
    expect(mockNext).toHaveBeenCalled()
  })
})
