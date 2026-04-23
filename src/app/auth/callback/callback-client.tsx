"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { exchangeCodeForSession, setSessionFromTokens } from "./actions";

export function CallbackClient() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      // PKCE flow: ?code= パラメータ
      const code = searchParams.get("code");
      if (code) {
        const result = await exchangeCodeForSession(code);
        if (!result.success) {
          setError(result.message);
          return;
        }
        window.location.href = "/reset-password";
        return;
      }

      // Implicit flow: #access_token= ハッシュフラグメント
      const hashStr =
        sessionStorage.getItem("__auth_hash") ||
        window.location.hash.substring(1);
      sessionStorage.removeItem("__auth_hash");

      if (!hashStr) {
        setError("認証情報が見つかりません。");
        return;
      }

      const params = new URLSearchParams(hashStr);

      if (params.get("error")) {
        const desc = params.get("error_description") || "認証に失敗しました";
        setError(decodeURIComponent(desc.replace(/\+/g, " ")));
        return;
      }

      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      if (!accessToken || !refreshToken) {
        setError("認証トークンが不足しています。");
        return;
      }

      const result = await setSessionFromTokens(accessToken, refreshToken);
      if (!result.success) {
        setError(result.message);
        return;
      }

      window.location.href = "/reset-password";
    }

    handleCallback();
  }, [searchParams]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="text-center">
          <p className="text-danger mb-4">{error}</p>
          <Link
            href="/login"
            className="inline-block rounded-md bg-accent px-4 py-2 text-sm text-white hover:bg-accent/90"
          >
            ログインページへ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-border border-t-accent" />
        <p className="text-fg-muted">認証を処理しています...</p>
      </div>
    </div>
  );
}
