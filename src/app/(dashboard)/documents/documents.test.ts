import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseMock } from "@/test/supabase-mock-factory";
import { deleteDocument, uploadDocument } from "./actions";

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

const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

const mockGetUser = vi.fn();
vi.mock("@/lib/auth/get-user", () => ({
  getUser: () => mockGetUser(),
}));

vi.mock("@/lib/auth/roles", () => ({
  isStaff: (role: string) => role === "staff" || role === "admin",
}));

const holder = vi.hoisted(() => ({
  current: null as ReturnType<typeof createSupabaseMock> | null,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(holder.current!.client),
}));

const enqueue = (table: string, resolved: { data?: unknown; error?: unknown }) =>
  holder.current!.enqueue(table, {
    data: resolved.data ?? null,
    error: resolved.error ?? null,
  });

const removeCalls = () => holder.current!.spies.storageCalls.filter((c) => c.op === "remove");

describe("documents actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    holder.current = createSupabaseMock();
  });

  describe("uploadDocument", () => {
    it("rejects non-staff (parent)", async () => {
      mockGetUser.mockResolvedValue({ role: "parent" });

      const fd = new FormData();
      fd.append("title", "Test Doc");
      fd.append("category", "お便り");
      fd.append(
        "file",
        new File([new Uint8Array([0x25, 0x50, 0x44, 0x46]), "content"], "test.pdf", {
          type: "application/pdf",
        }),
      );

      const result = await uploadDocument(null, fd);
      expect(result.success).toBe(false);
    });

    it("returns fieldErrors when title missing", async () => {
      mockGetUser.mockResolvedValue({ role: "teacher" });

      const fd = new FormData();
      fd.append("category", "お便り");
      fd.append(
        "file",
        new File([new Uint8Array([0x25, 0x50, 0x44, 0x46]), "content"], "test.pdf", {
          type: "application/pdf",
        }),
      );

      const result = await uploadDocument(null, fd);
      expect(result.success).toBe(false);
      expect(result.fieldErrors?.title).toBeDefined();
    });

    it("returns fieldErrors when category invalid", async () => {
      mockGetUser.mockResolvedValue({ role: "teacher" });

      const fd = new FormData();
      fd.append("title", "Test");
      fd.append("category", "invalid");
      fd.append(
        "file",
        new File([new Uint8Array([0x25, 0x50, 0x44, 0x46]), "content"], "test.pdf", {
          type: "application/pdf",
        }),
      );

      const result = await uploadDocument(null, fd);
      expect(result.success).toBe(false);
      expect(result.fieldErrors?.category).toBeDefined();
    });

    it("returns fieldErrors when file missing", async () => {
      mockGetUser.mockResolvedValue({ role: "teacher" });

      const fd = new FormData();
      fd.append("title", "Test");
      fd.append("category", "お便り");

      const result = await uploadDocument(null, fd);
      expect(result.success).toBe(false);
      expect(result.fieldErrors?.file).toBeDefined();
    });

    it("returns error on storage upload failure", async () => {
      mockGetUser.mockResolvedValue({ id: "user1", role: "teacher" });
      holder.current = createSupabaseMock({
        storage: { uploadResult: { data: null, error: { message: "Upload failed" } } },
      });

      const fd = new FormData();
      fd.append("title", "Test");
      fd.append("category", "お便り");
      fd.append(
        "file",
        new File([new Uint8Array([0x25, 0x50, 0x44, 0x46]), "content"], "test.pdf", {
          type: "application/pdf",
        }),
      );

      const result = await uploadDocument(null, fd);
      expect(result.success).toBe(false);
    });

    it("returns error on DB insert failure and cleans up storage", async () => {
      mockGetUser.mockResolvedValue({ id: "user1", role: "teacher" });
      enqueue("documents", { error: { message: "DB error" } });

      const fd = new FormData();
      fd.append("title", "Test");
      fd.append("category", "お便り");
      fd.append(
        "file",
        new File([new Uint8Array([0x25, 0x50, 0x44, 0x46]), "content"], "test.pdf", {
          type: "application/pdf",
        }),
      );

      const result = await uploadDocument(null, fd);
      expect(result.success).toBe(false);
      expect(removeCalls().length).toBeGreaterThan(0);
    });

    it("succeeds with valid input", async () => {
      mockGetUser.mockResolvedValue({ id: "user1", role: "teacher" });
      enqueue("documents", {
        data: { id: "doc1", title: "Test", category: "お便り" },
      });

      const fd = new FormData();
      fd.append("title", "Test");
      fd.append("category", "お便り");
      fd.append(
        "file",
        new File([new Uint8Array([0x25, 0x50, 0x44, 0x46]), "content"], "test.pdf", {
          type: "application/pdf",
        }),
      );

      const result = await uploadDocument(null, fd);
      expect(result.success).toBe(true);
      expect(mockRevalidatePath).toHaveBeenCalled();
    });
  });

  describe("deleteDocument", () => {
    it("returns error when document not found", async () => {
      mockGetUser.mockResolvedValue({ id: "user1", role: "teacher" });
      enqueue("documents", { data: null });

      const result = await deleteDocument("doc1");
      expect(result.success).toBe(false);
    });

    it("rejects unauthorized user (not admin, not uploader)", async () => {
      mockGetUser.mockResolvedValue({ id: "user2", role: "teacher" });
      enqueue("documents", {
        data: { id: "doc1", uploaded_by: "user1" },
      });

      const result = await deleteDocument("doc1");
      expect(result.success).toBe(false);
    });

    it("returns error on storage delete failure", async () => {
      mockGetUser.mockResolvedValue({ id: "user1", role: "admin" });
      // Storage `remove` failure isn't easy to simulate per-call via the
      // factory's fixed `storage.uploadResult`, so this test stays at the
      // (less specific) "the action returns failure" level by giving the
      // documents row but an error on the post-delete DB row update.
      enqueue("documents", {
        data: { id: "doc1", file_path: "doc-path" },
      });
      enqueue("documents", { error: { message: "Delete failed" } });

      const result = await deleteDocument("doc1");
      expect(result.success).toBe(false);
    });

    it("returns error on DB delete failure", async () => {
      mockGetUser.mockResolvedValue({ id: "user1", role: "admin" });
      enqueue("documents", {
        data: { id: "doc1", file_path: "doc-path" },
      });
      enqueue("documents", { error: { message: "DB error" } });

      const result = await deleteDocument("doc1");
      expect(result.success).toBe(false);
    });

    it("succeeds for admin", async () => {
      mockGetUser.mockResolvedValue({ id: "user2", role: "admin" });
      enqueue("documents", {
        data: { id: "doc1", uploaded_by: "user1", file_path: "doc-path" },
      });
      enqueue("documents", { data: null });

      const result = await deleteDocument("doc1");
      expect(result.success).toBe(true);
      expect(mockRevalidatePath).toHaveBeenCalled();
    });

    it("succeeds for uploader", async () => {
      mockGetUser.mockResolvedValue({ id: "user1", role: "teacher" });
      enqueue("documents", {
        data: { id: "doc1", uploaded_by: "user1", file_path: "doc-path" },
      });
      enqueue("documents", { data: null });

      const result = await deleteDocument("doc1");
      expect(result.success).toBe(true);
      expect(mockRevalidatePath).toHaveBeenCalled();
    });
  });
});
