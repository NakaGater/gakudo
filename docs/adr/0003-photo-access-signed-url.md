# ADR-0003: 写真のアクセス制御にSigned URLを使用する

Date: 2026-04-19
Status: accepted

## Context

子どもの写真は認証済みユーザーのみがアクセスできる必要がある（PRD FR-9、FR-10）。Supabase Storageの写真URLが外部に漏洩した場合でも、アクセスを制限する仕組みが必要。

## Options considered

1. **Signed URL（有効期限付き一時URL）** — サーバーサイドで有効期限付きURLを生成し、クライアントに返す
   - Pros: URLが漏洩しても期限切れで無効化。Supabase Storage のネイティブ機能。実装シンプル
   - Cons: URL生成のサーバーサイド処理が必要。期限内なら認証なしでアクセス可能

2. **Supabase Storage RLS** — バケットにRLSポリシーを設定し、認証済みユーザーのみアクセス許可
   - Pros: アクセスごとに認証チェック
   - Cons: `<img src>` でのブラウザ表示時にAuthヘッダー付与が必要で複雑。Next.js Image最適化との相性が悪い

3. **Next.js API Route でプロキシ** — 写真をサーバー経由で配信
   - Pros: 完全な制御
   - Cons: Vercel Serverless Functionsの帯域・実行時間を消費。レスポンス遅延

## Decision

**Signed URL（有効期限1時間）** を採用。認証済みのページレンダリング時にサーバーサイドでSigned URLを生成し、`<img>` タグで配信する。URLは1時間で失効するため、共有されても長期的なリスクは低い。

## Consequences

- Positive: 実装シンプル、Next.js Image最適化と互換、パフォーマンス良好
- Negative: 有効期限内（1時間）はURLのみでアクセス可能。短い期限でリスク軽減
- To revisit: より厳密な制御が必要になった場合はプロキシ方式に切り替え

## References

- PRD FR-9: 写真共有
- PRD Risk #5: 子どもの写真漏洩
