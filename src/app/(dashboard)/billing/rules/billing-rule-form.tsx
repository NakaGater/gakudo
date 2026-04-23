"use client";

import { useActionState } from "react";
import { Button, Input, Card, CardContent, CardHeader } from "@/components/ui";
import type { ActionState } from "@/lib/actions/types";
import { createBillingRule } from "../actions";

export function BillingRuleForm({ onClose }: { onClose?: () => void }) {
  const [state, formAction, isPending] = useActionState<
    ActionState,
    FormData
  >(createBillingRule, null);

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-fg">新しいルールを追加</h2>
        <p className="text-sm text-fg-muted">
          料金ルールは追加のみ可能です（監査証跡のため編集・削除はできません）。
        </p>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <Input
            name="regular_end_time"
            type="time"
            label="通常終了時刻"
            required
            defaultValue="17:00"
            error={state?.fieldErrors?.regular_end_time}
          />

          <Input
            name="rate_per_unit"
            type="number"
            label="延長単価（円）"
            required
            min={1}
            defaultValue={500}
            error={state?.fieldErrors?.rate_per_unit}
          />

          <Input
            name="unit_minutes"
            type="number"
            label="単位時間（分）"
            required
            min={1}
            defaultValue={30}
            error={state?.fieldErrors?.unit_minutes}
          />

          <Input
            name="effective_from"
            type="date"
            label="適用開始日"
            required
            error={state?.fieldErrors?.effective_from}
          />

          {state && !state.success && !state.fieldErrors && (
            <p className="text-sm text-danger">{state.message}</p>
          )}

          {state?.success && (
            <p className="text-sm text-enter">{state.message}</p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" loading={isPending}>
              作成する
            </Button>
            {onClose && (
              <Button type="button" variant="secondary" onClick={onClose}>
                キャンセル
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
