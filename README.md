# gakudo

学童保育施設の業務管理 SaaS（出退席 / 請求 / お知らせ配信 / 写真ギャラリー / 保護者ポータル / CMS）。

- スタック: **Next.js 16 (App Router) / React 19 / TypeScript strict / Supabase / Tailwind v4 / Vitest / Playwright**
- 設計: Server Actions + RSC、認可は Supabase RLS、PWA + Web Push、メール送信は Resend
- ドキュメント: `docs/architecture.md`, `docs/prd.md`, `docs/adr/`

## Getting Started

セットアップ手順の詳細は `docs/getting-started.md` を参照。最短経路:

```sh
npm install
cp .env.example .env.local           # 値を埋める
supabase start                       # ローカル Supabase を起動
npm run db:types                     # 型を生成
npm run dev                          # http://localhost:3000
```

E2E テストには Mailpit 経由でメールを参照する flow があるため、`supabase start` が前提です。

## 主要コマンド

| コマンド               | 内容                               |
| ---------------------- | ---------------------------------- |
| `npm run dev`          | 開発サーバ                         |
| `npm run build`        | プロダクションビルド               |
| `npm run typecheck`    | `tsc --noEmit`                     |
| `npm run lint`         | ESLint                             |
| `npm run format`       | Prettier 一括整形                  |
| `npm run format:check` | Prettier の整形チェック            |
| `npm run test`         | Vitest（1 回実行）                 |
| `npm run test:watch`   | Vitest watch                       |
| `npm run e2e`          | Playwright 全 spec                 |
| `npm run e2e:ui`       | Playwright UI モード               |
| `npm run check:all`    | typecheck + lint + test + format   |
| `npm run db:types`     | Supabase 型再生成                  |
| `npm run audit`        | `npm audit --audit-level=moderate` |

## ブランチ運用

- 開発は `develop` から feature branch を切る（例: `feat/`, `fix/`, `refactor/`）
- 1 PR = 1 ドメイン、diff は 400 LOC を目安
- マージ要件: CI 緑 + レビュー 1 名以上
- コード規約・PR 手順: `CONTRIBUTING.md`

## ドキュメント

- `docs/getting-started.md` — ローカル開発環境のセットアップ
- `docs/architecture.md` — システム概要・コンポーネント分担
- `docs/prd.md` / `docs/user-stories.md` — プロダクト要件
- `docs/adr/` — Architecture Decision Records
- `docs/security-report.md` — セキュリティレビュー記録
