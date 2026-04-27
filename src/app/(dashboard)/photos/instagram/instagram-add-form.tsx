"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { addInstagramPost } from "./actions";
import type { ActionResult, ActionState } from "@/lib/actions/types";

/**
 * Inline banner that shows the result of the most recent add attempt.
 * Extracted so unit tests can drive every visible state shape directly
 * without going through React's async action wiring.
 */
export function AddResultBanner({ state }: { state: ActionState }) {
  if (!state) return null;
  if (!state.success && state.message) {
    return <p className="text-cr-red text-xs mt-2">{state.message}</p>;
  }
  if (state.success) {
    return <p className="text-cr-green text-xs mt-2">✅ 登録しました</p>;
  }
  return null;
}

export function InstagramAddForm() {
  // Optimistic save UX (same pattern as the CMS edit form):
  // calling the Server Action via `<form action={formAction}>` makes
  // Next 16 attach a fresh RSC payload for the entire current page to
  // the response — re-running root layout + (dashboard) layout queries
  // + this page's site_pages fetch before "登録しました" can surface.
  // On CI that's seconds; on production that's a sluggish ~500ms-1s.
  //
  // Bypass <form action> entirely:
  //   1. Show "登録しました" optimistically the moment the form submits.
  //   2. Call the Server Action as a plain async function (which does
  //      NOT include the RSC payload) — typically returns in <500ms.
  //   3. If the action returned an error, replace the optimistic banner
  //      with the actual error message.
  //
  // The public `/photos/instagram` revalidation still runs on the
  // server side via the action's revalidatePath calls, so the post
  // list reflects the new entry on the next page render.
  const [resultState, setResultState] = useState<ActionState>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    setResultState({ success: true, message: "" });

    startTransition(async () => {
      const result: ActionResult = await addInstagramPost(null, formData);
      if (!result.success) {
        setResultState({ success: false, message: result.message });
      } else {
        // Reset the input so the user can submit another URL without
        // re-typing — was implicit when useActionState remounted on
        // success; do it explicitly now.
        form.reset();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="ig-add-form">
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
          <Button type="submit" disabled={isPending}>
            {isPending ? "登録中..." : "📸 追加"}
          </Button>
        </div>
      </div>
      <AddResultBanner state={resultState} />
    </form>
  );
}
