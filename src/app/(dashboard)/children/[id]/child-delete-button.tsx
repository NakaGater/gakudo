"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { deleteChild } from "../actions";

type Props = {
  id: string;
  name: string;
};

export function ChildDeleteButton({ id, name }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);
    const result = await deleteChild(id);
    if (result?.success) {
      router.push("/children");
    } else {
      setError(result?.message ?? "削除に失敗しました");
      setLoading(false);
    }
  }

  if (!confirming) {
    return (
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setConfirming(true)}
      >
        この児童を削除する
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-danger">
        「{name}」を本当に削除しますか？
      </p>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <Button
          variant="destructive"
          size="sm"
          loading={loading}
          onClick={handleDelete}
        >
          削除する
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setConfirming(false)}
          disabled={loading}
        >
          キャンセル
        </Button>
      </div>
    </div>
  );
}
