"use client";

import { useState, useRef } from "react";
import { Button, Input } from "@/components/ui";
import { compressPhoto } from "@/lib/photos/compress";
import { uploadPhoto } from "./actions";
import type { ActionState } from "@/lib/actions/types";

export function UploadForm({ isAdmin }: { isAdmin: boolean }) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ActionState>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;

    setResult(null);
    const urls: string[] = [];
    for (const file of selected) {
      urls.push(URL.createObjectURL(file));
    }
    setPreviews(urls);
    setFiles(selected);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (files.length === 0) return;

    setUploading(true);
    setProgress(0);
    setResult(null);

    try {
      const formData = new FormData(e.currentTarget);
      // Remove original files — we'll add compressed ones
      formData.delete("files");

      const total = files.length;
      for (let i = 0; i < total; i++) {
        const compressed = await compressPhoto(files[i]);
        formData.append("files", compressed);
        setProgress(Math.round(((i + 1) / total) * 80));
      }

      setProgress(90);
      const res = await uploadPhoto(formData);
      setResult(res);
      setProgress(100);

      if (res?.success) {
        setPreviews([]);
        setFiles([]);
        if (fileRef.current) fileRef.current.value = "";
      }
    } catch (error) {
      console.error("[photos/upload] Upload failed:", error);
      setResult({ success: false, message: "アップロードに失敗しました" });
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-fg mb-1">写真を選択</label>
        <input
          ref={fileRef}
          type="file"
          name="files"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="block w-full text-sm text-fg-muted file:mr-3 file:rounded-md file:border-0 file:bg-accent-light file:px-3 file:py-2 file:text-sm file:font-medium file:text-accent hover:file:bg-amber-200"
        />
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {previews.map((url, i) => (
            <div
              key={i}
              className="relative aspect-square overflow-hidden rounded-md border border-border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`プレビュー ${i + 1}`} className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      )}

      <Input label="イベント名" name="event_name" placeholder="例: 運動会" />
      <Input label="キャプション" name="caption" placeholder="写真の説明" />

      {isAdmin && (
        <label className="flex items-center gap-2 text-sm text-fg">
          <input
            type="checkbox"
            name="visibility"
            value="public"
            className="rounded border-border"
          />
          公開する
        </label>
      )}

      {uploading && (
        <div className="space-y-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-accent transition-all duration-normal"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-fg-muted">{progress}%</p>
        </div>
      )}

      {result && (
        <p className={`text-sm ${result.success ? "text-success" : "text-danger"}`}>
          {result.message}
        </p>
      )}

      <Button type="submit" loading={uploading} disabled={files.length === 0}>
        アップロード
      </Button>
    </form>
  );
}
