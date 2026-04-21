"use client";

import { useActionState } from "react";
import { type AuthUser } from "@/lib/auth/get-user";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateProfile, type ActionState } from "./actions";

const roleLabels: Record<AuthUser["role"], string> = {
  parent: "保護者",
  teacher: "指導員",
  admin: "管理者",
};

interface ProfileFormProps {
  user: AuthUser;
  success?: boolean;
}

export function ProfileForm({ user, success }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateProfile,
    null,
  );

  const showSuccess = state?.success || (success && state === null);

  return (
    <Card className="max-w-lg id-card">
      <CardHeader>
        <h1 className="main__title">👤 プロフィール</h1>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {showSuccess && (
            <p className="text-sm text-success" role="status">
              保存しました
            </p>
          )}
          {state?.success === false && (
            <p className="text-sm text-danger" role="alert">
              {state.message}
            </p>
          )}

          <Input
            label="名前"
            name="name"
            defaultValue={user.name}
            required
            maxLength={50}
          />

          <Input
            label="メールアドレス"
            name="email"
            value={user.email}
            disabled
          />

          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">役割</span>
            <div>
              <span className={`role-badge role-badge--${user.role}`}>
                {roleLabels[user.role]}
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" loading={isPending}>
            保存
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
