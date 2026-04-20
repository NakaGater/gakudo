"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import Link from "next/link";
import { Button, Input, Badge } from "@/components/ui";
import {
  getTodayAttendanceStatus,
  recordManualAttendance,
  type ChildAttendanceStatus,
} from "../actions";

const statusConfig = {
  none: { label: "未入室", variant: "default" as const },
  entered: { label: "入室中", variant: "enter" as const },
  exited: { label: "退室済", variant: "exit" as const },
} as const;

export default function ManualAttendancePage() {
  const [children, setChildren] = useState<ChildAttendanceStatus[]>([]);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [pendingChildId, setPendingChildId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(() => {
    startTransition(async () => {
      const data = await getTodayAttendanceStatus();
      setChildren(data);
    });
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  function handleToggle(childId: string) {
    setError(null);
    setPendingChildId(childId);
    startTransition(async () => {
      const res = await recordManualAttendance(childId);
      if (!res.success) {
        setError(res.message);
      }
      const data = await getTodayAttendanceStatus();
      setChildren(data);
      setPendingChildId(null);
    });
  }

  const filtered = children.filter((c) =>
    c.name.includes(search.trim()),
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-fg">手動入力</h1>
        <Link
          href="/attendance"
          className="text-accent hover:text-accent-hv text-sm"
        >
          ← QR入力へ戻る
        </Link>
      </div>

      <div className="mb-4">
        <Input
          placeholder="名前で検索"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <p role="alert" className="text-danger text-sm mb-4">
          {error}
        </p>
      )}

      {filtered.length === 0 && !isPending && (
        <p className="text-fg-muted text-center py-8">
          {children.length === 0 ? "児童が登録されていません" : "該当する児童がいません"}
        </p>
      )}

      <ul className="divide-y divide-border" role="list">
        {filtered.map((child) => {
          const config = statusConfig[child.status];
          const isLoading = isPending && pendingChildId === child.childId;
          const buttonLabel =
            child.status === "entered" ? "退室" : "入室";
          const buttonVariant =
            child.status === "entered" ? "exit" : "enter";

          return (
            <li
              key={child.childId}
              className="flex items-center justify-between py-3 gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-fg font-medium truncate">
                  {child.name}
                </span>
                <span className="text-fg-muted text-xs shrink-0">
                  {child.grade}年
                </span>
                <Badge variant={config.variant}>{config.label}</Badge>
              </div>
              <Button
                size="sm"
                variant={buttonVariant}
                loading={isLoading}
                disabled={isPending}
                onClick={() => handleToggle(child.childId)}
              >
                {buttonLabel}
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
