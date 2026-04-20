# Tech selection — gakudo

## Recommendation
Stack: **Next.js (App Router)** + **Supabase** + **Vercel**

React得意なエンジニアにとって最もスムーズな選択。外部HPのSEOにSSR/SSGが必要であり、Supabase（Auth/DB/Storage）との統合エコシステムが最も成熟している。Vercelのfree tierでデプロイコスト0円。

## Constraints extracted from PRD
- NFR: 外部HPはSEO必要 → SSR/SSG必須
- NFR: LCP 2.5秒以内 → SSR/SSG＋CDN配信が有利
- NFR: PWA対応（プッシュ通知） → Service Worker必要
- 制約: React指定（ユーザー希望）
- 制約: 無料枠運用 → ホスティングコスト0円必須

## Implied compatibility from search-first
- Supabase (Auth/DB/Storage) → Next.js用の公式SDK＋Auth Helpersあり
- react-qr-code → React互換（フレームワーク非依存）
- html5-qrcode → ブラウザAPI（フレームワーク非依存）
- Resend → Next.js公式統合あり（API Routes/Server Actions）
- browser-image-compression → クライアントサイド（フレームワーク非依存）

## Candidates considered

| 評価軸 | **Next.js + Vercel** | **Vite React SPA + CF Pages** | **Remix + Fly.io** |
|--------|---------------------|-------------------------------|---------------------|
| SSR / SSG | ネイティブ対応 | CSRのみ（SEO×） | ネイティブSSR |
| PWA対応 | next-pwa等で対応可 | vite-plugin-pwa | 手動設定 |
| Supabase統合 | 公式SDK＋Auth Helpers | 公式SDK（限定的） | 公式SDK |
| Resend統合 | API Routes直接 | 別途API必要 | Loader直接 |
| テンプレート・例 | 豊富（最大） | 多い | 少なめ |
| 学習曲線 | 低（App Router） | 最低（ピュアReact） | 中（Loader学習） |
| デプロイ先 | Vercel Free | CF Pages Free | Fly.io Free |
| 月額コスト | $0 | $0 | $0 |
| 外部HPのSEO | ◎ SSG＋メタタグ | ✗ CSR不利 | ◎ SSR |
| **適合スコア** | **9/10** | **6/10** | **7/10** |

## Decision
- Chosen: **Next.js (App Router) + Supabase + Vercel**
- Rationale: SSR/SSG対応、Supabaseとの最強統合、Reactエンジニアに最も親和性が高い。Vercel無料枠で月額0円運用可能。
- Overridden by human? No
- Notes: Vercelベンダーロックインはセルフホスト可能なため緩和。将来的にCloudflare等への移行も技術的に可能。

## Full stack summary

| Layer | Choice | Role |
|-------|--------|------|
| **Framework** | Next.js 14+ (App Router) | フロントエンド＋API Routes |
| **Language** | TypeScript | 型安全性 |
| **Styling** | Tailwind CSS | ユーティリティファーストCSS |
| **Auth** | Supabase Auth | 認証・セッション管理 |
| **Database** | Supabase (PostgreSQL) | データストア＋RLS |
| **Storage** | Supabase Storage | 写真・資料ファイル保存 |
| **QR生成** | react-qr-code | SVG QRコード生成 |
| **QR読取** | html5-qrcode | ウェブカメラQR読取 |
| **メール** | Resend | トランザクションメール |
| **通知** | Web Push API + web-push | プッシュ通知＋メールフォールバック |
| **画像圧縮** | browser-image-compression | クライアントサイド圧縮 |
| **Deploy** | Vercel | ホスティング＋CDN |
| **Testing** | Vitest + Playwright | ユニット＋E2Eテスト |

## Recorded by
- date: 2026-04-20
- mode: human-approved
