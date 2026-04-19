import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock supabase client
const mockSingle = vi.fn()
const mockEq2 = vi.fn(() => ({ single: mockSingle }))
const mockEq = vi.fn(() => ({ eq: mockEq2, single: mockSingle }))
const mockSelect = vi.fn(() => ({ eq: mockEq }))
const mockInsert = vi.fn(() => ({ error: null }))
const mockUpdate = vi.fn(() => ({ eq: vi.fn(() => ({ error: null })) }))
const mockOrder = vi.fn(() => ({ data: [], error: null }))
const mockFrom = vi.fn((table: string) => {
  if (table === 'profiles') return { select: mockSelect }
  if (table === 'students') return { select: mockSelect }
  if (table === 'attendance_records')
    return {
      select: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn(() => ({ data: null, error: null })), data: [], error: null })), order: mockOrder })) })),
      insert: mockInsert,
      update: mockUpdate,
    }
  return {}
})
const mockGetUser = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockFrom,
    })
  ),
}))

// Import after mocks
import { scanAttendance, getAttendanceByDate } from '../actions'

describe('Attendance Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: authenticated teacher
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockSingle.mockResolvedValue({ data: { role: 'teacher' }, error: null })
  })

  describe('scanAttendance', () => {
    it('returns error for empty qrToken', async () => {
      const result = await scanAttendance('')
      expect(result).toEqual({ success: false, error: 'QRトークンが必要です' })
    })

    it('returns error for whitespace-only qrToken', async () => {
      const result = await scanAttendance('   ')
      expect(result).toEqual({ success: false, error: 'QRトークンが必要です' })
    })

    it('throws Unauthorized when no user', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })
      await expect(scanAttendance('valid-token')).rejects.toThrow('Unauthorized')
    })

    it('throws Forbidden when user is not a teacher', async () => {
      mockSingle.mockResolvedValue({ data: { role: 'parent' }, error: null })
      await expect(scanAttendance('valid-token')).rejects.toThrow('Forbidden: teacher role required')
    })
  })

  describe('getAttendanceByDate', () => {
    it('returns error for empty date', async () => {
      const result = await getAttendanceByDate('')
      expect(result).toEqual({ success: false, error: '日付が必要です' })
    })

    it('returns error for invalid date format', async () => {
      const result = await getAttendanceByDate('not-a-date')
      expect(result).toEqual({ success: false, error: '無効な日付形式です' })
    })

    it('returns error for whitespace-only date', async () => {
      const result = await getAttendanceByDate('   ')
      expect(result).toEqual({ success: false, error: '日付が必要です' })
    })

    it('throws Unauthorized when no user', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })
      await expect(getAttendanceByDate('2026-04-19')).rejects.toThrow('Unauthorized')
    })

    it('throws Forbidden when user is not a teacher', async () => {
      mockSingle.mockResolvedValue({ data: { role: 'parent' }, error: null })
      await expect(getAttendanceByDate('2026-04-19')).rejects.toThrow('Forbidden: teacher role required')
    })
  })
})
