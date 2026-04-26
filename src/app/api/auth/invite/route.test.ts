import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.fn();
const mockProfileSelect = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => mockProfileSelect(),
          }),
        }),
      }),
    }),
  ),
}));

const mockInviteUserByEmail = vi.fn();
const mockUpsert = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    auth: {
      admin: {
        inviteUserByEmail: mockInviteUserByEmail,
      },
    },
    from: () => ({
      upsert: mockUpsert,
    }),
  }),
}));

import { POST } from "./route";

function makeRequest(body?: unknown, method = "POST", url = "http://localhost/api/auth/invite") {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

describe("POST /api/auth/invite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Not authenticated" },
    });

    const res = await POST(makeRequest({ email: "test@example.com", name: "Test", role: "admin" }));
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("returns 403 when not admin", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    mockProfileSelect.mockResolvedValue({
      data: { role: "parent" },
      error: null,
    });

    const res = await POST(makeRequest({ email: "test@example.com", name: "Test", role: "admin" }));
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("returns 400 for invalid JSON body", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    mockProfileSelect.mockResolvedValue({
      data: { role: "admin" },
      error: null,
    });

    const req = new Request("http://localhost/api/auth/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{{invalid json",
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for missing email", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    mockProfileSelect.mockResolvedValue({
      data: { role: "admin" },
      error: null,
    });

    const res = await POST(makeRequest({ name: "Test", role: "admin" }));
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("returns 400 for missing name", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    mockProfileSelect.mockResolvedValue({
      data: { role: "admin" },
      error: null,
    });

    const res = await POST(makeRequest({ email: "test@example.com", role: "admin" }));
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("returns 400 for invalid role", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    mockProfileSelect.mockResolvedValue({
      data: { role: "admin" },
      error: null,
    });

    const res = await POST(
      makeRequest({ email: "test@example.com", name: "Test", role: "invalid_role" }),
    );
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("returns 400 on invite API failure", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    mockProfileSelect.mockResolvedValue({
      data: { role: "admin" },
      error: null,
    });

    mockInviteUserByEmail.mockResolvedValue({
      data: null,
      error: { message: "Invite failed" },
    });

    const res = await POST(makeRequest({ email: "test@example.com", name: "Test", role: "admin" }));
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("returns 500 on profile upsert failure", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    mockProfileSelect.mockResolvedValue({
      data: { role: "admin" },
      error: null,
    });

    mockInviteUserByEmail.mockResolvedValue({
      data: { user: { id: "new-user-123" } },
      error: null,
    });

    // Mock upsert to return error
    mockUpsert.mockReturnValueOnce(Promise.resolve({ error: { message: "Upsert failed" } }));

    const res = await POST(makeRequest({ email: "test@example.com", name: "Test", role: "admin" }));
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("returns 201 on success", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    mockProfileSelect.mockResolvedValue({
      data: { role: "admin" },
      error: null,
    });

    mockInviteUserByEmail.mockResolvedValue({
      data: { user: { id: "new-user-456" } },
      error: null,
    });

    mockUpsert.mockResolvedValue({ error: null });

    const res = await POST(
      makeRequest({ email: "test@example.com", name: "Test User", role: "teacher" }),
    );
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.message || json.success).toBeDefined();

    expect(mockInviteUserByEmail).toHaveBeenCalled();
    expect(mockUpsert).toHaveBeenCalled();
  });
});
