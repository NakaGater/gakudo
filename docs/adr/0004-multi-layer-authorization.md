# ADR-0004: 認可の多層防御（RLS + Middleware + Server Actions）

Date: 2026-04-19
Status: accepted

## Context

本アプリは3つのアクセスレベル（未ログイン / 保護者 / 先生）を持ち、保護者は自分の子どもの情報にしかアクセスできない。認可チェックが1箇所に集中していると、その箇所のバグが全データの漏洩につながる。

## Options considered

1. **DB層のみ（Supabase RLS）** — すべての認可をRLSポリシーで制御
   - Pros: データベース層で確実に制御、アプリのバグでデータ漏洩しない
   - Cons: RLSだけではページレベルのアクセス制御ができない。ユーザーフレンドリーなエラーハンドリングが難しい

2. **アプリ層のみ（Middleware + Server Actions）** — Next.js側で全制御
   - Pros: 柔軟、UIと一体でエラーハンドリング可能
   - Cons: ロジックのバグで他ユーザーのデータが見えるリスク

3. **多層防御（RLS + Middleware + Server Actions）** — 3層で重複チェック
   - Pros: 1層にバグがあっても他層が防御。Defense in depth
   - Cons: 実装箇所が増える。ポリシーの一貫性維持が必要

## Decision

**多層防御** を採用。

- **Supabase RLS**: 保護者が自分の子どものデータにしかアクセスできないことをDB層で保証。全テーブルに`auth.uid()`ベースのポリシーを設定
- **Next.js Middleware**: ルートレベルで認証チェック。`/(protected)/teacher/*` は teacher ロールのみ、`/(protected)/parent/*` は parent ロールのみ
- **Server Actions / Route Handlers**: 個別のビジネスロジック内でロールチェック。不正アクセス時はユーザーフレンドリーなエラーメッセージ

## Consequences

- Positive: 子どもの個人情報を扱うため、1箇所の実装ミスがデータ漏洩につながるリスクを最小化
- Negative: 認可ロジックが3箇所に分散。変更時に全層の整合性を確認する必要がある
- Neutral: RLSポリシーは `supabase/migrations/` でバージョン管理し、レビュー対象とする

## References

- PRD FR-10: ロールベースアクセス制御
- PRD Risk #5: 子どもの写真漏洩
- Architecture §6: Cross-cutting concerns / Authorization
