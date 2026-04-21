"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Supabaseが URLフラグメントからトークンを自動検出してセッションを確立
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        // 招待 or パスワードリセット → パスワード設定ページへ
        router.replace("/reset-password");
      } else if (event === "TOKEN_REFRESHED" && session) {
        router.replace("/reset-password");
      }
    });

    // フラグメントにエラーがある場合のハンドリング
    const hash = window.location.hash;
    if (hash.includes("error=")) {
      const params = new URLSearchParams(hash.substring(1));
      const errorDesc = params.get("error_description") || "認証に失敗しました";
      setError(errorDesc);
    }

    // 5秒後にもセッションが確立されない場合のタイムアウト
    const timeout = setTimeout(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          router.replace("/reset-password");
        } else if (!error) {
          setError("認証に失敗しました。もう一度招待メールのリンクをお試しください。");
        }
      });
    }, 5000);

    return () => clearTimeout(timeout);
  }, [router, error]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-lg border border-border bg-bg-elev p-6 text-center shadow-sm">
          <p className="text-danger text-sm mb-4">{error}</p>
          <a
            href="/login"
            className="inline-flex items-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hv transition-colors"
          >
            ログインページへ
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 mx-auto animate-spin rounded-full border-4 border-accent border-t-transparent" />
        <p className="text-fg-muted text-sm">認証を処理しています...</p>
      </div>
    </div>
  );
}
