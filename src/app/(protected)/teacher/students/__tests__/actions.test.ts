import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock supabase client
const mockSingle = vi.fn()
const mockEq = vi.fn(() => ({ single: mockSingle }))
const mockSelect = vi.fn(() => ({ eq: mockEq }))
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockInsert: ReturnType<typeof vi.fn<(...args: any[]) => any>> = vi.fn(() => ({ error: null }))
const mockOrder = vi.fn(() => ({ data: [], error: null }))
const mockUpdateEq = vi.fn(() => ({ error: null }))
const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }))
const mockFrom = vi.fn((table: string) => {
  if (table === 'profiles') return { select: mockSelect }
  if (table === 'students')
    return { select: vi.fn(() => ({ order: mockOrder })), insert: mockInsert, update: mockUpdate }
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
import { createStudent, updateStudent } from '../actions'

function makeFormData(entries: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(entries)) {
    fd.set(k, v)
  }
  return fd
}

describe('Student Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: authenticated teacher
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockSingle.mockResolvedValue({ data: { role: 'teacher' }, error: null })
  })

  describe('createStudent', () => {
    it('throws when name is missing', async () => {
      const fd = makeFormData({})
      await expect(createStudent(fd)).rejects.toThrow('Name is required')
    })

    it('throws when name is empty string', async () => {
      const fd = makeFormData({ name: '   ' })
      await expect(createStudent(fd)).rejects.toThrow('Name is required')
    })

    it('inserts student when valid data provided', async () => {
      const fd = makeFormData({ name: '田中太郎', class_name: '1-A' })
      await createStudent(fd)
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ name: '田中太郎', class_name: '1-A' })
      )
      // qr_token should be present
      const insertArg = mockInsert.mock.calls[0]?.[0] as Record<string, unknown> | undefined
      expect(insertArg).toBeDefined()
      expect(insertArg!.qr_token).toBeDefined()
      expect(typeof insertArg!.qr_token).toBe('string')
    })
  })

  describe('updateStudent', () => {
    it('throws when id is empty', async () => {
      const fd = makeFormData({ name: '田中太郎' })
      await expect(updateStudent('', fd)).rejects.toThrow('Student ID is required')
    })

    it('throws when id is whitespace', async () => {
      const fd = makeFormData({ name: '田中太郎' })
      await expect(updateStudent('   ', fd)).rejects.toThrow('Student ID is required')
    })

    it('throws when name is missing', async () => {
      const fd = makeFormData({})
      await expect(updateStudent('abc-123', fd)).rejects.toThrow('Name is required')
    })

    it('updates student when valid data provided', async () => {
      const fd = makeFormData({ name: '佐藤花子', class_name: '2-B' })
      await updateStudent('abc-123', fd)
      expect(mockUpdate).toHaveBeenCalledWith({ name: '佐藤花子', class_name: '2-B' })
      expect(mockUpdateEq).toHaveBeenCalledWith('id', 'abc-123')
    })
  })

  describe('auth checks', () => {
    it('throws Unauthorized when no user', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })
      const fd = makeFormData({ name: 'test' })
      await expect(createStudent(fd)).rejects.toThrow('Unauthorized')
    })

    it('throws Forbidden when user is not a teacher', async () => {
      mockSingle.mockResolvedValue({ data: { role: 'parent' }, error: null })
      const fd = makeFormData({ name: 'test' })
      await expect(createStudent(fd)).rejects.toThrow('Forbidden: teacher role required')
    })
  })
})
