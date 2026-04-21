import { describe, it, expect, vi, beforeEach } from 'vitest'

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

import { POST, DELETE } from './route'

const validSubscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
  keys: {
    p256dh: 'BNcR...',
    auth: 'tBH...',
  },
}

function makeRequest(body?: unknown, method = 'POST') {
  return new Request('http://localhost/api/push/subscribe', {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
}

describe('POST /api/push/subscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    })

    const res = await POST(makeRequest(validSubscription))
    expect(res.status).toBe(401)

    const json = await res.json()
    expect(json.error).toBeDefined()
  })

  it('returns 400 when body is missing or invalid', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    // Missing endpoint
    const res = await POST(makeRequest({ keys: { p256dh: 'a', auth: 'b' } }))
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json.error).toBeDefined()
  })

  it('returns 400 when keys are missing', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    const res = await POST(makeRequest({ endpoint: 'https://example.com' }))
    expect(res.status).toBe(400)
  })

  it('returns 201 on valid subscription (new)', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    // Check existing — none found
    const mockEq2 = vi.fn().mockResolvedValue({ data: [], error: null })
    const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 })

    // Insert — success
    const mockInsert = vi.fn().mockResolvedValue({ error: null })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'push_subscriptions') {
        return { select: mockSelect, insert: mockInsert }
      }
      return {}
    })

    const res = await POST(makeRequest(validSubscription))
    expect(res.status).toBe(201)

    const json = await res.json()
    expect(json.message).toBeDefined()

    expect(mockInsert).toHaveBeenCalledWith({
      user_id: 'user-123',
      subscription: validSubscription,
    })
  })

  it('returns 400 for invalid JSON body', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    const req = new Request('http://localhost/api/push/subscribe', {
      method: 'POST',
      body: '{{not valid json',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 500 on select error', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    const mockEq2 = vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } })
    const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'push_subscriptions') {
        return { select: mockSelect }
      }
      return {}
    })

    const res = await POST(makeRequest(validSubscription))
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toContain('確認')
  })

  it('returns 500 on insert error', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    const mockEq2 = vi.fn().mockResolvedValue({ data: [], error: null })
    const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 })
    const mockInsert = vi.fn().mockResolvedValue({ error: { message: 'insert failed' } })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'push_subscriptions') {
        return { select: mockSelect, insert: mockInsert }
      }
      return {}
    })

    const res = await POST(makeRequest(validSubscription))
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toContain('登録')
  })

  it('returns 200 when subscription already exists', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    const mockEq2 = vi.fn().mockResolvedValue({
      data: [{ id: 'sub-1', user_id: 'user-123', subscription: validSubscription }],
      error: null,
    })
    const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'push_subscriptions') {
        return { select: mockSelect }
      }
      return {}
    })

    const res = await POST(makeRequest(validSubscription))
    expect(res.status).toBe(200)
  })
})

describe('DELETE /api/push/subscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    })

    const res = await DELETE(makeRequest(validSubscription, 'DELETE'))
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid JSON body', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    const req = new Request('http://localhost/api/push/subscribe', {
      method: 'DELETE',
      body: '{{bad',
    })
    const res = await DELETE(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid subscription', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    const res = await DELETE(makeRequest({ endpoint: '' }, 'DELETE'))
    expect(res.status).toBe(400)
  })

  it('returns 500 on delete error', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    const mockEq2 = vi.fn().mockResolvedValue({ error: { message: 'delete failed' } })
    const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq1 })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'push_subscriptions') {
        return { delete: mockDelete }
      }
      return {}
    })

    const res = await DELETE(makeRequest(validSubscription, 'DELETE'))
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toContain('削除')
  })

  it('returns 200 on successful deletion', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    const mockEq2 = vi.fn().mockResolvedValue({ error: null })
    const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq1 })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'push_subscriptions') {
        return { delete: mockDelete }
      }
      return {}
    })

    const res = await DELETE(makeRequest(validSubscription, 'DELETE'))
    expect(res.status).toBe(200)
  })
})
