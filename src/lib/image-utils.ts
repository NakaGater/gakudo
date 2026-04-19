/**
 * Client-side image resize utility.
 * Uses canvas to resize an image file before upload.
 */
export async function resizeImage(file: File, maxWidth: number = 1920): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img
      if (width <= maxWidth) {
        // No resize needed — return original as blob
        resolve(file)
        return
      }

      const ratio = maxWidth / width
      width = maxWidth
      height = Math.round(height * ratio)

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob from canvas'))
            return
          }
          resolve(blob)
        },
        file.type || 'image/jpeg',
        0.85
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}
