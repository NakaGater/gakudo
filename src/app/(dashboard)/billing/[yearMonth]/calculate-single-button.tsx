"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui";
import { calculateSingleBill } from "../actions";

type Props = {
  childId: string;
  yearMonth: string;
};

export function CalculateSingleButton({ childId, yearMonth }: Props) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  function handleClick() {
    setResult(null);
    startTransition(async () => {
      const res = await calculateSingleBill(childId, yearMonth);
      setResult(res);
    });
  }

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <Button onClick={handleClick} loading={isPending} size="sm">
        計算する
      </Button>
      {result && (
        <p className={`text-sm ${result.success ? "text-enter" : "text-danger"}`}>
          {result.message}
        </p>
      )}
    </div>
  );
}
