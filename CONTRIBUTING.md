# Contributing to gakudo

学童保育管理システム gakudo への貢献ガイドです。

## 開発フロー

1. `develop` から feature branch を切る（命名: `feat/*`、`fix/*`、`refactor/*`、`chore/*`）
2. 1 PR = 1 ドメイン、diff は 400 LOC 以下を目安
3. ローカルで `npm run check:all` を緑にしてから push
4. PR テンプレートに従ってチェックリストを埋める
5. CI（typecheck / lint / test / build / e2e smoke）が緑、レビュー 1 名以上 → マージ

## ローカル開発

詳細は `docs/getting-started.md` を参照。

```sh
npm install
cp .env.example .env.local   # 値を埋める
supabase start
npm run db:types             # Supabase 型を生成
npm run dev
```

主要コマンド:

| コマンド | 用途 |
|---|---|
| `npm run dev` | Next.js 開発サーバ |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run test` | Vitest（1回） |
| `npm run test:watch` | Vitest watch |
| `npm run e2e` | Playwright 全 spec |
| `npm run e2e:ui` | Playwright UI モード |
| `npm run check:all` | typecheck + lint + test |
| `npm run db:types` | Supabase 型再生成 |
| `npm run audit` | `npm audit --audit-level=moderate` |

## コード規約

リファクタリング戦略（`/root/.claude/plans/smooth-popping-kurzweil.md` 由来）を踏襲します。

1. **新規 Server Action は `withAuth` 経由**（Phase 2-C 以降）。直接 `getUser()` を呼ぶのは page (RSC) 限定
2. **`error.message` を `return { message: ... }` に含めない**。`sanitizeError(err, "...に失敗しました")` を使う
3. **`as unknown as` 禁止**（test / feature detection 除く）。代替は `.returns<T>()` か Type guard
4. **FormData は `lib/validation/form.ts` ヘルパー経由**。手書き `formData.get(...) as string` 禁止
5. **新規ファイルは 200 行以下** を目安、超えるなら分割理由を PR に明記
6. **新規テストは `supabase-mock-factory` 経由**（Phase 4-A 以降）
7. **Supabase クエリは `select("*")` 禁止**、必要カラムを明示
8. **`revalidatePath(path, "layout")` は justification なしに使わない**。`"page"` か `revalidateTag` 推奨
9. **`for await` で外部 I/O を回さない**。`Promise.allSettled` を第一選択
10. **命名**: `upload*` / `create*` / `update*` / `delete*` の動詞統一。`set*` は React state setter 専用

## コミットメッセージ

Conventional Commits を推奨:

```
<type>(<scope>): <subject>

[body]
```

`type`: `feat` / `fix` / `refactor` / `test` / `docs` / `chore` / `perf` / `ci`

例:
- `feat(announcements): add recipient picker filter`
- `refactor(actions): migrate billing to withAuth`
- `perf(notifications): parallelize push send with Promise.allSettled`

## テスト方針

- `lib/` の新規関数は **必ず** ユニットテストを追加
- `app/.../actions.ts` の新規 action は **認可分岐 + 1 happy path** を最低限カバー
- UI 変更時は該当 E2E flow を更新、なければ追加

## セキュリティ

脆弱性報告は GitHub の Security Advisories 経由でお願いします。コードに直接書かないでください。
