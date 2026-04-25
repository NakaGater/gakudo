# Production Launch Checklist

実証段階から本番運用への移行時に **忘れたら困るもの** の網羅リスト。
各セクションは独立して着手可能。本番ドメインが確定した時点で上から順に。

> 生成元: 2026-04-25 のリファクタリング Phase 0–2 完了時点
> 関連: `/root/.claude/plans/smooth-popping-kurzweil.md`、本リポジトリの ADR

---

## 0. 事前準備（本番ドメイン確定の "前" に決めておくこと）

- [ ] **本番ドメイン名** を決定（例: `gakudo.example.jp`）
- [ ] **HTTPS 証明書** の発行経路（Vercel 自動 / Cloudflare / Let's Encrypt 等）を確認
- [ ] **本番 Supabase プロジェクト** を新規作成するか、実証用を昇格させるか決める
  - 新規作成推奨: 実証データを引きずらない
  - 昇格する場合: 開発者の権限・ローテーションを確認
- [ ] **メール送信元ドメイン** を Resend で SPF / DKIM / DMARC 設定
- [ ] **データ移行ポリシー**（実証データを引き継ぐ／全消去して再 seed）を関係者と合意

---

## 1. 環境変数（本番デプロイ先で設定）

`.env.example` に列挙した値を本番側にも入れる。**特に NEXT_PUBLIC 系はビルド時に焼き込まれる** ため、ビルド前に設定済みであること。

- [ ] `NEXT_PUBLIC_SUPABASE_URL` → 本番プロジェクト URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` → 本番 anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` → 本番 service role key（**git に入れない**）
- [ ] `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` → 本番ペアを生成 (`npx web-push generate-vapid-keys`)
- [ ] `RESEND_API_KEY` → 本番 API キー（送信元ドメイン認証済みのもの）
- [ ] `NEXT_PUBLIC_APP_URL` → **本番ドメイン**（`https://...`）。`forgotPassword` の redirectTo / `inviteUser` の redirectTo に使われる
- [ ] `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_ENV` → 本番 DSN（後述）

検証:
- [ ] `npm run build` がローカルで通る（env 不足は `requireEnv` がはじく）
- [ ] デプロイ先で `node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"` 相当の確認

---

## 2. Supabase 本番プロジェクト

### 2-A. Auth 設定

- [ ] **Authentication → URL Configuration** の **Site URL** に本番ドメインを設定
- [ ] **Authentication → URL Configuration** の **Redirect URLs** に追加:
  - `https://<本番ドメイン>/auth/callback`
  - `https://<本番ドメイン>/auth/callback?type=invite`
- [ ] 移行期間中は **旧ドメインも一時的に Redirect URLs に残す**（既送メールの failover）
- [ ] **Email Templates**（招待メール、パスワードリセット）の文面とリンクを本番用に更新
- [ ] **Email Provider** を Resend に切り替え（SMTP 設定）

### 2-B. マイグレーション適用

migrations/ の 12 ファイルすべてを本番 DB に適用:
```sh
supabase link --project-ref <production-id>
supabase db push
```

- [ ] マイグレーション順序が壊れていないことを `supabase migration list` で確認
- [ ] **複合インデックス** (`00011_perf_indexes.sql`) を本番テーブルに先に **CONCURRENTLY 版で手動適用**（テーブルが大きい場合のロック回避）:
  ```sql
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_child_parents_parent
    ON child_parents (parent_id);
  -- … 同様に他 4 つ
  ```
  そのあと `supabase db push` を流すと `IF NOT EXISTS` で no-op になる
- [ ] `rate_limit_log` テーブルに **古い行を削除する pg_cron** を設定（任意）:
  ```sql
  SELECT cron.schedule('rate_limit_cleanup', '0 3 * * *',
    'SELECT public.rate_limit_log_cleanup();');
  ```
  pg_cron 不要なら `lib/ratelimit/check.ts` の確率 1% クリーンアップに依存

### 2-C. RLS ポリシーの確認

- [ ] 全テーブルで **RLS ENABLE** されている（`supabase` SQL Editor で `pg_tables` を確認）
- [ ] サービス role 専用テーブル（`rate_limit_log`）に **policy が無い**ことを確認
- [ ] テスト用の `seed.sql` / `seed-auth.sh` を **本番では走らせない**

### 2-D. 型生成

- [ ] `npm run db:types` を本番 project ID で 1 回実行し、最新の型に同期
  ```sh
  SUPABASE_PROJECT_ID=<production-id> npm run db:types
  ```
  生成された差分を commit
