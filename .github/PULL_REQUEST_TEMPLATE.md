## 概要

<!-- なぜこの変更が必要か。背景・目的を 1〜3 行で。 -->

## 変更点

<!-- 何を変えたか。箇条書きで。 -->

-

## 関連 Issue / Phase

<!-- 例: Refactoring plan Phase 0-A、#123 -->

## 動作確認

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] 該当する場合 `npm run e2e -- --grep @smoke`

## レビュアー向けチェックリスト

横串ルール（リファクタリング戦略より）:

- [ ] 新規 Server Action は `withAuth` 経由（Phase 2-C 以降）
- [ ] `error.message` を直接ユーザーに返していない（`sanitizeError` 使用）
- [ ] `as unknown as` を使っていない（test / feature detection 除く）
- [ ] FormData は `lib/validation/form.ts` ヘルパー経由
- [ ] 新規ファイル 200 行以下（超える場合は理由を本 PR に記載）
- [ ] `select("*")` を使っていない
- [ ] `for await` で外部 I/O を直列化していない（`Promise.allSettled` を使用）

## スクリーンショット / 補足

<!-- UI 変更がある場合のみ。 -->
