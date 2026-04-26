import { describe, it, expect, vi } from "vitest";

vi.mock("browser-image-compression", () => ({
  default: vi.fn(),
}));

import imageCompression from "browser-image-compression";
import { compressPhoto } from "./compress";

const mockedCompression = vi.mocked(imageCompression);

function createFakeFile(name: string, sizeKB: number, type = "image/jpeg"): File {
  const bytes = new Uint8Array(sizeKB * 1024);
  return new File([bytes], name, { type });
}

describe("compressPhoto", () => {
  it("calls browser-image-compression with correct options", async () => {
    const input = createFakeFile("photo.jpg", 2048);
    const compressed = createFakeFile("photo.jpg", 400);
    mockedCompression.mockResolvedValue(compressed);

    await compressPhoto(input);

    expect(mockedCompression).toHaveBeenCalledWith(input, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    });
  });

  it("returns compressed file under maxSize", async () => {
    const input = createFakeFile("large.jpg", 2048);
    const compressed = createFakeFile("large.jpg", 400);
    mockedCompression.mockResolvedValue(compressed);

    const result = await compressPhoto(input);

    expect(result.size).toBeLessThanOrEqual(500 * 1024);
    expect(result.name).toBe("large.jpg");
  });

  it("resizes to max dimension via options", async () => {
    const input = createFakeFile("wide.png", 3000, "image/png");
    const compressed = createFakeFile("wide.png", 300, "image/png");
    mockedCompression.mockResolvedValue(compressed);

    await compressPhoto(input);

    const callOptions = mockedCompression.mock.calls[0]![1];
    expect(callOptions?.maxWidthOrHeight).toBe(1920);
  });

  it("propagates compression errors", async () => {
    const input = createFakeFile("bad.jpg", 1024);
    mockedCompression.mockRejectedValue(new Error("compression failed"));

    await expect(compressPhoto(input)).rejects.toThrow("compression failed");
  });
});
