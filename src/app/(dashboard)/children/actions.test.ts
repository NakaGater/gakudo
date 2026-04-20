import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/cache
const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

// Mock next/navigation
const mockRedirect = vi.fn<(url: string) => never>();
vi.mock("next/navigation", () => ({
  redirect: (...args: Parameters<typeof mockRedirect>) => {
    mockRedirect(...args);
    throw new Error(`NEXT_REDIRECT:${args[0]}`);
  },
}));

// Mock getUser
const mockGetUser = vi.fn();
vi.mock("@/lib/auth/get-user", () => ({
  getUser: () => mockGetUser(),
}));

// Mock Supabase
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockFrom = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      from: (...args: unknown[]) => mockFrom(...args),
    }),
  ),
}));

import { createChild, updateChild, deleteChild } from "./actions";

describe("children server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    });
  });

  describe("createChild", () => {
    it("rejects non-staff users", async () => {
      mockGetUser.mockResolvedValue({ id: "u1", role: "parent" });
      const fd = new FormData();
      fd.set("name", "テスト太郎");
      fd.set("grade", "3");

      const result = await createChild(null, fd);
      expect(result).toMatchObject({
        success: false,
        message: expect.stringContaining("権限"),
      });
    });

    it("validates required name", async () => {
      mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
      const fd = new FormData();
      fd.set("name", "");
      fd.set("grade", "3");

      const result = await createChild(null, fd);
      expect(result).toMatchObject({
        success: false,
        message: expect.stringContaining("名前"),
      });
    });

    it("validates grade must be 1-6", async () => {
      mockGetUser.mockResolvedValue({ id: "u1", role: "teacher" });
      const fd = new FormData();
      fd.set("name", "テスト太郎");
      fd.set("grade", "7");

      const result = await createChild(null, fd);
      expect(result).toMatchObject({
        success: false,
        message: expect.stringContaining("学年"),
      });
    });

    it("creates child with GK- prefixed QR code", async () => {
      mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
      const mockSelect = vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: "child-1" },
          error: null,
        }),
      });
      mockInsert.mockReturnValue({ select: mockSelect });

      const fd = new FormData();
      fd.set("name", "テスト太郎");
      fd.set("grade", "3");

      const result = await createChild(null, fd);
      expect(result).toMatchObject({ success: true });
      expect(mockFrom).toHaveBeenCalledWith("children");
      // Verify the inserted data has GK- prefix QR code
      const insertArg = mockInsert.mock.calls[0][0];
      expect(insertArg.name).toBe("テスト太郎");
      expect(insertArg.grade).toBe(3);
      expect(insertArg.qr_code).toMatch(/^GK-[A-Z0-9]{8}$/);
    });

    it("allows teacher role", async () => {
      mockGetUser.mockResolvedValue({ id: "u1", role: "teacher" });
      const mockSelect = vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: "child-1" },
          error: null,
        }),
      });
      mockInsert.mockReturnValue({ select: mockSelect });

      const fd = new FormData();
      fd.set("name", "テスト花子");
      fd.set("grade", "1");

      const result = await createChild(null, fd);
      expect(result).toMatchObject({ success: true });
    });
  });

  describe("updateChild", () => {
    it("rejects non-staff users", async () => {
      mockGetUser.mockResolvedValue({ id: "u1", role: "parent" });
      const fd = new FormData();
      fd.set("name", "更新太郎");
      fd.set("grade", "4");

      const result = await updateChild("child-1", null, fd);
      expect(result).toMatchObject({
        success: false,
        message: expect.stringContaining("権限"),
      });
    });

    it("updates child name and grade", async () => {
      mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      mockUpdate.mockReturnValue({ eq: mockEq });

      const fd = new FormData();
      fd.set("name", "更新太郎");
      fd.set("grade", "5");

      const result = await updateChild("child-1", null, fd);
      expect(result).toMatchObject({ success: true });
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ name: "更新太郎", grade: 5 }),
      );
      expect(mockEq).toHaveBeenCalledWith("id", "child-1");
    });

    it("validates grade range", async () => {
      mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
      const fd = new FormData();
      fd.set("name", "テスト");
      fd.set("grade", "0");

      const result = await updateChild("child-1", null, fd);
      expect(result).toMatchObject({
        success: false,
        message: expect.stringContaining("学年"),
      });
    });
  });

  describe("deleteChild", () => {
    it("rejects non-admin users", async () => {
      mockGetUser.mockResolvedValue({ id: "u1", role: "teacher" });

      const result = await deleteChild("child-1");
      expect(result).toMatchObject({
        success: false,
        message: expect.stringContaining("権限"),
      });
    });

    it("deletes child as admin", async () => {
      mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      mockDelete.mockReturnValue({ eq: mockEq });

      const result = await deleteChild("child-1");
      expect(result).toMatchObject({ success: true });
      expect(mockFrom).toHaveBeenCalledWith("children");
      expect(mockEq).toHaveBeenCalledWith("id", "child-1");
    });

    it("rejects parent users", async () => {
      mockGetUser.mockResolvedValue({ id: "u1", role: "parent" });

      const result = await deleteChild("child-1");
      expect(result).toMatchObject({
        success: false,
        message: expect.stringContaining("権限"),
      });
    });
  });
});
