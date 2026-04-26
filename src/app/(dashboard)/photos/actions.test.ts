import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseMock } from "@/test/supabase-mock-factory";

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

const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

import { deletePhoto, setPhotoVisibility, uploadPhoto } from "./actions";

function imageFile(name = "img.jpg", type = "image/jpeg", size = 32): File {
  // Real JPEG magic bytes so validateFileMagicBytes accepts the fixture.
  const bytes = new Uint8Array(size);
  bytes[0] = 0xff;
  bytes[1] = 0xd8;
  bytes[2] = 0xff;
  bytes[3] = 0xe0;
  return new File([bytes], name, { type });
}

function fdWith(files: File[], fields: Record<string, string> = {}): FormData {
  const fd = new FormData();
  for (const f of files) fd.append("files", f);
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const uploadCalls = () => holder.current!.spies.storageCalls.filter((c) => c.op === "upload");
const removeCalls = () => holder.current!.spies.storageCalls.filter((c) => c.op === "remove");

describe("uploadPhoto", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    holder.current = createSupabaseMock();
    mockGetUser.mockResolvedValue({ id: "u-staff", role: "teacher" });
  });

  it("rejects non-staff users", async () => {
    mockGetUser.mockResolvedValue({ id: "u-parent", role: "parent" });
    const result = await uploadPhoto(fdWith([imageFile()]));
    expect(result.success).toBe(false);
    expect(uploadCalls()).toHaveLength(0);
  });

  it("rejects when no files are provided", async () => {
    const result = await uploadPhoto(fdWith([]));
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/ファイル/);
  });

  it("forces visibility=private for non-admin staff even if 'public' was sent", async () => {
    await uploadPhoto(fdWith([imageFile()], { visibility: "public" }));
    expect(holder.current!.spies.mutations).toContainEqual(
      expect.objectContaining({
        table: "photos",
        op: "insert",
        payload: expect.objectContaining({ visibility: "private" }),
      }),
    );
  });

  it("admin can mark photos public", async () => {
    mockGetUser.mockResolvedValue({ id: "u-admin", role: "admin" });
    await uploadPhoto(fdWith([imageFile()], { visibility: "public" }));
    expect(holder.current!.spies.mutations).toContainEqual(
      expect.objectContaining({
        table: "photos",
        op: "insert",
        payload: expect.objectContaining({ visibility: "public" }),
      }),
    );
  });

  it("rejects non-image files inline (no upload attempt)", async () => {
    const txt = new File([new Blob(["x"], { type: "text/plain" })], "a.txt", {
      type: "text/plain",
    });
    const result = await uploadPhoto(fdWith([txt]));
    expect(result.success).toBe(false);
    expect(uploadCalls()).toHaveLength(0);
  });

  it("rejects an image file whose bytes don't match the claimed MIME", async () => {
    // Claims image/jpeg but starts with PNG magic bytes.
    const bytes = new Uint8Array(16);
    bytes[0] = 0x89;
    bytes[1] = 0x50;
    bytes[2] = 0x4e;
    bytes[3] = 0x47;
    const lying = new File([bytes], "lying.jpg", { type: "image/jpeg" });
    const result = await uploadPhoto(fdWith([lying]));
    expect(result.success).toBe(false);
    expect(uploadCalls()).toHaveLength(0);
  });

  it("removes uploaded file when DB insert fails (cleanup)", async () => {
    holder.current = createSupabaseMock({
      tables: { photos: { data: null, error: { message: "constraint" } } },
    });
    const result = await uploadPhoto(fdWith([imageFile()]));
    expect(result.success).toBe(false);
    expect(removeCalls().length).toBeGreaterThan(0);
  });
});

describe("setPhotoVisibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    holder.current = createSupabaseMock();
  });

  it("rejects non-admin users (including teacher)", async () => {
    mockGetUser.mockResolvedValue({ id: "u-teacher", role: "teacher" });
    const result = await setPhotoVisibility("p-1", "public");
    expect(result.success).toBe(false);
    expect(holder.current!.spies.mutations.filter((m) => m.op === "update")).toHaveLength(0);
  });

  it("admin can update visibility", async () => {
    mockGetUser.mockResolvedValue({ id: "u-admin", role: "admin" });
    const result = await setPhotoVisibility("p-1", "public");
    expect(result.success).toBe(true);
    expect(holder.current!.spies.mutations).toContainEqual(
      expect.objectContaining({ table: "photos", op: "update" }),
    );
  });
});

describe("deletePhoto", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    holder.current = createSupabaseMock();
  });

  it("rejects non-staff users", async () => {
    mockGetUser.mockResolvedValue({ id: "u-parent", role: "parent" });
    const result = await deletePhoto("p-1");
    expect(result.success).toBe(false);
  });

  it("teacher cannot delete a photo uploaded by someone else", async () => {
    mockGetUser.mockResolvedValue({ id: "u-teacher", role: "teacher" });
    holder.current = createSupabaseMock({
      tables: {
        photos: {
          data: { storage_path: "owner/file.jpg", uploaded_by: "u-other" },
          error: null,
        },
      },
    });
    const result = await deletePhoto("p-1");
    expect(result.success).toBe(false);
    expect(removeCalls()).toHaveLength(0);
  });

  it("admin can delete any photo", async () => {
    mockGetUser.mockResolvedValue({ id: "u-admin", role: "admin" });
    holder.current = createSupabaseMock({
      tables: {
        photos: {
          data: { storage_path: "owner/file.jpg", uploaded_by: "u-other" },
          error: null,
        },
      },
    });
    const result = await deletePhoto("p-1");
    expect(result.success).toBe(true);
    expect(removeCalls()[0]?.args[0]).toEqual(["owner/file.jpg"]);
  });

  it("returns error when photo is not found", async () => {
    mockGetUser.mockResolvedValue({ id: "u-admin", role: "admin" });
    holder.current = createSupabaseMock({
      tables: { photos: { data: null, error: { message: "not found" } } },
    });
    const result = await deletePhoto("missing");
    expect(result.success).toBe(false);
    expect(removeCalls()).toHaveLength(0);
  });
});
