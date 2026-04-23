"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui";
import { addInstagramPost } from "./actions";
import type { ActionState } from "@/lib/actions/types";

const initialState: ActionState = { success: false, message: "" };

export function InstagramAddForm() {
  const [state, formAction, pending] = useActionState(addInstagramPost, initialState);

  return (
    <form action={formAction} className="ig-add-form">
      <div className="ig-add-form__fields">
        <div className="ig-add-form__field">
          <label htmlFor="post_url" className="text-xs font-bold text-ink-mid">
            Instagram URL
          </label>
          <input
            id="post_url"
            name="post_url"
            type="url"
            placeholder="https://www.instagram.com/p/xxxxx/"
            required
            className="form-input"
          />
        </div>
        <div className="ig-add-form__field">
          <label htmlFor="caption" className="text-xs font-bold text-ink-mid">
            メモ（任意）
          </label>
          <input
            id="caption"
            name="caption"
            type="text"
            placeholder="夏祭りの様子"
            className="form-input"
          />
        </div>
        <div className="ig-add-form__submit">
          <Button type="submit" disabled={pending}>
            {pending ? "登録中..." : "📸 追加"}
          </Button>
        </div>
      </div>
      {state?.message && !state.success && (
        <p className="text-cr-red text-xs mt-2">{state.message}</p>
      )}
      {state?.success && (
        <p className="text-cr-green text-xs mt-2">✅ 登録しました</p>
      )}
    </form>
  );
}
