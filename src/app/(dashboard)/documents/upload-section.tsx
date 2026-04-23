"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { UploadForm } from "./upload-form";

export function UploadSection() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        アップロード
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-md bg-bg-elev p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-fg">資料アップロード</h2>
          <button
            onClick={() => setOpen(false)}
            className="text-fg/50 hover:text-fg"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>
        <UploadForm onSuccess={() => setOpen(false)} />
      </div>
    </div>
  );
}
