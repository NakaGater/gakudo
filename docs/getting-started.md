# Getting Started

ローカル開発環境のセットアップ手順。所要 10〜15 分。

## 前提

- **Node.js 20.x**（`.nvmrc` または devcontainer 利用推奨）
- **npm 10.x**（Node 20 同梱）
- **Supabase CLI**（[インストール手順](https://supabase.com/docs/guides/local-development/cli/getting-started)）
- **Docker**（Supabase ローカルスタックが要求）

devcontainer を使う場合は VS Code で `Dev Containers: Reopen in Container` を実行すれば前提は自動で揃います（`.devcontainer/devcontainer.json` 参照）。

## 手順

### 1. リポジトリ取得と依存インストール

```sh
git clone https://github.com/NakaGater/gakudo.git
cd gakudo
npm install
```

### 2. 環境変数

```sh
cp .env.example .env.local
```

ローカル開発で必要な値はすべて `supabase start` の出力から取得できます（次節）。`RESEND_API_KEY` は本番のメール送信で必要、ローカルでは Mailpit が代替するためダミー値で OK。

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase start の anon key>
SUPABASE_SERVICE_ROLE_KEY=<supabase start の service_role key>
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<下記コマンドで生成>
VAPID_PRIVATE_KEY=<下記コマンドで生成>
RESEND_API_KEY=re_test_dummy
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

VAPID キー生成（Web Push 用）:

```sh
npx web-push generate-vapid-keys
```

### 3. Supabase ローカルスタックを起動

```sh
supabase start
```

出力された `API URL`、`anon key`、`service_role key` を `.env.local` に貼ります。Mailpit は `Inbucket URL` で確認できます（`http://127.0.0.1:54324`）。

マイグレーションは `supabase start` 時に自動適用されます。テストユーザーを作るには:

```sh
./supabase/seed-auth.sh
```

### 4. Supabase 型を生成

```sh
SUPABASE_PROJECT_ID=$(supabase status -o json | jq -r .api.project_id) npm run db:types
```

または Supabase project ID を `.env.local` に追加してから `npm run db:types`。

### 5. 開発サーバ起動

```sh
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開く。`/login` から seed 済みユーザー（例: `admin@example.com` / `password123`）でログイン可能。

## テストの実行

| 種別 | コマンド | 備考 |
|---|---|---|
| ユニット（Vitest） | `npm run test` | 1 回実行 |
| ユニット watch | `npm run test:watch` | TDD 用 |
| E2E（Playwright） | `npm run e2e` | `supabase start` と Mailpit が必要 |
| E2E UI モード | `npm run e2e:ui` | 個別 spec を inspect |
| 全部 | `npm run check:all` | typecheck + lint + test + format:check |

## トラブルシュート

- **`supabase start` が失敗する**: Docker が起動しているか確認。ポート競合（54321/54322/54323/54324）があれば `supabase stop --no-backup` 後に再起動。
- **`npm run db:types` が空を返す**: Supabase スタックが起動していて、`SUPABASE_PROJECT_ID` が正しく設定されていることを確認。
- **Web Push 通知が動かない**: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` と `VAPID_PRIVATE_KEY` が同じペアか確認。
- **E2E が flaky**: `supabase status` で stack が緑か、Mailpit が空か（`./supabase/seed-auth.sh` で reset）確認。

## 次のステップ

- コード規約・PR フロー: [`CONTRIBUTING.md`](../CONTRIBUTING.md)
- アーキテクチャ概要: [`architecture.md`](./architecture.md)
- 主要決定: [`adr/`](./adr/)
