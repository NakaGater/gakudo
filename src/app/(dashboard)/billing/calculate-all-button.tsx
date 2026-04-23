"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui";
import { calculateAllBills } from "./actions";

type Props = {
  yearMonth: string;
};

export function CalculateAllButton({ yearMonth }: Props) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  function handleClick() {
    setResult(null);
    startTransition(async () => {
      const res = await calculateAllBills(yearMonth);
      setResult(res);
    });
  }

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <Button onClick={handleClick} loading={isPending} size="sm" className="h-10">
        一括計算
      </Button>
      {result && (
        <p className={`text-sm ${result.success ? "text-enter" : "text-danger"}`}>
          {result.message}
        </p>
      )}
    </div>
  );
}
