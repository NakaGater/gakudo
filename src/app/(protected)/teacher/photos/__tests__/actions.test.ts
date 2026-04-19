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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockOrder = vi.fn((): { data: any[]; error: null } => ({ data: [], error: null }))
const mockUpload = vi.fn(() => ({ error: null }))
const mockCreateSignedUrl = vi.fn(() => ({
  data: { signedUrl: 'https://example.com/signed' },
}))
const mockFrom = vi.fn((table: string) => {
  if (table === 'profiles') return { select: mockSelect }
  if (table === 'photos')
    return { select: vi.fn(() => ({ order: mockOrder })), insert: mockInsert }
  return {}
})
const mockStorageFrom = vi.fn(() => ({
  upload: mockUpload,
  createSignedUrl: mockCreateSignedUrl,
}))
const mockGetUser = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockFrom,
      storage: { from: mockStorageFrom },
    })
  ),
}))

// Import after mocks
import { uploadPhotos, getPhotos } from '../actions'

function makeFile(name: string, size: number = 100): File {
  const content = new Uint8Array(size)
  return new File([content], name, { type: 'image/jpeg' })
}

describe('Photo Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: authenticated teacher
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockSingle.mockResolvedValue({ data: { role: 'teacher' }, error: null })
  })

  describe('uploadPhotos', () => {
    it('throws when no files are present in formData', async () => {
      const fd = new FormData()
      await expect(uploadPhotos(fd)).rejects.toThrow('No files provided')
    })

    it('throws when file has zero size', async () => {
      const fd = new FormData()
      fd.append('files', new File([], 'empty.jpg', { type: 'image/jpeg' }))
      await expect(uploadPhotos(fd)).rejects.toThrow('Invalid file provided')
    })

    it('uploads file to storage and inserts photo record', async () => {
      const fd = new FormData()
      fd.append('files', makeFile('photo.jpg'))

      await uploadPhotos(fd)

      expect(mockStorageFrom).toHaveBeenCalledWith('photos')
      expect(mockUpload).toHaveBeenCalledTimes(1)
      expect(mockInsert).toHaveBeenCalledTimes(1)
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          uploaded_by: 'u1',
        })
      )
    })

    it('uploads multiple files', async () => {
      const fd = new FormData()
      fd.append('files', makeFile('photo1.jpg'))
      fd.append('files', makeFile('photo2.png'))

      await uploadPhotos(fd)

      expect(mockUpload).toHaveBeenCalledTimes(2)
      expect(mockInsert).toHaveBeenCalledTimes(2)
    })

    it('uses same path for storage_path and thumbnail_path', async () => {
      const fd = new FormData()
      fd.append('files', makeFile('photo.jpg'))

      await uploadPhotos(fd)

      const insertArg = mockInsert.mock.calls[0][0]
      expect(insertArg.storage_path).toBe(insertArg.thumbnail_path)
    })
  })

  describe('getPhotos', () => {
    it('returns photos with signed URLs', async () => {
      mockOrder.mockResolvedValue({
        data: [
          {
            id: 'p1',
            storage_path: 'u1/photo.jpg',
            thumbnail_path: 'u1/photo.jpg',
            uploaded_by: 'u1',
            created_at: '2026-01-01',
          },
        ],
        error: null,
      })

      const result = await getPhotos()

      expect(result).toHaveLength(1)
      expect(result[0]).toHaveProperty('url')
      expect(result[0]).toHaveProperty('thumbnailUrl')
      expect(mockCreateSignedUrl).toHaveBeenCalledWith('u1/photo.jpg', 3600)
    })

    it('returns empty array when no photos exist', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null })
      const result = await getPhotos()
      expect(result).toEqual([])
    })
  })

  describe('auth checks', () => {
    it('throws Unauthorized when no user', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })
      const fd = new FormData()
      fd.append('files', makeFile('photo.jpg'))
      await expect(uploadPhotos(fd)).rejects.toThrow('Unauthorized')
    })

    it('throws Forbidden when user is not a teacher', async () => {
      mockSingle.mockResolvedValue({ data: { role: 'parent' }, error: null })
      const fd = new FormData()
      fd.append('files', makeFile('photo.jpg'))
      await expect(uploadPhotos(fd)).rejects.toThrow('Forbidden: teacher role required')
    })

    it('throws Unauthorized for getPhotos when no user', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })
      await expect(getPhotos()).rejects.toThrow('Unauthorized')
    })

    it('throws Forbidden for getPhotos when user is not a teacher', async () => {
      mockSingle.mockResolvedValue({ data: { role: 'parent' }, error: null })
      await expect(getPhotos()).rejects.toThrow('Forbidden: teacher role required')
    })
  })
})
