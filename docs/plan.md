# Implementation Plan — 学童保育Webアプリ（がくどう）

Total tasks: 28
Estimated time (autonomous): ~2 hours

## Dependency graph

```
Task 1 (project init) -> Task 2, Task 3
Task 2 (supabase init) -> Task 4
Task 3 (env + supabase clients) -> Task 4
Task 4 (DB schema + RLS) -> Task 5, Task 8, Task 16, Task 20, Task 24
Task 5 (auth middleware) -> Task 6
Task 6 (login page) -> Task 7
Task 7 (password reset) -> Task 8
Task 8 (teacher layout + dashboard) -> Task 9, Task 12, Task 14, Task 16, Task 20, Task 24
Task 9 (student CRUD - server) -> Task 10
Task 10 (student CRUD - UI) -> Task 11
Task 11 (QR card generation) -> Task 12
Task 12 (attendance scan API) -> Task 13
Task 13 (attendance scan UI) -> Task 14
Task 14 (attendance history - teacher) -> Task 15
Task 15 (attendance history - parent) -> (none)
Task 16 (parent account creation) -> Task 15, Task 19, Task 23
Task 17 (parent layout + dashboard) -> Task 15, Task 19, Task 23
Task 6 -> Task 17
Task 18 (public HP - static pages) -> (none)
Task 19 (announcements - teacher) -> Task 20 is wrong, let me redo
```

Let me redo the dependency graph cleanly:

```
Task 1 -> Task 2, Task 3
Task 2 -> Task 4
Task 3 -> Task 4
Task 4 -> Task 5, Task 9, Task 12, Task 16, Task 20, Task 24, Task 26
Task 5 -> Task 6
Task 6 -> Task 7, Task 8, Task 17
Task 7 -> (none)
Task 8 -> Task 9, Task 12, Task 16, Task 20, Task 24
Task 9 -> Task 10
Task 10 -> Task 11
Task 11 -> Task 13
Task 12 -> Task 13
Task 13 -> Task 14
Task 14 -> Task 15
Task 16 -> Task 17
Task 17 -> Task 15, Task 19, Task 23
Task 18 -> (none)
Task 20 -> Task 21
Task 21 -> Task 19
Task 24 -> Task 25
Task 25 -> Task 23
Task 26 -> Task 27
Task 27 -> Task 28
```

---

## M1 — プロジェクト基盤 + 認証

### Task 1: Next.js プロジェクト初期化

**Files**
- `package.json` (create)
- `tsconfig.json` (create)
- `next.config.ts` (create)
- `src/app/layout.tsx` (create)
- `src/app/page.tsx` (create)
- `.gitignore` (create)
- `.env.example` (create)

**Behavior**
Next.js 15 (App Router) + TypeScript のプロジェクトが `npm run dev` で起動し、ルートページが表示される。Tailwind CSS が設定済み。`.env.example` に `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` のプレースホルダーがある。

**Depends on**
- (none)

**Verify**
- `npm run build`
- `npm run typecheck` (or `npx tsc --noEmit`)

---

### Task 2: Supabase プロジェクト初期化

**Files**
- `supabase/config.toml` (create)
- `supabase/seed.sql` (create)

**Behavior**
`supabase init` でローカル Supabase 設定を初期化。`supabase/seed.sql` に初期管理者（先生）アカウント作成のテンプレートSQLがコメント付きで記述されている。

**Depends on**
- Task 1

**Verify**
- `supabase start` が正常に起動する（Docker 必要）
- `supabase status` でローカルURLが表示される

---

### Task 3: Supabase クライアント設定

**Files**
- `src/lib/supabase/client.ts` (create) — ブラウザ用クライアント
- `src/lib/supabase/server.ts` (create) — Server Component / Server Action 用クライアント
- `src/lib/supabase/admin.ts` (create) — Service Role キー使用（保護者アカウント作成用）
- `src/lib/supabase/types.ts` (create) — DB型定義のプレースホルダー

**Behavior**
3種類のSupabaseクライアントが作成される。`@supabase/ssr` を使用し、Server Componentではcookieベースのセッション管理が動作する。型定義ファイルはSupabase CLIで生成可能な構造のプレースホルダー。

**Depends on**
- Task 1

**Verify**
- `npx tsc --noEmit`

---

### Task 4: DBスキーマ + RLSポリシー

