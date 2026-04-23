import { describe, it, expect, vi, beforeEach } from "vitest";
import { login } from "./actions";

// Mock next/cache
const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

// Mock next/navigation with redirect that throws
const mockRedirect = vi.fn().mockImplementation((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
vi.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));

// Mock Supabase client
const mockSignInWithPassword = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
    from: mockFrom,
  })),
}));

describe("login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /login?error=invalid_credentials on auth error", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: null,
      error: { message: "Invalid credentials" },
    });

    const formData = new FormData();
    formData.append("email", "user@example.com");
    formData.append("password", "wrongpassword");

    try {
      await login(formData);
    } catch {
      // Expected to throw due to redirect
    }

    expect(mockRedirect).toHaveBeenCalledWith("/login?error=invalid_credentials");
  });

  it("redirects staff (admin) to /attendance/dashboard", async () => {
    mockSingle.mockResolvedValueOnce({ data: { role: "admin" }, error: null });
    mockEq.mockReturnValueOnce({ single: mockSingle });
    mockSelect.mockReturnValueOnce({ eq: mockEq });
    mockFrom.mockReturnValueOnce({ select: mockSelect });

    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: { id: "u1" } },
      error: null,
    });

    const formData = new FormData();
    formData.append("email", "admin@example.com");
    formData.append("password", "password123");

    try {
      await login(formData);
    } catch {
      // Expected to throw due to redirect
    }

    expect(mockRedirect).toHaveBeenCalledWith("/attendance/dashboard");
  });

  it("redirects staff (teacher) to /attendance/dashboard", async () => {
    mockSingle.mockResolvedValueOnce({ data: { role: "teacher" }, error: null });
    mockEq.mockReturnValueOnce({ single: mockSingle });
    mockSelect.mockReturnValueOnce({ eq: mockEq });
    mockFrom.mockReturnValueOnce({ select: mockSelect });

    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: { id: "u2" } },
      error: null,
    });

    const formData = new FormData();
    formData.append("email", "teacher@example.com");
    formData.append("password", "password123");

    try {
      await login(formData);
    } catch {
      // Expected to throw due to redirect
    }

    expect(mockRedirect).toHaveBeenCalledWith("/attendance/dashboard");
  });

  it("redirects staff (entrance) to /attendance/dashboard", async () => {
    mockSingle.mockResolvedValueOnce({ data: { role: "entrance" }, error: null });
    mockEq.mockReturnValueOnce({ single: mockSingle });
    mockSelect.mockReturnValueOnce({ eq: mockEq });
    mockFrom.mockReturnValueOnce({ select: mockSelect });

    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: { id: "u3" } },
      error: null,
    });

    const formData = new FormData();
    formData.append("email", "entrance@example.com");
    formData.append("password", "password123");

    try {
      await login(formData);
    } catch {
      // Expected to throw due to redirect
    }

    expect(mockRedirect).toHaveBeenCalledWith("/attendance/dashboard");
  });

  it("redirects parent to /announcements", async () => {
    mockSingle.mockResolvedValueOnce({ data: { role: "parent" }, error: null });
    mockEq.mockReturnValueOnce({ single: mockSingle });
    mockSelect.mockReturnValueOnce({ eq: mockEq });
    mockFrom.mockReturnValueOnce({ select: mockSelect });

    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: { id: "u4" } },
      error: null,
    });

    const formData = new FormData();
    formData.append("email", "parent@example.com");
    formData.append("password", "password123");

    try {
      await login(formData);
    } catch {
      // Expected to throw due to redirect
    }

    expect(mockRedirect).toHaveBeenCalledWith("/announcements");
  });
});
