"use client";

import { useRouter } from "next/navigation";

type Props = {
  options: string[];
  current: string;
};

export function MonthSelector({ options, current }: Props) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="month" className="text-sm font-medium text-fg-muted">
        年月
      </label>
      <select
        id="month"
        value={current}
        onChange={(e) => router.push(`/billing?month=${e.target.value}`)}
        className="h-10 rounded-md border border-border bg-bg-elev px-3 text-fg text-sm"
      >
        {options.map((m) => (
          <option key={m} value={m}>
            {m.replace("-", "年")}月
          </option>
        ))}
      </select>
    </div>
  );
}
