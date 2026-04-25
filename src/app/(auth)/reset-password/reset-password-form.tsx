"use client";

import { useActionState } from "react";
import { Button, Input, Card, CardHeader, CardContent } from "@/components/ui";
import { resetPassword } from "./actions";
import type { ActionState } from "@/lib/actions/types";

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(resetPassword, null);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <h1 className="text-xl font-bold text-center text-fg">パスワードを変更</h1>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-4">
          <Input
            label="新しいパスワード"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <Input
            label="パスワード確認"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
          {!state?.success && state?.message && (
            <p role="alert" className="text-sm text-danger text-center">
              {state.message}
            </p>
          )}
          <Button type="submit" variant="primary" className="w-full" loading={pending}>
            パスワードを変更
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
