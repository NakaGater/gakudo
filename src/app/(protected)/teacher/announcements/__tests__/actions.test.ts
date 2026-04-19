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
  if (table === 'announcements')
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
import { createAnnouncement, updateAnnouncement } from '../actions'

function makeFormData(entries: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(entries)) {
    fd.set(k, v)
  }
  return fd
}

describe('Announcement Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: authenticated teacher
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockSingle.mockResolvedValue({ data: { role: 'teacher' }, error: null })
  })

  describe('createAnnouncement', () => {
    it('throws when title is missing', async () => {
      const fd = makeFormData({ body: 'some body' })
      await expect(createAnnouncement(fd)).rejects.toThrow('Title is required')
    })

    it('throws when title is empty string', async () => {
      const fd = makeFormData({ title: '   ', body: 'some body' })
      await expect(createAnnouncement(fd)).rejects.toThrow('Title is required')
    })

    it('throws when body is missing', async () => {
      const fd = makeFormData({ title: 'A title' })
      await expect(createAnnouncement(fd)).rejects.toThrow('Body is required')
    })

    it('throws when body is empty string', async () => {
      const fd = makeFormData({ title: 'A title', body: '   ' })
      await expect(createAnnouncement(fd)).rejects.toThrow('Body is required')
    })

    it('inserts announcement when valid data provided', async () => {
      const fd = makeFormData({ title: 'お知らせ', body: '本文です' })
      await createAnnouncement(fd)
      expect(mockInsert).toHaveBeenCalledWith({
        title: 'お知らせ',
        body: '本文です',
        author_id: 'u1',
      })
    })
  })

  describe('updateAnnouncement', () => {
    it('throws when id is empty', async () => {
      const fd = makeFormData({ title: 'A title', body: 'A body' })
      await expect(updateAnnouncement('', fd)).rejects.toThrow('Announcement ID is required')
    })

    it('throws when title is missing', async () => {
      const fd = makeFormData({ body: 'A body' })
      await expect(updateAnnouncement('abc-123', fd)).rejects.toThrow('Title is required')
    })

    it('throws when body is missing', async () => {
      const fd = makeFormData({ title: 'A title' })
      await expect(updateAnnouncement('abc-123', fd)).rejects.toThrow('Body is required')
    })

    it('updates announcement when valid data provided', async () => {
      const fd = makeFormData({ title: '更新タイトル', body: '更新本文' })
      await updateAnnouncement('abc-123', fd)
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ title: '更新タイトル', body: '更新本文' })
      )
      expect(mockUpdateEq).toHaveBeenCalledWith('id', 'abc-123')
    })
  })

  describe('auth checks', () => {
    it('throws Unauthorized when no user', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })
      const fd = makeFormData({ title: 'test', body: 'test' })
      await expect(createAnnouncement(fd)).rejects.toThrow('Unauthorized')
    })

    it('throws Forbidden when user is not a teacher', async () => {
      mockSingle.mockResolvedValue({ data: { role: 'parent' }, error: null })
      const fd = makeFormData({ title: 'test', body: 'test' })
      await expect(createAnnouncement(fd)).rejects.toThrow('Forbidden: teacher role required')
    })
  })
})
