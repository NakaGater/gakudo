"use client";

import { useActionState } from "react";
import { type AuthUser } from "@/lib/auth/get-user";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/actions/types";
import { updateProfile } from "./actions";

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
    <Card className="max-w-lg id-card" style={{ maxWidth: 480 }}>
      <CardHeader>
        <div className="flex flex-col items-center gap-3">
          <div className="avatar-lg flex items-center justify-center rounded-full text-3xl font-bold" style={{ width: 72, height: 72, background: "linear-gradient(135deg, #fbbf24, #f59e0b)", color: "#fff" }}>
            {user.name?.charAt(0) ?? "?"}
          </div>
          <p className="text-lg font-bold text-ink">{user.name}</p>
          <span className={`role-badge role-badge--${user.role}`}>
            {roleLabels[user.role]}
          </span>
        </div>
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
            className="profile-input"
          />

          <Input
            label="メールアドレス"
            name="email"
            value={user.email}
            disabled
            className="profile-input"
          />
        </CardContent>
        <CardFooter>
          <Button type="submit" className="btn btn-primary" loading={isPending}>
            保存
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