- [ ] `lib/ratelimit/check.ts` の手書き型キャストが `Database` 型で吸収できることを確認（吸収できれば `as unknown as` を削除）

### 2-E. Storage バケット

- [ ] `documents` / `photos` バケットを本番 project に作成
- [ ] バケットの Public/Private 設定が実証環境と一致
- [ ] サイズ上限・MIME ホワイトリストを Supabase Dashboard で再確認

---

## 3. セキュリティヘッダ（next.config.ts）

ドメイン変更前提なので **段階的に強化** するのが安全。

### 3-A. CSP を Report-Only → Enforcing

- [ ] `Content-Security-Policy-Report-Only` を `Content-Security-Policy` に変更:
  ```diff
  - { key: "Content-Security-Policy-Report-Only", value: cspDirectives },
  + { key: "Content-Security-Policy",             value: cspDirectives },
  ```
- [ ] Sentry DSN を入れる場合、`connect-src` に Sentry の hostname を追加
- [ ] dev 環境でローカル巡回し、ChromeDevTools Console で違反 0 を確認
- [ ] 任意: `report-uri` または `report-to` でレポート集約エンドポイントを設定（`/api/csp-report` 自前実装）

### 3-B. HSTS の段階的設定

| フェーズ | 値 | 期間目安 |
|---|---|---|
| 移行直後 | `max-age=2592000; includeSubDomains` (30 日) | 1 ヶ月 |
| 安定後 | `max-age=31536000; includeSubDomains` (1 年) | 半年 |
| 確定 | `max-age=63072000; includeSubDomains; preload` (2 年, 提出予定) | — |

- [ ] **`preload` 属性は提出する直前まで付けない**（撤回に数ヶ月）
- [ ] `hstspreload.org` への提出は **本番ドメインを今後 2 年以上変更しない確信** を持ってから

### 3-C. その他

- [ ] `X-Frame-Options: DENY` で **iframe 埋め込みが必要な機能が無いか** 最終確認（OAuth 連携先など）
- [ ] `Permissions-Policy` の `camera=(self)` で QR スキャナが動くこと
- [ ] `Referrer-Policy: strict-origin-when-cross-origin` で外部からの遷移時の参照元が許容範囲か

---

## 4. Sentry（任意・推奨）

- [ ] Sentry プロジェクトを作成
- [ ] **DSN を環境変数に設定**:
  - Server: `SENTRY_DSN`
  - Client: `NEXT_PUBLIC_SENTRY_DSN`
  - 環境名: `NEXT_PUBLIC_SENTRY_ENV=production`
- [ ] Sentry の **Allowed Domains** に本番ドメインを追加（移行期は旧ドメインも一時許可）
- [ ] CSP の `connect-src` に Sentry エンドポイントを追加（前項 3-A）
- [ ] `sanitizeError` 経由のサーバーエラーが Sentry に届くことを **意図的なエラー**で確認
  - 例: 一時的に admin/users/actions.ts の inviteUser でわざと throw して Sentry の Issues に出るかテスト
- [ ] アラート設定（重大度別に Slack / メール通知）

---

## 5. PWA / Web Push

- [ ] 新ドメインで **VAPID キーペア** を生成（旧キーを流用しても可、但し再購読は必要）
  ```sh
  npx web-push generate-vapid-keys
  ```
- [ ] **既存 push subscription は origin に紐づくため、ドメイン変更で全保護者が失効** することを保護者に周知
  - 移行後の最初のログイン時に **再購読を促すバナー**（既存 `components/push/push-prompt.tsx`）が出るので OK
- [ ] Service Worker (`sw-register.tsx`) が新ドメインで正しく登録されることを確認
- [ ] PWA マニフェスト (`app/manifest.ts`) の URL / icon パスを確認

---

## 6. メール送信（Resend）

- [ ] 送信元ドメイン (`From:`) を本番ドメインに変更
  - 該当箇所: `lib/email/send.ts` の `from` フィールド、`access/actions.ts` の確認メール
- [ ] **SPF / DKIM / DMARC** レコードを DNS に設定
- [ ] テストメールを実機で受信確認（Gmail / Outlook / iCloud で迷惑メール判定されないか）
- [ ] パスワードリセット / 招待メールの **本文中リンクが本番ドメイン** になっていること（`NEXT_PUBLIC_APP_URL` 経由）

---

## 7. データ移行 / 旧環境クリーンアップ

