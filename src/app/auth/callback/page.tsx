import { Suspense } from "react";
import { CallbackClient } from "./callback-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "認証処理中... | 星ヶ丘こどもクラブ",
};

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-bg">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-border border-t-accent" />
            <p className="text-fg-muted">認証を処理しています...</p>
          </div>
        </div>
      }
    >
      <CallbackClient />
    </Suspense>
  );
}
