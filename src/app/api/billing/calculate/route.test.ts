import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockProfileSelect = vi.fn()
const mockChildrenSelect = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: (table: string) => {
        if (table === 'profiles') {
          return {
            select: () => ({ eq: () => ({ single: () => mockProfileSelect() }) }),
          }
        }
        if (table === 'children') {
          return { select: () => mockChildrenSelect() }
        }
        return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) }
      },
    }),
  ),
}))

const mockCalculateMonthlyBill = vi.fn()
vi.mock('@/lib/billing/calculate', () => ({
  calculateMonthlyBill: (...args: unknown[]) => mockCalculateMonthlyBill(...args),
}))

import { POST } from './route'

function makeRequest(body?: unknown, method = 'POST', url = 'http://localhost/api/billing/calculate') {
  return new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
}

describe('POST /api/billing/calculate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    })

    const res = await POST(makeRequest({ yearMonth: '2025-01' }))
    expect(res.status).toBe(401)

    const json = await res.json()
    expect(json.error).toBeDefined()
  })

  it('returns 403 for parent role', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockProfileSelect.mockResolvedValue({
      data: { role: 'parent' },
      error: null,
    })

    const res = await POST(makeRequest({ yearMonth: '2025-01' }))
    expect(res.status).toBe(403)

    const json = await res.json()
    expect(json.error).toBeDefined()
  })

  it('returns 400 for invalid JSON', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockProfileSelect.mockResolvedValue({
      data: { role: 'admin' },
      error: null,
    })

    const req = new Request('http://localhost/api/billing/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{{invalid',
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for missing yearMonth', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockProfileSelect.mockResolvedValue({
      data: { role: 'admin' },
      error: null,
    })

    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json.error).toBeDefined()
  })

  it('returns 400 for invalid yearMonth format (not YYYY-MM)', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockProfileSelect.mockResolvedValue({
      data: { role: 'admin' },
      error: null,
    })

    const res = await POST(makeRequest({ yearMonth: '2025/01' }))
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json.error).toBeDefined()
  })

  it('returns 500 on children fetch error', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockProfileSelect.mockResolvedValue({
      data: { role: 'admin' },
      error: null,
    })

    mockChildrenSelect.mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    })

    const res = await POST(makeRequest({ yearMonth: '2025-01' }))
    expect(res.status).toBe(500)

    const json = await res.json()
    expect(json.error).toBeDefined()
  })

  it('returns 500 on calculation error', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockProfileSelect.mockResolvedValue({
      data: { role: 'admin' },
      error: null,
    })

    mockChildrenSelect.mockResolvedValue({
      data: [
        { id: 'child-1', name: 'Child 1' },
        { id: 'child-2', name: 'Child 2' },
      ],
      error: null,
    })

    mockCalculateMonthlyBill.mockRejectedValueOnce(new Error('Calculation failed'))

    const res = await POST(makeRequest({ yearMonth: '2025-01' }))
    expect(res.status).toBe(500)

    const json = await res.json()
    expect(json.error).toBeDefined()
  })

  it('returns success with processed count and total', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockProfileSelect.mockResolvedValue({
      data: { role: 'admin' },
      error: null,
    })

    mockChildrenSelect.mockResolvedValue({
      data: [
        { id: 'child-1' },
        { id: 'child-2' },
      ],
      error: null,
    })

    mockCalculateMonthlyBill
      .mockResolvedValueOnce({ totalAmount: 25000 })
      .mockResolvedValueOnce({ totalAmount: 25000 })

    const res = await POST(makeRequest({ yearMonth: '2025-01' }))
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.processed).toBe(2)
    expect(json.total_amount).toBe(50000)
  })
})