**Files**
- `supabase/migrations/00001_create_tables.sql` (create)
- `supabase/migrations/00002_create_rls_policies.sql` (create)

**Behavior**
profiles, students, parent_students, attendance_records, announcements, photos, public_notices テーブルが作成される。RLSポリシーにより: (1) teacher はすべてのテーブルに対してCRUD可能、(2) parent は自分のprofileのみ読み取り可能、(3) parent は parent_students で紐付いた生徒の attendance_records のみ読み取り可能、(4) parent は announcements を読み取りのみ可能、(5) parent は photos を読み取りのみ可能、(6) public_notices は全員が読み取り可能。profiles テーブルに auth.users の insert トリガーは設定しない（管理者がアカウント作成時にprofileも作成する）。

**Depends on**
- Task 2, Task 3

**Verify**
- `supabase db reset` が正常に完了する
- `supabase db lint` でエラーがない

---

### Task 5: 認証ミドルウェア

**Files**
- `src/middleware.ts` (create)

**Behavior**
Next.js Middleware が以下のルーティング保護を行う: (1) `/(protected)/teacher/*` はteacherロールのみアクセス可能、(2) `/(protected)/parent/*` はparentロールのみアクセス可能、(3) 未認証ユーザーが保護ページにアクセスすると `/login` にリダイレクト、(4) `/(public)/*` と `/(auth)/*` は全員アクセス可能。

**Depends on**
- Task 4

**Verify**
- `npx tsc --noEmit`

---

### Task 6: ログインページ

**Files**
- `src/app/(auth)/login/page.tsx` (create)
- `src/app/(auth)/login/actions.ts` (create)
- `src/app/(auth)/layout.tsx` (create)

**Behavior**
メールアドレスとパスワードの入力フォームを表示。正しい認証情報でログインするとロールに応じたダッシュボード（`/teacher` or `/parent`）にリダイレクト。誤ったパスワードではエラーメッセージを表示。Server Action で `supabase.auth.signInWithPassword` を呼び出す。

**Depends on**
- Task 5

**Verify**
- `npm run build`
- `npx tsc --noEmit`

---

### Task 7: パスワードリセット

**Files**
- `src/app/(auth)/forgot-password/page.tsx` (create)
- `src/app/(auth)/forgot-password/actions.ts` (create)
- `src/app/(auth)/reset-password/page.tsx` (create)
- `src/app/(auth)/reset-password/actions.ts` (create)

**Behavior**
「パスワードを忘れた」ページでメールアドレスを入力すると、Supabase Auth 経由でリセットメールが送信される。メール内のリンクからリセットページに遷移し、新しいパスワードを設定できる。設定後はログインページにリダイレクト。

**Depends on**
- Task 6

**Verify**
- `npm run build`
- `npx tsc --noEmit`

---

### Task 8: 先生用レイアウト + ダッシュボード

**Files**
- `src/app/(protected)/teacher/layout.tsx` (create)
- `src/app/(protected)/teacher/page.tsx` (create)
- `src/components/teacher-nav.tsx` (create)

**Behavior**
先生用ダッシュボードが表示される。サイドバーまたはヘッダーナビにメニュー項目: 生徒管理、入退場記録、入退場スキャン、連絡事項、写真、公開お知らせ。ログアウトボタンあり。レスポンシブ対応（スマホではハンバーガーメニュー）。

**Depends on**
- Task 6

**Verify**
- `npm run build`
- `npx tsc --noEmit`

---

## M2 — 生徒管理 + QRカード

### Task 9: 生徒 CRUD — Server Actions

**Files**
- `src/app/(protected)/teacher/students/actions.ts` (create)

**Behavior**
Server Actions: (1) `getStudents()` — 全生徒一覧を取得、(2) `createStudent({name, className})` — 生徒を登録（qr_token は UUIDv4 で自動生成）、(3) `updateStudent(id, {name?, className?})` — 生徒情報を更新。すべてteacherロールチェック付き。

**Depends on**
- Task 4, Task 8

**Verify**
- `npx tsc --noEmit`

---

### Task 10: 生徒管理 — UI

**Files**
- `src/app/(protected)/teacher/students/page.tsx` (create)
- `src/components/student-form.tsx` (create)
- `src/components/student-list.tsx` (create)

**Behavior**
生徒一覧ページが表示される。生徒の追加フォーム（名前・クラス名）から生徒を登録できる。一覧の各行に編集ボタンがあり、インラインまたはモーダルで編集可能。レスポンシブ対応。

