'use client'

import { useRef, useState } from 'react'
import { uploadPhotos } from '@/app/(protected)/teacher/photos/actions'

export function PhotoUploader() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleUpload() {
    const files = fileInputRef.current?.files
    if (!files || files.length === 0) {
      setMessage('ファイルを選択してください')
      return
    }

    setUploading(true)
    setMessage(null)

    try {
      const formData = new FormData()
      for (const file of Array.from(files)) {
        formData.append('files', file)
      }
      await uploadPhotos(formData)
      setMessage(`${files.length}枚の写真をアップロードしました`)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch {
      setMessage('アップロードに失敗しました')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-[#F0E6D3] p-4 space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#FFFDF7] file:text-gray-700 hover:file:bg-[#F0E6D3]"
      />
      <button
        onClick={handleUpload}
        disabled={uploading}
        className="rounded-lg px-4 py-2 text-white font-medium text-sm transition-colors disabled:opacity-50"
        style={{ backgroundColor: '#F59F0A' }}
      >
        {uploading ? 'アップロード中...' : '写真をアップロード'}
      </button>
      {message && (
        <p className="text-sm text-gray-600">{message}</p>
      )}
    </div>
  )
}
