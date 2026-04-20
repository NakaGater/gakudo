"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { deleteDocument } from "../actions";

export function DeleteButton({ documentId }: { documentId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteDocument(documentId);
      if (result?.success) {
        router.push("/documents");
      } else {
        alert(result?.message ?? "削除に失敗しました");
        setConfirming(false);
      }
    });
  }

  if (!confirming) {
    return (
      <Button variant="destructive" size="sm" onClick={() => setConfirming(true)}>
        削除
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-danger">本当に削除しますか？</span>
      <Button
        variant="destructive"
        size="sm"
        loading={isPending}
        onClick={handleDelete}
      >
        削除する
      </Button>
      <Button
        variant="secondary"
        size="sm"
        disabled={isPending}
        onClick={() => setConfirming(false)}
      >
        キャンセル
      </Button>
    </div>
  );
}
