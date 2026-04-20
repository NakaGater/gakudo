import imageCompression from "browser-image-compression";

const COMPRESS_OPTIONS = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
} as const;

export async function compressPhoto(file: File): Promise<File> {
  return imageCompression(file, COMPRESS_OPTIONS);
}
