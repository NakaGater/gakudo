import { describe, it, expect, vi, beforeEach } from "vitest";
import { uploadDocument, deleteDocument } from "./actions";

// Mock constants first
vi.mock("@/config/constants", () => ({
  FILE_LIMITS: {
    MAX_SIZE_BYTES: 10 * 1024 * 1024,
    ALLOWED_DOCUMENT_TYPES: [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ],
  },
  ERROR_MESSAGES: {
    UNAUTHORIZED: "権限がありません",
  },
}));

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
        return (..._: unknown[]) => handler();
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

describe("documents actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    callQueues.clear();
  });

  describe("uploadDocument", () => {
    it("rejects non-staff (parent)", async () => {
      mockGetUser.mockResolvedValue({ role: "parent" });

      const fd = new FormData();
      fd.append("title", "Test Doc");
      fd.append("category", "お便り");
      fd.append(
        "file",
        new File(["content"], "test.pdf", { type: "application/pdf" })
      );

      const result = await uploadDocument(null as any, fd);
      expect(result.success).toBe(false);
    });

    it("returns fieldErrors when title missing", async () => {
      mockGetUser.mockResolvedValue({ role: "staff" });

      const fd = new FormData();
      fd.append("category", "お便り");
      fd.append(
        "file",
        new File(["content"], "test.pdf", { type: "application/pdf" })
      );

      const result = await uploadDocument(null as any, fd);
      expect(result.success).toBe(false);
      expect(result.fieldErrors?.title).toBeDefined();
    });

    it("returns fieldErrors when category invalid", async () => {
      mockGetUser.mockResolvedValue({ role: "staff" });

      const fd = new FormData();
      fd.append("title", "Test");
      fd.append("category", "invalid");
      fd.append(
        "file",
        new File(["content"], "test.pdf", { type: "application/pdf" })
      );

      const result = await uploadDocument(null as any, fd);
      expect(result.success).toBe(false);
      expect(result.fieldErrors?.category).toBeDefined();
    });

    it("returns fieldErrors when file missing", async () => {
      mockGetUser.mockResolvedValue({ role: "staff" });

      const fd = new FormData();
      fd.append("title", "Test");
      fd.append("category", "お便り");

      const result = await uploadDocument(null as any, fd);
      expect(result.success).toBe(false);
      expect(result.fieldErrors?.file).toBeDefined();
    });

    it("returns error on storage upload failure", async () => {
      mockGetUser.mockResolvedValue({ id: "user1", role: "staff" });
      mockStorageUpload.mockResolvedValue({
        error: { message: "Upload failed" },
      });

      const fd = new FormData();
      fd.append("title", "Test");
      fd.append("category", "お便り");
      fd.append(
        "file",
        new File(["content"], "test.pdf", { type: "application/pdf" })
      );

      const result = await uploadDocument(null as any, fd);
      expect(result.success).toBe(false);
    });

    it("returns error on DB insert failure and cleans up storage", async () => {
      mockGetUser.mockResolvedValue({ id: "user1", role: "staff" });
      mockStorageUpload.mockResolvedValue({ data: { path: "doc-path" } });
      enqueue("documents", { error: { message: "DB error" } });

      const fd = new FormData();
      fd.append("title", "Test");
      fd.append("category", "お便り");
      fd.append(
        "file",
        new File(["content"], "test.pdf", { type: "application/pdf" })
      );

      const result = await uploadDocument(null as any, fd);
      expect(result.success).toBe(false);
      expect(mockStorageRemove).toHaveBeenCalled();
    });

    it("succeeds with valid input", async () => {
      mockGetUser.mockResolvedValue({ id: "user1", role: "staff" });
      mockStorageUpload.mockResolvedValue({ data: { path: "doc-path" } });
      enqueue("documents", {
        data: { id: "doc1", title: "Test", category: "お便り" },
      });

      const fd = new FormData();
      fd.append("title", "Test");
      fd.append("category", "お便り");
      fd.append(
        "file",
        new File(["content"], "test.pdf", { type: "application/pdf" })
      );

      const result = await uploadDocument(null as any, fd);
      expect(result.success).toBe(true);
      expect(mockRevalidatePath).toHaveBeenCalled();
    });
  });

  describe("deleteDocument", () => {
    it("returns error when document not found", async () => {
      mockGetUser.mockResolvedValue({ id: "user1" });
      enqueue("documents", { data: null });

      const result = await deleteDocument("doc1");
      expect(result.success).toBe(false);
    });

    it("rejects unauthorized user (not admin, not uploader)", async () => {
      mockGetUser.mockResolvedValue({ id: "user2", role: "staff" });
      enqueue("documents", {
        data: { id: "doc1", uploaded_by: "user1" },
      });

      const result = await deleteDocument("doc1");
      expect(result.success).toBe(false);
    });

    it("returns error on storage delete failure", async () => {
      mockGetUser.mockResolvedValue({ id: "user1", role: "admin" });
      enqueue("documents", {
        data: { id: "doc1", file_path: "doc-path" },
      });
      mockStorageRemove.mockResolvedValue({
        error: { message: "Delete failed" },
      });

      const result = await deleteDocument("doc1");
      expect(result.success).toBe(false);
    });

    it("returns error on DB delete failure", async () => {
      mockGetUser.mockResolvedValue({ id: "user1", role: "admin" });
      enqueue("documents", {
        data: { id: "doc1", file_path: "doc-path" },
      });
      mockStorageRemove.mockResolvedValue({ data: null });
      enqueue("documents", { error: { message: "DB error" } });

      const result = await deleteDocument("doc1");
      expect(result.success).toBe(false);
    });

    it("succeeds for admin", async () => {
      mockGetUser.mockResolvedValue({ id: "user2", role: "admin" });
      enqueue("documents", {
        data: { id: "doc1", uploaded_by: "user1", file_path: "doc-path" },
      });
      mockStorageRemove.mockResolvedValue({ data: null });
      enqueue("documents", { data: null });

      const result = await deleteDocument("doc1");
      expect(result.success).toBe(true);
      expect(mockRevalidatePath).toHaveBeenCalled();
    });

    it("succeeds for uploader", async () => {
      mockGetUser.mockResolvedValue({ id: "user1" });
      enqueue("documents", {
        data: { id: "doc1", uploaded_by: "user1", file_path: "doc-path" },
      });
      mockStorageRemove.mockResolvedValue({ data: null });
      enqueue("documents", { data: null });

      const result = await deleteDocument("doc1");
      expect(result.success).toBe(true);
      expect(mockRevalidatePath).toHaveBeenCalled();
    });
  });
});
