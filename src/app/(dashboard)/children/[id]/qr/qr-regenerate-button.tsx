"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { regenerateQR } from "../../actions";

type Props = {
  childId: string;
};

export function QRRegenerateButton({ childId }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegenerate() {
    setLoading(true);
    setError(null);
    const result = await regenerateQR(childId);
    if (result?.success) {
      router.refresh();
      setConfirming(false);
    } else {
      setError(result?.message ?? "再発行に失敗しました");
    }
    setLoading(false);
  }

  if (!confirming) {
    return (
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setConfirming(true)}
      >
        QRコードを再発行
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-danger">
        このQRコードを無効にして新しいものを発行します
      </p>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <Button
          variant="destructive"
          size="sm"
          loading={loading}
          onClick={handleRegenerate}
        >
          再発行する
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
