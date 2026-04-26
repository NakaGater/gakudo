import { describe, it, expect, vi, beforeEach } from "vitest";
import { inviteUser, updateUser, deleteUser } from "./actions";

// ============================================================================
// Mock State Management
// ============================================================================

interface MockState {
  upsertError: { message: string } | null;
  updateError: { message: string } | null;
  deleteError: { message: string } | null;
}

let mockState: MockState = {
  upsertError: null,
  updateError: null,
  deleteError: null,
};

function resetMockState() {
  mockState = {
    upsertError: null,
    updateError: null,
    deleteError: null,
  };
}

// ============================================================================
// Mocks Setup
// ============================================================================

const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

const mockGetUser = vi.fn();
vi.mock("@/lib/auth/get-user", () => ({
  getUser: () => mockGetUser(),
}));

// withAuth instantiates a server-side Supabase client via createClient()
// before invoking the handler. The body uses the admin client (below);
// ctx.supabase here is just a stub.
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve({} as unknown),
}));

// Admin client mocks
const mockInviteUserByEmail = vi.fn();
const mockUpdateUserById = vi.fn();
const mockDeleteUser = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    auth: {
      admin: {
        inviteUserByEmail: (...args: unknown[]) => mockInviteUserByEmail(...args),
        updateUserById: (...args: unknown[]) => mockUpdateUserById(...args),
        deleteUser: (...args: unknown[]) => mockDeleteUser(...args),
      },
    },
    from: (table: string) => {
      if (table === "profiles") {
        return {
          upsert: () => {
            return Promise.resolve({ error: mockState.upsertError });
          },
          update: () => {
            return {
              eq: () => {
                return Promise.resolve({ error: mockState.updateError });
              },
            };
          },
          delete: () => {
            return {
              eq: () => {
                return Promise.resolve({ error: mockState.deleteError });
              },
            };
          },
        };
      }
      return {};
    },
  }),
}));

// ============================================================================
// Helper Functions
// ============================================================================

function makeFormData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.append(k, v);
  return fd;
}

// ============================================================================
// Test Suites
// ============================================================================

describe("inviteUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockState();
    mockGetUser.mockResolvedValue({ id: "admin-user-id", role: "admin" });
    mockInviteUserByEmail.mockResolvedValue({
      data: { user: { id: "new-user-id" } },
      error: null,
    });
  });

  it("1. rejects non-admin (teacher)", async () => {
    mockGetUser.mockResolvedValue({ id: "user-id", role: "teacher" });

    const result = await inviteUser(
      { success: true, message: "" },
      makeFormData({
        email: "test@example.com",
        name: "Test User",
        role: "parent",
      }),
    );

    expect(result.success).toBe(false);
    expect(result.message).toBe("権限がありません");
  });

  it("2. returns error for missing email", async () => {
    const result = await inviteUser(
      { success: true, message: "" },
      makeFormData({
        email: "",
        name: "Test User",
        role: "parent",
      }),
    );

    expect(result.success).toBe(false);
    expect(result.message).toBe("メールアドレスを入力してください");
  });

  it("3. returns error for missing name", async () => {
    const result = await inviteUser(
      { success: true, message: "" },
      makeFormData({
        email: "test@example.com",
        name: "",
        role: "parent",
      }),
    );

    expect(result.success).toBe(false);
    expect(result.message).toBe("名前を入力してください");
  });

  it("4. returns error for invalid role", async () => {
    const result = await inviteUser(
      { success: true, message: "" },
      makeFormData({
        email: "test@example.com",
        name: "Test User",
        role: "invalid_role",
      }),
    );

    expect(result.success).toBe(false);
    expect(result.message).toBe("有効な役割を選択してください");
  });

  it("5. returns error on invite API failure", async () => {
    mockInviteUserByEmail.mockResolvedValue({
      data: null,
      error: { message: "User already exists" },
    });

    const result = await inviteUser(
      { success: true, message: "" },
      makeFormData({
        email: "test@example.com",
        name: "Test User",
        role: "parent",
      }),
    );

    expect(result.success).toBe(false);
    expect(result.message).toContain("招待に失敗しました");
    expect(result.message).not.toContain("User already exists");
    expect(result.success).toBe(false);
  });

  it("6. returns error on profile upsert failure", async () => {
    mockState.upsertError = { message: "Database error" };

    const result = await inviteUser(
      { success: true, message: "" },
      makeFormData({
        email: "test@example.com",
        name: "Test User",
        role: "parent",
      }),
    );

    expect(result.success).toBe(false);
    expect(result.message).toContain("プロフィールの作成に失敗しました");
  });

  it("7. succeeds with valid input", async () => {
    const result = await inviteUser(
      { success: true, message: "" },
      makeFormData({
        email: "test@example.com",
        name: "Test User",
        role: "parent",
      }),
    );

    expect(result.success).toBe(true);
    expect(result.message).toBe("招待メールを送信しました");
    expect(mockInviteUserByEmail).toHaveBeenCalled();
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/users");
  });
});

