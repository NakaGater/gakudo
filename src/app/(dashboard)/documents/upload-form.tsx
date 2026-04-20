"use client";

import { useActionState, useRef, useState, useCallback, type DragEvent } from "react";
import { Button, Input } from "@/components/ui";
import { uploadDocument, type ActionState } from "./actions";

const CATEGORIES = ["お便り", "スケジュール", "書類", "その他"] as const;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function UploadForm({ onSuccess }: { onSuccess?: () => void }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (prev, formData) => {
      const result = await uploadDocument(prev, formData);
      if (result?.success) {
        setSelectedFile(null);
        formRef.current?.reset();
        onSuccess?.();
      }
      return result;
    },
    null,
  );

  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return "ファイルサイズは10MB以下にしてください";
    }
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) {
      return "PDF または画像ファイルを選択してください";
    }
    return null;
  }, []);

  const handleFileChange = useCallback(
    (file: File | undefined) => {
      if (!file) {
        setSelectedFile(null);
        setClientError(null);
        return;
      }
      const error = validateFile(file);
      if (error) {
        setClientError(error);
        setSelectedFile(null);
      } else {
        setClientError(null);
        setSelectedFile(file);
      }
    },
    [validateFile],
  );

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileChange(file);
        // Update the file input for form submission
        const dt = new DataTransfer();
        dt.items.add(file);
        if (fileInputRef.current) {
          fileInputRef.current.files = dt.files;
        }
      }
    },
    [handleFileChange],
  );

  const fileError = clientError ?? state?.fieldErrors?.file;

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <Input
        name="title"
        label="タイトル"
        placeholder="資料のタイトルを入力"
        required
        error={state?.fieldErrors?.title}
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="category" className="text-sm font-medium text-fg">
          カテゴリ
        </label>
        <select
          id="category"
          name="category"
          required
          className="h-10 w-full rounded-sm border border-border bg-bg-elev px-3 text-fg focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none"
        >
          <option value="">選択してください</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        {state?.fieldErrors?.category && (
          <p className="text-sm text-danger">{state.fieldErrors.category}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-fg">ファイル</label>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-6 transition-colors ${
            isDragging
              ? "border-accent bg-accent/5"
              : fileError
                ? "border-danger bg-danger/5"
                : "border-border hover:border-accent/50"
          }`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          {selectedFile ? (
            <p className="text-sm text-fg">{selectedFile.name}</p>
          ) : (
            <>
              <p className="text-sm text-fg/60">
                ここにファイルをドラッグ、またはクリックして選択
              </p>
              <p className="mt-1 text-xs text-fg/40">
                PDF・画像 (最大10MB)
              </p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            name="file"
            accept=".pdf,image/*"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0])}
          />
        </div>
        {fileError && <p className="text-sm text-danger">{fileError}</p>}
      </div>

      {state && !state.success && !state.fieldErrors && (
        <p className="text-sm text-danger">{state.message}</p>
      )}
      {state?.success && (
        <p className="text-sm text-success">{state.message}</p>
      )}

      <Button type="submit" loading={isPending} disabled={isPending}>
        {isPending ? "アップロード中..." : "アップロード"}
      </Button>
    </form>
  );
}
