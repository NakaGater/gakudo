"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Card, CardContent, CardHeader } from "@/components/ui";
import type { ActionState } from "../types";
import { createChild } from "../actions";

const grades = [1, 2, 3, 4, 5, 6] as const;

export default function NewChildPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    createChild,
    null,
  );

  useEffect(() => {
    if (state?.success && state.childId) {
      router.push(`/children/${state.childId}`);
    }
  }, [state, router]);

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold text-fg mb-6">児童 新規登録</h1>

      <Card>
        <CardHeader>
          <p className="text-sm text-fg-muted">
            児童情報を入力してください。QRコードは自動で生成されます。
          </p>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="flex flex-col gap-4">
            <Input name="name" label="名前" required placeholder="例: 山田太郎" />

            <div className="flex flex-col gap-1">
              <label htmlFor="grade" className="text-sm font-medium text-fg">
                学年
              </label>
              <select
                id="grade"
                name="grade"
                required
                className="h-10 w-full rounded-sm border border-border bg-bg-elev px-3 text-fg focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none"
                defaultValue=""
              >
                <option value="" disabled>
                  選択してください
                </option>
                {grades.map((g) => (
                  <option key={g} value={g}>
                    {g}年
                  </option>
                ))}
              </select>
            </div>

            {state && !state.success && (
              <p className="text-sm text-danger">{state.message}</p>
            )}

            <Button type="submit" loading={isPending}>
              登録する
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
