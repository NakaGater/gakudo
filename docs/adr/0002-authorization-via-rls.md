# ADR-0002: 認可をSupabase RLSで一元管理する

Date: 2026-04-20
Status: accepted

## Context

gakudoには3つのロール（parent, teacher, admin）があり、保護者は自分の子供のデータのみ、先生は全児童、管理者は全操作が可能。認可ロジックの実装場所として、アプリケーション層（Next.js Middleware/Server Actions）とデータベース層（Supabase RLS）の2つの選択肢がある。

ロジックが散在すると、Server ActionのチェックとAPIルートのチェックで不整合が発生するリスクがある。30人規模のv1ではシンプルさが最重要。

## Options considered

1. **Next.js Middleware + Server Actions内チェック** — TypeScriptで実装。テストしやすい。ただし全エントリーポイントでチェック漏れのリスク。
2. **Supabase RLS（Row Level Security）** — DBレベルで強制。どのクライアントからアクセスしても同じポリシーが適用される。SQLでの記述が必要。
3. **Middleware + RLS 両方** — 防御的だが複雑。v1には過剰。

## Decision

**Option 2: Supabase RLSで一元管理** を採用。

Next.js側でのロールチェックはUI表示制御（ボタンの表示/非表示）のみとし、実データのアクセス制御はRLSに委ねる。

主なRLSポリシー:
- `profiles`: 自分のプロフィールのみ更新可。admin は全件閲覧。
- `children`: admin は全操作。parent は child_parents 経由で紐付いた児童のみ閲覧。
- `attendances`: teacher/admin は全操作。parent は自分の子供の記録のみ閲覧。
- `photos`: visibility='private' の場合は認証済みユーザーのみ。'public' は全員。
- `monthly_bills`: admin/teacher は全操作。parent は自分の子供の請求のみ閲覧。

## Consequences

- **Positive:** アクセス制御が1箇所（DB）に集約され、漏れのリスクが最小化。
- **Positive:** Supabaseクライアントから直接クエリしても安全。
- **Negative:** RLSポリシーのデバッグがやや難しい（SQL文ベース）。
- **Negative:** 複雑な条件（例: 延長保育ルールの編集権限）はRLSで表現しにくい場合がある → Server Actionでservice_role_keyを使って回避。
- **Neutral:** ローカル開発時もRLSが有効なため、テストデータ投入にservice_role_keyが必要。

## References

- architecture.md: §6 Authorization
- PRD NFR: データ保護
- tech-selection.md: Supabase Auth
