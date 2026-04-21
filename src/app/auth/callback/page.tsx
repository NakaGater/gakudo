"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);

      // エラーチェック
      if (params.get("error")) {
        const desc = params.get("error_description") || "認証に失敗しました";
        setError(decodeURIComponent(desc.replace(/\+/g, " ")));
        return;
      }

      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (!accessToken || !refreshToken) {
        setError("認証情報が見つかりません。もう一度招待メールのリンクをお試しください。");
        return;
      }

      const supabase = createClient();
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        setError(`セッションの作成に失敗しました: ${sessionError.message}`);
        return;
      }

      router.replace("/reset-password");
    }

    handleCallback();
  }, [router]);

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
