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

import { createChild, updateChild, deleteChild, regenerateQR, searchParents, linkParent, unlinkParent } from "./actions";

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

    it("returns error on DB failure", async () => {
      mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
      const mockEq = vi.fn().mockResolvedValue({ error: { message: "FK constraint" } });
      mockDelete.mockReturnValue({ eq: mockEq });

      const result = await deleteChild("child-1");
      expect(result).toMatchObject({
        success: false,
        message: expect.stringContaining("FK constraint"),
      });
    });
  });

  describe("regenerateQR", () => {
    it("requires admin role", async () => {
      mockGetUser.mockResolvedValue({ id: "u1", role: "teacher" });
      const result = await regenerateQR("child-1");
      expect(result).toMatchObject({
        success: false,
        message: expect.stringContaining("管理者"),
      });
    });

    it("rejects parent role", async () => {
      mockGetUser.mockResolvedValue({ id: "u1", role: "parent" });
      const result = await regenerateQR("child-1");
      expect(result).toMatchObject({ success: false });
    });

    it("regenerates QR code for admin", async () => {
      mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      mockUpdate.mockReturnValue({ eq: mockEq });

      const result = await regenerateQR("child-1");
      expect(result).toMatchObject({ success: true });
      expect(result?.message).toContain("QR");
      const updateArg = mockUpdate.mock.calls[0][0];
      expect(updateArg.qr_code).toMatch(/^GK-/);
      expect(updateArg.qr_active).toBe(true);
    });

    it("returns error on DB failure", async () => {
      mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
      const mockEq = vi.fn().mockResolvedValue({ error: { message: "DB err" } });
      mockUpdate.mockReturnValue({ eq: mockEq });

      const result = await regenerateQR("child-1");
      expect(result).toMatchObject({ success: false });
      expect(result?.message).toContain("DB err");
    });
  });

  describe("searchParents", () => {
    it("returns empty for non-staff", async () => {
      mockGetUser.mockResolvedValue({ id: "u1", role: "parent" });
      const result = await searchParents("test");
      expect(result).toEqual([]);
    });

    it("returns empty for blank query", async () => {
      mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
      const result = await searchParents("  ");
      expect(result).toEqual([]);
    });

    it("searches profiles by name/email pattern", async () => {
      mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
      const mockData = [{ id: "p1", name: "田中", email: "tanaka@example.com" }];
      const mockLimit = vi.fn().mockResolvedValue({ data: mockData, error: null });
      const mockOr = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockEq = vi.fn().mockReturnValue({ or: mockOr });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await searchParents("田中");
      expect(result).toEqual(mockData);
      expect(mockFrom).toHaveBeenCalledWith("profiles");
    });

    it("returns empty on DB error", async () => {
      mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
      const mockLimit = vi.fn().mockResolvedValue({ data: null, error: { message: "err" } });
      const mockOr = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockEq = vi.fn().mockReturnValue({ or: mockOr });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await searchParents("test");
      expect(result).toEqual([]);
    });
  });

  describe("linkParent", () => {
    it("rejects non-staff", async () => {
      mockGetUser.mockResolvedValue({ id: "u1", role: "parent" });
      const result = await linkParent("c1", "p1");
      expect(result).toMatchObject({ success: false });
    });

    it("links parent to child", async () => {
      mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
      const mockUpsert = vi.fn().mockResolvedValue({ error: null });
      mockFrom.mockReturnValue({ upsert: mockUpsert });

      const result = await linkParent("c1", "p1");
      expect(result).toMatchObject({ success: true });
      expect(result?.message).toContain("紐付け");
      expect(mockFrom).toHaveBeenCalledWith("child_parents");
    });

    it("returns error on DB failure", async () => {
      mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
      const mockUpsert = vi.fn().mockResolvedValue({ error: { message: "dup" } });
      mockFrom.mockReturnValue({ upsert: mockUpsert });

      const result = await linkParent("c1", "p1");
      expect(result).toMatchObject({ success: false });
      expect(result?.message).toContain("dup");
    });
  });

  describe("unlinkParent", () => {
    it("rejects non-staff", async () => {
      mockGetUser.mockResolvedValue({ id: "u1", role: "parent" });
      const result = await unlinkParent("c1", "p1");
      expect(result).toMatchObject({ success: false });
    });

    it("unlinks parent from child", async () => {
      mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
      const mockEq2 = vi.fn().mockResolvedValue({ error: null });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockDel = vi.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ delete: mockDel });

      const result = await unlinkParent("c1", "p1");
      expect(result).toMatchObject({ success: true });
      expect(result?.message).toContain("解除");
      expect(mockFrom).toHaveBeenCalledWith("child_parents");
    });

    it("returns error on DB failure", async () => {
      mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
      const mockEq2 = vi.fn().mockResolvedValue({ error: { message: "FK err" } });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockDel = vi.fn().mockReturnValue({ eq: mockEq1 });
      mockFrom.mockReturnValue({ delete: mockDel });

      const result = await unlinkParent("c1", "p1");
      expect(result).toMatchObject({ success: false });
      expect(result?.message).toContain("FK err");
    });
  });
});
