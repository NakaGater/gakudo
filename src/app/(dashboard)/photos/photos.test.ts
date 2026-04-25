import { describe, it, expect, vi, beforeEach } from "vitest";
import { uploadPhoto, setPhotoVisibility, deletePhoto } from "./actions";

// Mock revalidatePath
const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

// Mock getUser
const mockGetUser = vi.fn();
vi.mock("@/lib/auth/get-user", () => ({
  getUser: () => mockGetUser(),
}));

// Mock isStaff
vi.mock("@/lib/auth/roles", () => ({
  isStaff: (role: string) => role === "staff" || role === "admin",
}));

// Mock constants
vi.mock("@/config/constants", () => ({
  ERROR_MESSAGES: {
    UNAUTHORIZED: "権限がありません",
  },
}));

// Mock supabase with queue-based pattern
const callQueues = new Map<string, Array<Record<string, unknown>>>();
function enqueue(table: string, result: Record<string, unknown>) {
  if (!callQueues.has(table)) callQueues.set(table, []);
  callQueues.get(table)!.push(result);
}
function dequeue(table: string): Record<string, unknown> {
  const q = callQueues.get(table);
  if (q && q.length > 0) return q.shift()!;
  return { data: null, error: null };
}

const mockStorageUpload = vi.fn();
const mockStorageRemove = vi.fn();

const createChain = (table: string): Record<string, unknown> => {
  const handler = (): Record<string, unknown> =>
    new Proxy({} as Record<string, unknown>, {
      get: (_target, prop) => {
        if (prop === "then") {
          return (resolve: (v: unknown) => void) => resolve(dequeue(table));
        }
        if (prop === "single") {
          return () => Promise.resolve(dequeue(table));
        }
        return () => handler();
      },
    });
  return handler();
};
const mockFrom = vi.fn((table: string) => createChain(table));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      from: (...args: [string]) => mockFrom(...args),
      storage: {
        from: () => ({
          upload: (...args: unknown[]) => mockStorageUpload(...args),
          remove: (...args: unknown[]) => mockStorageRemove(...args),
        }),
      },
    }),
  ),
}));

describe("photos actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    callQueues.clear();
  });

  describe("uploadPhoto", () => {
    it("rejects non-staff", async () => {
      mockGetUser.mockResolvedValue({ role: "parent" });

      const fd = new FormData();
      fd.append("files", new File(["img"], "test.jpg", { type: "image/jpeg" }));

      const result = await uploadPhoto(fd);
      expect(result.success).toBe(false);
    });

    it("returns error for empty files", async () => {
      mockGetUser.mockResolvedValue({ role: "staff" });

      const fd = new FormData();

      const result = await uploadPhoto(fd);
      expect(result.success).toBe(false);
    });

    it("rejects non-image files", async () => {
      mockGetUser.mockResolvedValue({ role: "staff" });

      const fd = new FormData();
      fd.append(
        "files",
        new File(["content"], "test.txt", { type: "text/plain" })
      );

      const result = await uploadPhoto(fd);
      expect(result.success).toBe(false);
    });

    it("returns error on storage failure", async () => {
      mockGetUser.mockResolvedValue({ id: "user1", role: "staff" });
      mockStorageUpload.mockResolvedValue({
        error: { message: "Upload failed" },
      });

      const fd = new FormData();
      fd.append("files", new File(["img"], "test.jpg", { type: "image/jpeg" }));

      const result = await uploadPhoto(fd);
      expect(result.success).toBe(false);
    });

    it("succeeds", async () => {
      mockGetUser.mockResolvedValue({ id: "user1", role: "staff" });
      mockStorageUpload.mockResolvedValue({ data: { path: "photo-path" } });
      enqueue("photos", { data: { id: "photo1", filename: "test.jpg" } });

      const fd = new FormData();
      fd.append("files", new File(["img"], "test.jpg", { type: "image/jpeg" }));

      const result = await uploadPhoto(fd);
      expect(result.success).toBe(true);
      expect(mockRevalidatePath).toHaveBeenCalled();
    });
  });

  describe("setPhotoVisibility", () => {
    it("rejects non-admin", async () => {
      mockGetUser.mockResolvedValue({ role: "staff" });

      const result = await setPhotoVisibility("photo1", "public");
      expect(result.success).toBe(false);
    });

    it("returns error on DB failure", async () => {
      mockGetUser.mockResolvedValue({ role: "admin" });
      enqueue("photos", { error: { message: "DB error" } });

      const result = await setPhotoVisibility("photo1", "public");
      expect(result.success).toBe(false);
    });

    it("succeeds", async () => {
      mockGetUser.mockResolvedValue({ role: "admin" });
      enqueue("photos", { data: { id: "photo1", visibility: "public" } });

      const result = await setPhotoVisibility("photo1", "public");
      expect(result.success).toBe(true);
      expect(mockRevalidatePath).toHaveBeenCalled();
    });
  });

  describe("deletePhoto", () => {
    it("rejects non-staff", async () => {
      mockGetUser.mockResolvedValue({ role: "parent" });

      const result = await deletePhoto("photo1");
      expect(result.success).toBe(false);
    });

    it("returns error when photo not found", async () => {
      mockGetUser.mockResolvedValue({ id: "user1", role: "staff" });
      enqueue("photos", { data: null });

      const result = await deletePhoto("photo1");
      expect(result.success).toBe(false);
    });

    it("rejects unauthorized (not admin, not uploader)", async () => {
      mockGetUser.mockResolvedValue({ id: "user2", role: "staff" });
      enqueue("photos", { data: { id: "photo1", uploaded_by: "user1" } });

      const result = await deletePhoto("photo1");
      expect(result.success).toBe(false);
    });

    it("succeeds for admin", async () => {
      mockGetUser.mockResolvedValue({ id: "user2", role: "admin" });
      enqueue("photos", {
        data: { id: "photo1", uploaded_by: "user1", storage_path: "photo-path" },
      });
      mockStorageRemove.mockResolvedValue({ data: null });
      enqueue("photos", { data: null });

      const result = await deletePhoto("photo1");
      expect(result.success).toBe(true);
      expect(mockRevalidatePath).toHaveBeenCalled();
    });

    it("succeeds for uploader", async () => {
      mockGetUser.mockResolvedValue({ id: "user1", role: "staff" });
      enqueue("photos", {
        data: { id: "photo1", uploaded_by: "user1", storage_path: "photo-path" },
      });
      mockStorageRemove.mockResolvedValue({ data: null });
      enqueue("photos", { data: null });

      const result = await deletePhoto("photo1");
      expect(result.success).toBe(true);
      expect(mockRevalidatePath).toHaveBeenCalled();
    });
  });
});