- [ ] 実証段階のテストデータをどう扱うか決める:
  - 全消去 → 本番 seed のみ
  - 一部移行 → どのテーブルを？ どのユーザーを？
- [ ] **本番投入前**に旧環境をバックアップ（`supabase db dump`）
- [ ] 旧環境のテストユーザーが本番にコピーされていない（漏えい）ことを確認
- [ ] **既送のパスワードリセット / 招待メール** に含まれる旧ドメイン URL は失効する旨を周知

---

## 8. 監視 / 可観測性

- [ ] Sentry セットアップ済（前項 4）
- [ ] **Supabase Logs** で重大度 ERROR の通知設定（Slack 等）
- [ ] **slow query アラート**（>500ms）を有効化（Supabase Dashboard）
- [ ] Vercel Analytics / Cloudflare Web Analytics（任意）
- [ ] `/api/health` 相当のエンドポイントが **無い** ので、必要なら追加（uptime 監視サービス連携用）

---

## 9. CI / リリース手順

- [ ] GitHub の Branch Protection で `main` への push を保護
  - Required checks: typecheck / lint / test / format / build
- [ ] CODEOWNERS の reviewer に **本番運用責任者** が含まれている
- [ ] `npm audit --audit-level=moderate` がデプロイ直前に green
- [ ] 本番デプロイ手順を docs/operations.md（未作成）にまとめる
- [ ] ロールバック手順（前のリリースに戻す方法）を文書化

---

## 10. ユーザー / 関係者周知

- [ ] **新ドメイン URL** を保護者・スタッフに事前告知
- [ ] **再ログインが必要** であることを周知（Cookie が引き継がれない）
- [ ] **push 通知の再購読が必要** であることを周知
- [ ] パスワードリセット / 招待メールの未消費分は再送が必要な可能性
- [ ] お問い合わせ窓口（`access` フォーム）が新ドメインで動くことを最終確認

---

## 11. リフレクト・延期した技術タスクの再開（移行後）

リファクタリング戦略の Phase 3〜4 で予定していたが、実証段階では着手しなかったもの:

- [ ] **withAuth 残り 17 actions の callsite 移行**（プラン Phase 2-C ドメイン別 4 PR）
- [ ] **withApiAuth 残り 3 routes の callsite 移行**（プラン Phase 2-E）
- [ ] **lib/validation/form.ts の callsite 移行 14 箇所**（プラン Phase 2-D）
- [ ] **Phase 3** 大型ファイル分割 / `useArrayEditor` カスタムフック / `as unknown as` 撲滅 / pagination
- [ ] **Phase 4** Supabase mock factory 統一 / E2E ロール境界テスト / `tsconfig.strict++`

これらは本番運用開始後でも、機能追加と並行して着手可能。

---

## 12. 24 時間 / 1 週間 / 1 ヶ月の事後チェック

### 24 時間後

- [ ] Sentry の Issues 数（想定外のエラーが出ていないか）
- [ ] CSP 違反レポート 0 件か（Report-Only で出していた場合）
- [ ] rate limit が legitimate ユーザーを誤って弾いていないか（`rate_limit_log` を SQL で覗く）
- [ ] push 通知の購読数

### 1 週間後

- [ ] 月次バッチが回ったか（請求確定など、レアフローでの違反がないか）
- [ ] HSTS max-age を中期値 (1 年) に上げる検討
- [ ] CSP の `'unsafe-inline'` / `'unsafe-eval'` を絞れるか検討（nonce/hash 化）

### 1 ヶ月後

- [ ] HSTS preload 提出を検討（ドメイン安定が確実なら）
- [ ] 残課題を Phase 3〜4 として fork し、次のリファクタを開始

---

## 付録: 重要ファイルのクイックリンク

- 環境変数バリデーション: `src/lib/env.ts`
- セキュリティヘッダ: `next.config.ts`
- Sentry init: `sentry.{server,client,edge}.config.ts`
- Supabase クライアント: `src/lib/supabase/{server,client,admin}.ts`
- 認証ヘルパー: `src/lib/auth/get-user.ts` / `src/lib/auth/roles.ts`
- 認可ラッパー: `src/lib/actions/middleware.ts` (withAuth) / `src/lib/api/auth.ts` (withApiAuth)
- エラーサニタイズ: `src/lib/errors/sanitize.ts`
- レート制限: `src/lib/ratelimit/check.ts`
- マイグレーション: `supabase/migrations/`