describe("updateUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockState();
    mockGetUser.mockResolvedValue({ id: "admin-user-id", role: "admin" });
    mockUpdateUserById.mockResolvedValue({ error: null });
  });

  it("8. rejects non-admin", async () => {
    mockGetUser.mockResolvedValue({ id: "user-id", role: "teacher" });

    const result = await updateUser(
      { success: true, message: "" },
      makeFormData({
        id: "target-user-id",
        name: "Updated Name",
        role: "parent",
      }),
    );

    expect(result.success).toBe(false);
    expect(result.message).toBe("権限がありません");
  });

  it("9. returns error for empty ID", async () => {
    const result = await updateUser(
      { success: true, message: "" },
      makeFormData({
        id: "",
        name: "Updated Name",
        role: "parent",
      }),
    );

    expect(result.success).toBe(false);
    expect(result.message).toBe("ユーザーIDが不正です");
  });

  it("10. returns error for empty name", async () => {
    const result = await updateUser(
      { success: true, message: "" },
      makeFormData({
        id: "target-user-id",
        name: "",
        role: "parent",
      }),
    );

    expect(result.success).toBe(false);
    expect(result.message).toBe("名前を入力してください");
  });

  it("11. returns error for invalid role", async () => {
    const result = await updateUser(
      { success: true, message: "" },
      makeFormData({
        id: "target-user-id",
        name: "Updated Name",
        role: "invalid_role",
      }),
    );

    expect(result.success).toBe(false);
    expect(result.message).toBe("有効な役割を選択してください");
  });

  it("12. prevents self-modification (targetId === user.id)", async () => {
    const result = await updateUser(
      { success: true, message: "" },
      makeFormData({
        id: "admin-user-id",
        name: "Updated Name",
        role: "parent",
      }),
    );

    expect(result.success).toBe(false);
    expect(result.message).toBe("自分自身の役割は変更できません");
  });

  it("13. returns error on profile update failure", async () => {
    mockState.updateError = { message: "Update failed" };

    const result = await updateUser(
      { success: true, message: "" },
      makeFormData({
        id: "target-user-id",
        name: "Updated Name",
        role: "parent",
      }),
    );

    expect(result.success).toBe(false);
    expect(result.message).toContain("更新に失敗しました");
  });

  it("14. returns error on auth update failure", async () => {
    mockUpdateUserById.mockResolvedValue({
      error: { message: "Auth update failed" },
    });

    const result = await updateUser(
      { success: true, message: "" },
      makeFormData({
        id: "target-user-id",
        name: "Updated Name",
        role: "parent",
      }),
    );

    expect(result.success).toBe(false);
    expect(result.message).toContain("Auth更新に失敗しました");
  });

  it("15. succeeds with valid input", async () => {
    const result = await updateUser(
      { success: true, message: "" },
      makeFormData({
        id: "target-user-id",
        name: "Updated Name",
        role: "teacher",
      }),
    );

    expect(result.success).toBe(true);
    expect(result.message).toBe("ユーザー情報を更新しました");
    expect(mockUpdateUserById).toHaveBeenCalled();
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/users");
  });
});

describe("deleteUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockState();
    mockGetUser.mockResolvedValue({ id: "admin-user-id", role: "admin" });
    mockDeleteUser.mockResolvedValue({ error: null });
  });

  it("16. rejects non-admin", async () => {
    mockGetUser.mockResolvedValue({ id: "user-id", role: "teacher" });

    const result = await deleteUser(
      { success: true, message: "" },
      makeFormData({
        id: "target-user-id",
      }),
    );

    expect(result.success).toBe(false);
    expect(result.message).toBe("権限がありません");
  });

  it("17. returns error for empty ID", async () => {
    const result = await deleteUser(
      { success: true, message: "" },
      makeFormData({
        id: "",
      }),
    );

    expect(result.success).toBe(false);
    expect(result.message).toBe("ユーザーIDが不正です");
  });

  it("18. prevents self-deletion", async () => {
    const result = await deleteUser(
      { success: true, message: "" },
      makeFormData({
        id: "admin-user-id",
      }),
    );

    expect(result.success).toBe(false);
    expect(result.message).toBe("自分自身は削除できません");
  });

  it("19. returns error on profile delete failure", async () => {
    mockState.deleteError = { message: "Delete failed" };

    const result = await deleteUser(
      { success: true, message: "" },
      makeFormData({
        id: "target-user-id",
      }),
    );

    expect(result.success).toBe(false);
    expect(result.message).toContain("プロフィール削除に失敗しました");
  });

  it("20. returns error on auth delete failure", async () => {
    mockDeleteUser.mockResolvedValue({
      error: { message: "Auth delete failed" },
    });

    const result = await deleteUser(
      { success: true, message: "" },
      makeFormData({
        id: "target-user-id",
      }),
    );

    expect(result.success).toBe(false);
    expect(result.message).toContain("Auth削除に失敗しました");
  });

  it("21. succeeds with valid input", async () => {
    const result = await deleteUser(
      { success: true, message: "" },
      makeFormData({
        id: "target-user-id",
      }),
    );

    expect(result.success).toBe(true);
    expect(result.message).toBe("ユーザーを削除しました");
    expect(mockDeleteUser).toHaveBeenCalled();
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/users");
  });
});
