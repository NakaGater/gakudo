import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseMock } from "@/test/supabase-mock-factory";

// I/O 境界のみモック (next/cache, next/navigation, getUser, Supabase)。
// フォームバリデーションは actions.helpers.test.ts で純粋にカバー済み。
const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

const mockRedirect = vi.fn<(url: string) => never>();
vi.mock("next/navigation", () => ({
  redirect: (...args: Parameters<typeof mockRedirect>) => {
    mockRedirect(...args);
    throw new Error(`NEXT_REDIRECT:${args[0]}`);
  },
}));

const mockGetUser = vi.fn();
vi.mock("@/lib/auth/get-user", () => ({
  getUser: () => mockGetUser(),
}));

const holder = vi.hoisted(() => ({
  current: null as ReturnType<typeof createSupabaseMock> | null,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(holder.current!.client),
}));

import {
  createChild,
  deleteChild,
  linkParent,
  regenerateQR,
  searchParents,
  unlinkParent,
  updateChild,
} from "./actions";

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("createChild", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    holder.current = createSupabaseMock();
  });

  it("rejects non-staff users", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "parent" });
    const result = await createChild(null, form({ name: "太郎", grade: "3" }));
    expect(result).toMatchObject({ success: false, message: expect.stringContaining("権限") });
  });

  it("returns validator's error message verbatim on invalid input", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    const result = await createChild(null, form({ name: "", grade: "3" }));
    expect(result).toEqual({ success: false, message: "名前を入力してください" });
  });

  it("inserts a child with a GK-prefixed nanoid QR and returns childId", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    holder.current!.enqueue("children", { data: { id: "child-1" }, error: null });

    const result = await createChild(null, form({ name: "太郎", grade: "3" }));
    expect(result).toMatchObject({ success: true, childId: "child-1" });

    // 境界契約: name/grade/qr_code が children テーブルへ insert される
    const insertCall = holder.current!.spies.mutations.find(
      (m) => m.table === "children" && m.op === "insert",
    );
    expect(insertCall).toBeDefined();
    const inserted = insertCall!.payload as { name: string; grade: number; qr_code: string };
    expect(inserted.name).toBe("太郎");
    expect(inserted.grade).toBe(3);
    expect(inserted.qr_code).toMatch(/^GK-[A-Z0-9]{8}$/);
  });

  it("returns DB error message on insert failure", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    holder.current!.enqueue("children", { data: null, error: { message: "duplicate" } });

    const result = await createChild(null, form({ name: "太郎", grade: "3" }));
    expect(result.success).toBe(false);
    expect(result.message).not.toContain("duplicate");
  });
});

describe("updateChild", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    holder.current = createSupabaseMock();
  });

  it("rejects non-staff users", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "parent" });
    const result = await updateChild("child-1", null, form({ name: "太郎", grade: "3" }));
    expect(result).toMatchObject({ success: false, message: expect.stringContaining("権限") });
  });

  it("updates and returns success", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });

    const result = await updateChild("child-1", null, form({ name: "更新太郎", grade: "5" }));
    expect(result).toMatchObject({ success: true });
    // 境界契約のみ: 渡されたデータが id=child-1 で更新される
    expect(holder.current!.spies.mutations).toContainEqual(
      expect.objectContaining({
        table: "children",
        op: "update",
        payload: { name: "更新太郎", grade: 5 },
      }),
    );
  });

  it("returns DB error message on update failure", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    holder.current = createSupabaseMock({
      tables: { children: { data: null, error: { message: "FK constraint" } } },
    });
    const result = await updateChild("child-1", null, form({ name: "太郎", grade: "3" }));
    expect(result.success).toBe(false);
    // Phase 2-B: raw DB message is sanitized away.
    expect(result.message).not.toContain("FK constraint");
  });
});