**Depends on**
- Task 9

**Verify**
- `npm run build`
- `npx tsc --noEmit`

---

### Task 11: QRコードカード生成（PDF出力）

**Files**
- `src/components/qr-card-generator.tsx` (create)

**Behavior**
生徒一覧ページにQRカード生成ボタンを追加。(1) 個別生徒のQRコードを表示、(2) 選択した生徒（またはチェックボックスで複数選択）のカードをA4 PDF に面付けしてダウンロード。カードには生徒名とQRコード（qr_token をエンコード）を表示。クライアントサイドで qrcode + jsPDF を使用。

**Depends on**
- Task 10

**Verify**
- `npm run build`
- `npx tsc --noEmit`

---

## M2 — 保護者アカウント管理

### Task 16: 保護者アカウント作成

**Files**
- `src/app/(protected)/teacher/parents/page.tsx` (create)
- `src/app/(protected)/teacher/parents/actions.ts` (create)
- `src/components/parent-form.tsx` (create)

**Behavior**
先生が保護者アカウントを作成するページ。メールアドレス、初期パスワード、紐付ける生徒（複数選択可）を入力して作成。Server Action で Supabase Admin API (`supabase.auth.admin.createUser`) を使い、auth.users と profiles レコードを作成し、parent_students に紐付けを挿入。保護者一覧も表示。

**Depends on**
- Task 4, Task 8

**Verify**
- `npm run build`
- `npx tsc --noEmit`

---

### Task 17: 保護者用レイアウト + ダッシュボード

**Files**
- `src/app/(protected)/parent/layout.tsx` (create)
- `src/app/(protected)/parent/page.tsx` (create)
- `src/components/parent-nav.tsx` (create)

**Behavior**
保護者用ダッシュボードが表示される。ナビにメニュー項目: 入退場履歴、連絡事項、写真。ログアウトボタンあり。スマホファーストのレイアウト（ボトムナビゲーション）。ダッシュボードには今日の子どもの入退場状況と最新の連絡事項のサマリを表示。

**Depends on**
- Task 6, Task 16

**Verify**
- `npm run build`
- `npx tsc --noEmit`

---

## M3 — 入退場記録

### Task 12: 入退場スキャン — Server Action

**Files**
- `src/app/(protected)/teacher/attendance/actions.ts` (create)

**Behavior**
Server Action `scanAttendance({qrToken})`: (1) qr_token で生徒を検索、見つからなければエラー、(2) 当日の attendance_record を検索、(3) レコードなし → INSERT (check_in_at = now())、(4) check_out_at が null → UPDATE (check_out_at = now())、(5) 既に退場済み → エラー（「本日は退場済みです」）。レスポンスに生徒名とアクション（入場/退場）を含む。

**Depends on**
- Task 4, Task 8

**Verify**
- `npx tsc --noEmit`

---

### Task 13: 入退場スキャン — UI（QRリーダー）

**Files**
- `src/app/(protected)/teacher/attendance/scan/page.tsx` (create)
- `src/components/qr-scanner.tsx` (create)

**Behavior**
全画面表示のQRコードスキャン画面。html5-qrcode を使用してWebカメラからQRコードを読み取る。読み取り成功時に Server Action を呼び出し、結果（生徒名 + 入場/退場）を大きく画面に表示（3秒後にリセット）。エラー時は赤いエラーメッセージを表示。連続スキャンに対応（1つ読み取ったら即座に次を待機）。

**Depends on**
- Task 11, Task 12

**Verify**
- `npm run build`
- `npx tsc --noEmit`

---

### Task 14: 入退場履歴 — 先生用

**Files**
- `src/app/(protected)/teacher/attendance/page.tsx` (create)
- `src/app/(protected)/teacher/attendance/history-actions.ts` (create)
- `src/components/attendance-table.tsx` (create)

**Behavior**
先生が全生徒の入退場履歴を閲覧するページ。デフォルトで当日の記録を表示。日付ピッカーで日付を変更可能。テーブルに生徒名・入場時刻・退場時刻を表示。退場未記録は「在室中」と表示。

**Depends on**
- Task 13

**Verify**
- `npm run build`
- `npx tsc --noEmit`

---

### Task 15: 入退場履歴 — 保護者用

**Files**
- `src/app/(protected)/parent/attendance/page.tsx` (create)
- `src/app/(protected)/parent/attendance/actions.ts` (create)

