import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockRevalidatePath = vi.fn();

vi.mock("@/lib/auth/get-user", () => ({
  getUser: () => mockGetUser(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      from: () => ({
        update: (...args: unknown[]) => {
          mockUpdate(...args);
          return { eq: (...e: unknown[]) => mockEq(...e) };
        },
      }),
    }),
  ),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

import { updateProfile } from "./actions";

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("updateProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ id: "u-1", role: "parent" });
  });

  it("rejects empty name", async () => {
    const result = await updateProfile(null, form({ name: "  " }));
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/名前/);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects names longer than 50 characters", async () => {
    const result = await updateProfile(null, form({ name: "あ".repeat(51) }));
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/50/);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("updates the caller's own profile (uses session user id)", async () => {
    mockEq.mockResolvedValue({ error: null });
    const result = await updateProfile(null, form({ name: " 山田 " }));
    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({ name: "山田" });
    expect(mockEq).toHaveBeenCalledWith("id", "u-1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/profile");
  });

  it("returns error when Supabase update fails", async () => {
    mockEq.mockResolvedValue({ error: { message: "internal db detail" } });
    const result = await updateProfile(null, form({ name: "山田" }));
    expect(result.success).toBe(false);
  });
});
