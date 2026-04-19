# Ship Bundle — v0.1.0

リモートにmainブランチがないため、PRは手動で作成してください。

## 手順

### 1. mainブランチを作成してpush

```bash
# 現在のブランチをpush
git push -u origin claude/setup-fastest-mvp-plugin-LLVVa

# mainブランチを作成（初期コミットから）
git checkout -b main 8440b88
git push -u origin main

# 元のブランチに戻る
git checkout claude/setup-fastest-mvp-plugin-LLVVa
```

### 2. GitHub上でPRを作成

```bash
gh pr create \
  --base main \
  --head claude/setup-fastest-mvp-plugin-LLVVa \
  --title "学童保育Webアプリ v0.1.0 — 初回リリース" \
  --body "$(cat <<'BODY'
## Summary
学童保育施設向けWebアプリの初回リリース。公開HP、QRコード入退場記録、連絡事項配信、写真共有を統合したプラットフォーム。KAZASUの代替として入退場管理の固定費削減を実現する。

## User stories delivered
- US-1: 公開HPで施設情報を閲覧する
- US-2: アカウントにログインする
- US-3: 生徒を登録する
- US-4: 保護者アカウントを作成する
- US-5: パスワードをリセットする
- US-6: QRコードカードを生成する
- US-7: QRコードで入退場を記録する
- US-8: 入退場履歴を閲覧する（先生）
- US-9: 子どもの入退場を確認する
- US-10: 連絡事項を登録する
- US-11: 連絡事項を閲覧する
- US-12: 写真をアップロードする
- US-13: 写真を閲覧する

## Test plan
- [ ] Unit tests pass: `npm test` (89 tests)
- [ ] Build succeeds: `npm run build`
- [ ] Type check: `npx tsc --noEmit`
- [ ] Env vars present in `.env.example`
- [ ] Security: review `docs/security-report.md`

## Security summary
- Critical: 0
- High: 0 (1件検出、修正済み)
- Medium: 0 (3件検出、修正済み)

## Known limitations (deferred to v2)
- 動画共有
- 延長保育料金の自動計算
- 複数施設対応
- プッシュ通知
- 既読管理
- OAuth/ソーシャルログイン

## Deploy preparation checklist
- [ ] Supabaseプロジェクト作成 (https://supabase.com)
- [ ] 環境変数設定: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
- [ ] DBマイグレーション適用: 00001_create_tables.sql, 00002_create_rls_policies.sql, 00003_create_storage_bucket.sql
- [ ] Vercelプロジェクト作成・GitHubリポジトリ連携
- [ ] 初期管理者アカウント作成（シードスクリプト実行）

## Autonomy disclosure
Built autonomously by the fastest-mvp plugin:
- PRD approved 2026-04-19 by human
- Tech stack (Next.js + Supabase + Vercel) approved 2026-04-19 by human
- Design approved 2026-04-19 by human (GAN score 36/40)
BODY
)"
```

## デプロイ手順

1. [Supabase](https://supabase.com) でプロジェクトを作成
2. Supabase ダッシュボードからURL・Anon Key・Service Role Keyを取得
3. [Vercel](https://vercel.com) でGitHubリポジトリを連携
4. Vercelの環境変数に上記キーを設定
5. Supabase SQL Editorでマイグレーションを実行
6. 初期管理者アカウントを作成
7. デプロイ完了
