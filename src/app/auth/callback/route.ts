import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// GET: HTMLページを返す（クライアントサイドでハッシュフラグメントを処理）
// PKCE flowの場合は ?code= クエリパラメータをサーバー側で処理
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  // PKCE flow: codeパラメータがある場合はサーバー側でセッションを設定
  if (code) {
    const response = NextResponse.redirect(new URL("/reset-password", url.origin));

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent("認証に失敗しました")}`, url.origin)
      );
    }

    return response;
  }

  // Implicit flow: ハッシュフラグメントをクライアント側で処理
  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>認証処理中...</title>
  <style>
    body { display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; font-family: sans-serif; background: #faf9f6; color: #333; }
    .container { text-align: center; }
    .spinner { width: 32px; height: 32px; margin: 0 auto 16px; border: 4px solid #e0e0e0; border-top-color: #f59e0b; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error { color: #dc2626; }
    a { display: inline-block; margin-top: 16px; padding: 8px 16px; background: #f59e0b; color: #fff; text-decoration: none; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner" id="spinner"></div>
    <p id="status">認証を処理しています...</p>
  </div>
  <script>
    (async function() {
      var status = document.getElementById('status');
      var spinner = document.getElementById('spinner');

      function showError(msg) {
        spinner.style.display = 'none';
        status.className = 'error';
        status.textContent = msg;
        status.insertAdjacentHTML('afterend', '<a href="/login">ログインページへ</a>');
      }

      var hashStr = sessionStorage.getItem('__auth_hash') || window.location.hash.substring(1);
      sessionStorage.removeItem('__auth_hash');

      if (!hashStr) { showError('認証情報が見つかりません。'); return; }

      var params = new URLSearchParams(hashStr);
      if (params.get('error')) {
        showError(decodeURIComponent((params.get('error_description') || '認証に失敗しました').replace(/\\+/g, ' ')));
        return;
      }

      var accessToken = params.get('access_token');
      var refreshToken = params.get('refresh_token');
      if (!accessToken || !refreshToken) { showError('認証トークンが不足しています。'); return; }

      try {
        var res = await fetch('/auth/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: accessToken, refresh_token: refreshToken }),
        });
        if (!res.ok) {
          var data = await res.json().catch(function() { return {}; });
          showError(data.error || 'セッション作成に失敗しました');
          return;
        }
        window.location.href = '/reset-password';
      } catch(e) {
        showError('エラー: ' + e.message);
      }
    })();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

// POST: トークンを受け取り、サーバー側でセッションcookieを設定
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { access_token, refresh_token } = body;

  if (!access_token || !refresh_token) {
    return NextResponse.json({ error: "トークンが不足しています" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // getUser() を呼んでセッションcookieの書き込みを確実にする
  await supabase.auth.getUser();

  return response;
}
