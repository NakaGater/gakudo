"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui";
import { deleteNews } from "./actions";

export function DeleteNewsButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("このお知らせを削除しますか？")) return;
    startTransition(async () => {
      await deleteNews(id);
    });
  }

  return (
    <Button variant="destructive" size="sm" loading={isPending} onClick={handleDelete}>
      削除
    </Button>
  );
}