**Behavior**
保護者が自分の子どもの入退場履歴を確認するページ。当日の入退場状況を表示。複数の子どもが紐付いている場合は全員分を表示。RLS により他の生徒のデータは見えない。スマホファーストのカードレイアウト。

**Depends on**
- Task 14, Task 16, Task 17

**Verify**
- `npm run build`
- `npx tsc --noEmit`

---

## M1 — 公開HP

### Task 18: 公開HP — 静的ページ

**Files**
- `src/app/(public)/page.tsx` (modify — ルートページを公開HPに)
- `src/app/(public)/layout.tsx` (create)
- `src/components/public-header.tsx` (create)
- `src/components/public-footer.tsx` (create)

**Behavior**
公開HPのトップページ。施設紹介セクション、説明会案内セクション、お知らせ一覧セクションを表示。お知らせは public_notices テーブルから ISR (revalidate: 3600) で取得。レスポンシブ対応。ヘッダーにログインリンク。

**Depends on**
- Task 4

**Verify**
- `npm run build`
- `npx tsc --noEmit`

---

### Task 26: 公開お知らせ管理 — Server Actions

**Files**
- `src/app/(protected)/teacher/notices/actions.ts` (create)

**Behavior**
Server Actions: (1) `getPublicNotices()` — お知らせ一覧を取得（published_at DESC）、(2) `createPublicNotice({title, body})` — お知らせを登録、(3) `updatePublicNotice(id, {title?, body?})` — お知らせを編集。teacherロールチェック付き。

**Depends on**
- Task 4

**Verify**
- `npx tsc --noEmit`

---

### Task 27: 公開お知らせ管理 — UI

**Files**
- `src/app/(protected)/teacher/notices/page.tsx` (create)
- `src/components/notice-form.tsx` (create)

**Behavior**
先生が公開お知らせを登録・編集するページ。タイトルと本文を入力して登録。一覧表示と編集機能。

**Depends on**
- Task 26

**Verify**
- `npm run build`
- `npx tsc --noEmit`

---

### Task 28: 公開HP — お知らせ表示統合

**Files**
- `src/app/(public)/page.tsx` (modify)

**Behavior**
公開HPのお知らせセクションが public_notices テーブルから動的にデータを取得して表示する。ISR (revalidate: 3600) で1時間ごとに再生成。お知らせがない場合は「現在お知らせはありません」と表示。

**Depends on**
- Task 27

**Verify**
- `npm run build`
- `npx tsc --noEmit`

---

## M4 — 連絡事項

### Task 20: 連絡事項 — Server Actions

**Files**
- `src/app/(protected)/teacher/announcements/actions.ts` (create)

**Behavior**
Server Actions: (1) `getAnnouncements()` — 連絡事項一覧を取得（created_at DESC）、(2) `createAnnouncement({title, body})` — 連絡事項を登録、(3) `updateAnnouncement(id, {title?, body?})` — 連絡事項を編集。teacherロールチェック付き。

**Depends on**
- Task 4, Task 8

**Verify**
- `npx tsc --noEmit`

---

### Task 21: 連絡事項管理 — 先生用 UI

**Files**
- `src/app/(protected)/teacher/announcements/page.tsx` (create)
- `src/components/announcement-form.tsx` (create)

**Behavior**
先生が連絡事項を登録・編集するページ。タイトルと本文を入力して登録。一覧は新しい順。各連絡事項に編集ボタン。

**Depends on**
- Task 20

**Verify**
- `npm run build`
- `npx tsc --noEmit`

---

### Task 19: 連絡事項閲覧 — 保護者用

**Files**
- `src/app/(protected)/parent/announcements/page.tsx` (create)
- `src/app/(protected)/parent/announcements/[id]/page.tsx` (create)

**Behavior**
保護者が連絡事項を閲覧するページ。一覧は新しい順にタイトルと日付を表示。タップすると詳細ページで本文全文を表示。スマホファーストのリストレイアウト。

**Depends on**
- Task 17, Task 21

**Verify**
- `npm run build`
- `npx tsc --noEmit`

---

## M5 — 写真共有

### Task 24: 写真アップロード — Server Actions + Storage

**Files**
- `src/app/(protected)/teacher/photos/actions.ts` (create)
- `src/lib/image-utils.ts` (create)

