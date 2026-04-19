# がくどう — 学童保育Webアプリ

学童保育施設向けのWebアプリケーション。施設のHP、保護者への写真・連絡事項の共有、QRコードによる生徒の入退場記録を一つのプラットフォームに統合します。

## 機能

- **公開HP** — 施設紹介・説明会案内・お知らせ
- **入退場記録** — QRコードカードをWebカメラでスキャンして入退場を記録
- **連絡事項** — 先生が登録、保護者がスマホで確認
- **写真共有** — 先生がアップロード、保護者が閲覧（認証必須）
- **ロールベースアクセス制御** — 先生（管理者）/ 保護者（閲覧者）/ 一般訪問者（HP閲覧のみ）

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Hosting**: Vercel
- **テスト**: Vitest + Testing Library

## セットアップ

### 前提条件

- Node.js 18+
- npm
- Docker (Supabase ローカル開発用)
- Supabase CLI (`npm install -g supabase`)

### 環境変数

`.env.example` をコピーして `.env.local` を作成:

```bash
cp .env.example .env.local
```

必要な環境変数:

| 変数 | 説明 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクトURL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名キー |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase サービスロールキー（サーバーサイドのみ） |

### ローカル開発

```bash
# 依存パッケージのインストール
npm install

# Supabase ローカル起動（Docker必要）
supabase start

# マイグレーション適用
supabase db reset

# 開発サーバー起動
npm run dev
```

http://localhost:3000 でアクセス

### テスト

```bash
npm test          # テスト実行
npm run test:watch  # ウォッチモード
```

### ビルド

```bash
npm run build     # プロダクションビルド
npm run typecheck # 型チェック
```

## プロジェクト構成

```
src/
  app/
    (public)/        # 公開HP（未ログイン）
    (auth)/          # ログイン・パスワードリセット
    (protected)/
      teacher/       # 先生用管理画面
      parent/        # 保護者用画面
  components/        # 共通コンポーネント
  lib/
    supabase/        # Supabaseクライアント・型定義
supabase/
  migrations/        # DBマイグレーション
  seed.sql           # シードデータ
docs/                # 設計ドキュメント
```

## ドキュメント

- [PRD](docs/prd.md) — 製品要件定義書
- [Architecture](docs/architecture.md) — アーキテクチャ設計
- [User Stories](docs/user-stories.md) — ユーザーストーリー
- [Design System](docs/design-system.md) — デザインシステム
- [Security Report](docs/security-report.md) — セキュリティレポート