describe("deleteChild", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    holder.current = createSupabaseMock();
  });

  it("rejects non-admin users", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "teacher" });
    expect(await deleteChild("child-1")).toMatchObject({ success: false });
  });

  it("deletes and returns success for admin", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });

    expect(await deleteChild("child-1")).toMatchObject({ success: true });
    expect(holder.current!.spies.mutations).toContainEqual(
      expect.objectContaining({ table: "children", op: "delete" }),
    );
  });

  it("returns DB error on delete failure", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    holder.current = createSupabaseMock({
      tables: { children: { data: null, error: { message: "FK err" } } },
    });
    const result = await deleteChild("child-1");
    expect(result.success).toBe(false);
    expect(result.message).not.toContain("FK err");
  });
});

describe("regenerateQR", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    holder.current = createSupabaseMock();
  });

  it("rejects non-admin users", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "teacher" });
    expect(await regenerateQR("c1")).toMatchObject({ success: false });
  });

  it("issues a new GK-prefixed QR and activates it", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });

    const result = await regenerateQR("c1");
    expect(result).toMatchObject({ success: true });
    const updateCall = holder.current!.spies.mutations.find(
      (m) => m.table === "children" && m.op === "update",
    );
    expect(updateCall).toBeDefined();
    const arg = updateCall!.payload as { qr_code: string; qr_active: boolean };
    expect(arg.qr_code).toMatch(/^GK-[A-Z0-9]{8}$/);
    expect(arg.qr_active).toBe(true);
  });

  it("returns DB error on update failure", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    holder.current = createSupabaseMock({
      tables: { children: { data: null, error: { message: "DB err" } } },
    });
    const result = await regenerateQR("c1");
    expect(result.success).toBe(false);
    expect(result.message).not.toContain("DB err");
  });
});

describe("searchParents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    holder.current = createSupabaseMock();
  });

  it("returns empty for non-staff", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "parent" });
    expect(await searchParents("test")).toEqual([]);
  });

  it("returns empty for blank query (no DB call)", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    expect(await searchParents("  ")).toEqual([]);
    expect(holder.current!.spies.fromCalls).toEqual([]);
  });

  it("returns matching parents on success", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    const data = [{ id: "p1", name: "田中", email: "tanaka@example.com" }];
    holder.current = createSupabaseMock({ tables: { profiles: { data, error: null } } });
    expect(await searchParents("田中")).toEqual(data);
  });

  it("returns empty on DB error (graceful failure)", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    holder.current = createSupabaseMock({
      tables: { profiles: { data: null, error: { message: "x" } } },
    });
    expect(await searchParents("test")).toEqual([]);
  });
});

describe("linkParent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    holder.current = createSupabaseMock();
  });

  it("rejects non-staff", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "parent" });
    expect(await linkParent("c1", "p1")).toMatchObject({ success: false });
  });

  it("links and returns success", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    expect(await linkParent("c1", "p1")).toMatchObject({ success: true });
    expect(holder.current!.spies.mutations).toContainEqual(
      expect.objectContaining({ table: "child_parents", op: "upsert" }),
    );
  });

  it("returns DB error on upsert failure", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    holder.current = createSupabaseMock({
      tables: { child_parents: { data: null, error: { message: "dup" } } },
    });
    const result = await linkParent("c1", "p1");
    expect(result.success).toBe(false);
    expect(result.message).not.toContain("dup");
  });
});

describe("unlinkParent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    holder.current = createSupabaseMock();
  });

  it("rejects non-staff", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "parent" });
    expect(await unlinkParent("c1", "p1")).toMatchObject({ success: false });
  });

  it("unlinks and returns success", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    expect(await unlinkParent("c1", "p1")).toMatchObject({ success: true });
    expect(holder.current!.spies.mutations).toContainEqual(
      expect.objectContaining({ table: "child_parents", op: "delete" }),
    );
  });

  it("returns DB error on delete failure", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    holder.current = createSupabaseMock({
      tables: { child_parents: { data: null, error: { message: "FK err" } } },
    });
    const result = await unlinkParent("c1", "p1");
    expect(result.success).toBe(false);
    expect(result.message).not.toContain("FK err");
  });
});