**Behavior**
Server Action `uploadPhotos(formData)`: (1) 画像ファイルを受け取る、(2) Supabase Storage の `photos` バケットにアップロード、(3) photos テーブルに storage_path と thumbnail_path を記録。`getPhotos()`: photos テーブルから一覧取得し、各写真の signed URL（有効期限1時間）を生成して返す。画像リサイズはクライアントサイドでアップロード前に実行（長辺1920px以下）。

**Depends on**
- Task 4, Task 8

**Verify**
- `npx tsc --noEmit`

---

### Task 25: 写真管理 — 先生用 UI

**Files**
- `src/app/(protected)/teacher/photos/page.tsx` (create)
- `src/components/photo-uploader.tsx` (create)
- `src/components/photo-grid.tsx` (create)

**Behavior**
先生が写真をアップロードするページ。複数ファイル選択対応。アップロード済み写真をサムネイルグリッドで表示。アップロード中はプログレス表示。

**Depends on**
- Task 24

**Verify**
- `npm run build`
- `npx tsc --noEmit`

---

### Task 23: 写真閲覧 — 保護者用

**Files**
- `src/app/(protected)/parent/photos/page.tsx` (create)
- `src/components/photo-viewer.tsx` (create)

**Behavior**
保護者が写真を閲覧するページ。サムネイルグリッド表示。タップするとモーダルまたは新ページでフルサイズ表示。signed URL で配信。未ログインで直接URLアクセスするとログインにリダイレクト。スマホファーストのグリッドレイアウト。

**Depends on**
- Task 17, Task 25

**Verify**
- `npm run build`
- `npx tsc --noEmit`

---

## 横断 — シードデータ + Storage バケット

### Task 22: Supabase Storage バケット + シード完成

**Files**
- `supabase/migrations/00003_create_storage_bucket.sql` (create)
- `supabase/seed.sql` (modify)

**Behavior**
`photos` バケットを作成（private、認証済みユーザーのみアクセス）。Storage RLS ポリシー: teacher は upload/delete 可能、認証済みユーザーは read 可能。seed.sql に初期管理者アカウント作成の完全なSQLを記述（auth.users + profiles に INSERT）。

**Depends on**
- Task 4

**Verify**
- `supabase db reset` が正常に完了する

---

## Task summary

| # | Title | Milestone | Depends on |
|---|-------|-----------|------------|
| 1 | Next.js プロジェクト初期化 | M1 | - |
| 2 | Supabase プロジェクト初期化 | M1 | 1 |
| 3 | Supabase クライアント設定 | M1 | 1 |
| 4 | DBスキーマ + RLSポリシー | M1 | 2, 3 |
| 5 | 認証ミドルウェア | M1 | 4 |
| 6 | ログインページ | M1 | 5 |
| 7 | パスワードリセット | M1 | 6 |
| 8 | 先生用レイアウト + ダッシュボード | M1 | 6 |
| 9 | 生徒 CRUD — Server Actions | M2 | 4, 8 |
| 10 | 生徒管理 — UI | M2 | 9 |
| 11 | QRコードカード生成（PDF出力） | M2 | 10 |
| 12 | 入退場スキャン — Server Action | M3 | 4, 8 |
| 13 | 入退場スキャン — UI（QRリーダー） | M3 | 11, 12 |
| 14 | 入退場履歴 — 先生用 | M3 | 13 |
| 15 | 入退場履歴 — 保護者用 | M3 | 14, 16, 17 |
| 16 | 保護者アカウント作成 | M2 | 4, 8 |
| 17 | 保護者用レイアウト + ダッシュボード | M2 | 6, 16 |
| 18 | 公開HP — 静的ページ | M1 | 4 |
| 19 | 連絡事項閲覧 — 保護者用 | M4 | 17, 21 |
| 20 | 連絡事項 — Server Actions | M4 | 4, 8 |
| 21 | 連絡事項管理 — 先生用 UI | M4 | 20 |
| 22 | Supabase Storage バケット + シード完成 | M5 | 4 |
| 23 | 写真閲覧 — 保護者用 | M5 | 17, 25 |
| 24 | 写真アップロード — Server Actions + Storage | M5 | 4, 8 |
| 25 | 写真管理 — 先生用 UI | M5 | 24 |
| 26 | 公開お知らせ管理 — Server Actions | M1 | 4 |
| 27 | 公開お知らせ管理 — UI | M1 | 26 |
| 28 | 公開HP — お知らせ表示統合 | M1 | 27 |
