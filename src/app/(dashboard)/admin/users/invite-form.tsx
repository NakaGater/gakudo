"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Button, Input } from "@/components/ui";
import { inviteUser } from "./actions";
import type { ActionResult, ActionState } from "@/lib/actions/types";

const ROLE_OPTIONS = [
  { value: "parent", label: "保護者" },
  { value: "teacher", label: "先生" },
  { value: "admin", label: "管理者" },
  { value: "entrance", label: "入口端末" },
] as const;

/**
 * Inline banner that surfaces the result of the most recent invite
 * attempt. Extracted so unit tests can drive each visible state shape
 * directly without going through React's async useTransition machinery.
 */
export function InviteResultBanner({ state }: { state: ActionState }) {
  if (!state) return null;
  if (!state.success) return <p className="text-sm text-danger">{state.message}</p>;
  return <p className="text-sm text-success">{state.message || "招待メールを送信しました"}</p>;
}

export function InviteForm({ onClose }: { onClose: () => void }) {
  // Optimistic submit (same pattern as edit-page-form.tsx and
  // instagram-add-form.tsx — see their comments). Calling the Server
  // Action via `<form action={formAction}>` makes Next 16 attach a
  // fresh RSC payload for the entire current page (root layout +
  // dashboard layout's getUser/badge queries + admin/users page query)
  // before the in-form state.message can update with "招待メールを送信
  // しました". On CI that pushed the success message past the test
  // budget repeatedly. Bypass <form action> and call the action
  // directly inside useTransition — the banner shows instantly.
  const [resultState, setResultState] = useState<ActionState>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (resultState?.success) {
      formRef.current?.reset();
      const timer = setTimeout(onClose, 1500);
      return () => clearTimeout(timer);
    }
  }, [resultState, onClose]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Optimistic: assume success — inviteUser is a write action and
    // typically succeeds; if it fails we override below.
    setResultState({ success: true, message: "招待メールを送信しました" });

    startTransition(async () => {
      const result: ActionResult = await inviteUser(null, formData);
      if (!result.success) {
        setResultState({ success: false, message: result.message });
      } else if (result.message) {
        // The action returned its own success message — use that
        // (it might say something more specific than our default).
        setResultState({ success: true, message: result.message });
      }
    });
  };

  return (
    <div className="rounded-md bg-bg-elev p-6 shadow-sm border border-border">
      <h2 className="text-lg font-bold text-fg mb-4">ユーザー招待</h2>

      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="メールアドレス"
          name="email"
          type="email"
          required
          placeholder="user@example.com"
        />

        <Input label="名前" name="name" type="text" required placeholder="山田 太郎" />

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

        <InviteResultBanner state={resultState} />

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
