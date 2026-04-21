"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button, Input } from "@/components/ui";
import type { ActionState } from "@/lib/actions/types";
import { inviteUser } from "./actions";

const ROLE_OPTIONS = [
  { value: "parent", label: "保護者" },
  { value: "teacher", label: "先生" },
  { value: "admin", label: "管理者" },
  { value: "entrance", label: "入口端末" },
] as const;

export function InviteForm({ onClose }: { onClose: () => void }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    inviteUser,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      const timer = setTimeout(onClose, 1500);
      return () => clearTimeout(timer);
    }
  }, [state, onClose]);

  return (
    <div className="rounded-md bg-bg-elev p-6 shadow-sm border border-border">
      <h2 className="text-lg font-bold text-fg mb-4">ユーザー招待</h2>

      <form ref={formRef} action={formAction} className="flex flex-col gap-4">
        <Input
          label="メールアドレス"
          name="email"
          type="email"
          required
          placeholder="user@example.com"
        />

        <Input
          label="名前"
          name="name"
          type="text"
          required
          placeholder="山田 太郎"
        />

        <div className="flex flex-col gap-1">
          <label htmlFor="role" className="text-sm font-medium text-fg">
            役割
          </label>
          <select
            id="role"
            name="role"
            required
            defaultValue="parent"
            className="h-10 w-full rounded-sm border border-border bg-bg-elev px-3 text-fg focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {state && !state.success && (
          <p className="text-sm text-danger">{state.message}</p>
        )}
        {state?.success && (
          <p className="text-sm text-success">{state.message}</p>
        )}

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            キャンセル
          </Button>
          <Button type="submit" loading={isPending}>
            招待する
          </Button>
        </div>
      </form>
    </div>
  );
}
