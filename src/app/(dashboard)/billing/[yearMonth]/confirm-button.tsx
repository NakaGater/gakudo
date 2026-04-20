"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui";
import { confirmBill } from "../actions";

type Props = {
  billId: string;
};

export function ConfirmButton({ billId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  function handleClick() {
    setResult(null);
    startTransition(async () => {
      const res = await confirmBill(billId);
      setResult(res);
    });
  }

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <Button onClick={handleClick} loading={isPending} size="sm">
        確定
      </Button>
      {result && (
        <p className={`text-sm ${result.success ? "text-enter" : "text-danger"}`}>
          {result.message}
        </p>
      )}
    </div>
  );
}
