import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseMock } from "@/test/supabase-mock-factory";
import { deletePhoto, setPhotoVisibility, uploadPhoto } from "./actions";

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

vi.mock("@/config/constants", () => ({
  ERROR_MESSAGES: {
    UNAUTHORIZED: "権限がありません",
  },
}));

const holder = vi.hoisted(() => ({
  current: null as ReturnType<typeof createSupabaseMock> | null,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(holder.current!.client),
}));

const enqueue = (table: string, resolved: { data: unknown; error?: unknown }) =>
  holder.current!.enqueue(table, { data: resolved.data, error: resolved.error ?? null });

describe("photos actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    holder.current = createSupabaseMock();
  });

  describe("uploadPhoto", () => {
    it("rejects non-staff", async () => {
      mockGetUser.mockResolvedValue({ role: "parent" });

      const fd = new FormData();
      fd.append(
        "files",
        new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0]), "img"], "test.jpg", {
          type: "image/jpeg",
        }),
      );

      const result = await uploadPhoto(fd);
      expect(result.success).toBe(false);
    });

    it("returns error for empty files", async () => {
      mockGetUser.mockResolvedValue({ role: "teacher" });

      const fd = new FormData();

      const result = await uploadPhoto(fd);
      expect(result.success).toBe(false);
    });

    it("rejects non-image files", async () => {
      mockGetUser.mockResolvedValue({ role: "teacher" });

      const fd = new FormData();
      fd.append("files", new File(["content"], "test.txt", { type: "text/plain" }));

      const result = await uploadPhoto(fd);
      expect(result.success).toBe(false);
    });

    it("returns error on storage failure", async () => {
      mockGetUser.mockResolvedValue({ id: "user1", role: "teacher" });
      holder.current = createSupabaseMock({
        storage: { uploadResult: { data: null, error: { message: "Upload failed" } } },
      });

      const fd = new FormData();
      fd.append(
        "files",
        new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0]), "img"], "test.jpg", {
          type: "image/jpeg",
        }),
      );

      const result = await uploadPhoto(fd);
      expect(result.success).toBe(false);
    });

    it("succeeds", async () => {
      mockGetUser.mockResolvedValue({ id: "user1", role: "teacher" });
      enqueue("photos", { data: { id: "photo1", filename: "test.jpg" } });

      const fd = new FormData();
      fd.append(
        "files",
        new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0]), "img"], "test.jpg", {
          type: "image/jpeg",
        }),
      );

      const result = await uploadPhoto(fd);
      expect(result.success).toBe(true);
      expect(mockRevalidatePath).toHaveBeenCalled();
    });
  });

  describe("setPhotoVisibility", () => {
    it("rejects non-admin", async () => {
      mockGetUser.mockResolvedValue({ role: "teacher" });

      const result = await setPhotoVisibility("photo1", "public");
      expect(result.success).toBe(false);
    });

    it("returns error on DB failure", async () => {
      mockGetUser.mockResolvedValue({ role: "admin" });
      enqueue("photos", { data: null, error: { message: "DB error" } });

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
      mockGetUser.mockResolvedValue({ id: "user1", role: "teacher" });
      enqueue("photos", { data: null });

      const result = await deletePhoto("photo1");
      expect(result.success).toBe(false);
    });

    it("rejects unauthorized (not admin, not uploader)", async () => {
      mockGetUser.mockResolvedValue({ id: "user2", role: "teacher" });
      enqueue("photos", { data: { id: "photo1", uploaded_by: "user1" } });

      const result = await deletePhoto("photo1");
      expect(result.success).toBe(false);
    });

    it("succeeds for admin", async () => {
      mockGetUser.mockResolvedValue({ id: "user2", role: "admin" });
      enqueue("photos", {
        data: { id: "photo1", uploaded_by: "user1", storage_path: "photo-path" },
      });
      enqueue("photos", { data: null });

      const result = await deletePhoto("photo1");
      expect(result.success).toBe(true);
      expect(mockRevalidatePath).toHaveBeenCalled();
    });

    it("succeeds for uploader", async () => {
      mockGetUser.mockResolvedValue({ id: "user1", role: "teacher" });
      enqueue("photos", {
        data: { id: "photo1", uploaded_by: "user1", storage_path: "photo-path" },
      });
      enqueue("photos", { data: null });

      const result = await deletePhoto("photo1");
      expect(result.success).toBe(true);
      expect(mockRevalidatePath).toHaveBeenCalled();
    });
  });
});
