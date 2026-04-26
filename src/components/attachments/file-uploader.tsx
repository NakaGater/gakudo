"use client";

import { useRef, useState, useCallback, type DragEvent } from "react";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/gif", "image/webp"];

type FileInfo = { file: File; preview?: string };

type Props = {
  files: FileInfo[];
  onChange: (files: FileInfo[]) => void;
  multiple?: boolean;
  disabled?: boolean;
};

export function FileUploader({ files, onChange, multiple = true, disabled = false }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAndAdd = useCallback(
    (newFiles: FileList | File[]) => {
      const validated: FileInfo[] = [];
      for (const file of Array.from(newFiles)) {
        if (file.size > MAX_FILE_SIZE) {
          setError(`${file.name}: 10MB以下にしてください`);
          continue;
        }
        if (!(ALLOWED_TYPES as readonly string[]).includes(file.type)) {
          setError(`${file.name}: PDF/画像のみ対応`);
          continue;
        }
        setError(null);
        validated.push({ file });
      }
      if (validated.length > 0) {
        onChange(multiple ? [...files, ...validated] : validated);
      }
    },
    [files, multiple, onChange],
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (!disabled) validateAndAdd(e.dataTransfer.files);
    },
    [disabled, validateAndAdd],
  );

  const removeFile = useCallback(
    (idx: number) => {
      onChange(files.filter((_, i) => i !== idx));
    },
    [files, onChange],
  );

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-fg">添付ファイル</label>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-4 transition-colors ${
          disabled
            ? "opacity-50 cursor-not-allowed border-border"
            : isDragging
              ? "border-accent bg-accent/5"
              : "border-border hover:border-accent/50"
        }`}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      >
        <p className="text-sm text-fg/60">ファイルをドラッグ、またはクリックして選択</p>
        <p className="mt-1 text-xs text-fg/40">
          PDF・画像 (最大10MB){multiple ? " — 複数選択可" : ""}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,image/*"
          multiple={multiple}
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            if (e.target.files) validateAndAdd(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      {files.length > 0 && (
        <ul className="flex flex-col gap-1">
          {files.map((f, idx) => (
            <li
              key={`${f.file.name}-${idx}`}
              className="flex items-center justify-between rounded-md border border-border bg-bg-elev px-3 py-2 text-sm"
            >
              <span className="truncate text-fg">
                {f.file.type === "application/pdf" ? "📄" : "🖼️"} {f.file.name}
                <span className="ml-2 text-xs text-fg-muted">({formatSize(f.file.size)})</span>
              </span>
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                  className="ml-2 text-danger hover:text-danger/80 text-xs"
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
