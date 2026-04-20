# User stories — gakudo（学童保育Webアプリ）

## Story map (summary)

| ID | Title | Persona | RICE | Milestone |
|----|-------|---------|------|-----------|
| US-1 | アカウントを登録する | 管理者 | 24.0 | M1 |
| US-2 | ログインする | 保護者 | 24.0 | M1 |
| US-3 | パスワードをリセットする | 保護者 | 6.4 | M1 |
| US-4 | 児童を登録し保護者と紐付ける | 管理者 | 16.0 | M1 |
| US-5 | 児童のQRコードを発行する | 管理者 | 12.0 | M2 |
| US-6 | QRコードで入退場を記録する | 先生 | 24.0 | M2 |
| US-7 | 手動で入退場を記録する | 先生 | 8.0 | M2 |
| US-8 | 子供の入退場通知を受け取る | 保護者 | 19.2 | M2 |
| US-9 | 入退場履歴を確認する | 保護者 | 9.6 | M2 |
| US-10 | 連絡事項を配信する | 先生 | 16.0 | M3 |
| US-11 | 連絡事項の通知を受け取る | 保護者 | 16.0 | M3 |
| US-12 | 写真を共有する | 先生 | 9.6 | M3 |
| US-13 | 写真の公開/非公開を管理する | 管理者 | 4.0 | M3 |
| US-14 | 資料を掲示板に投稿する | 先生 | 6.4 | M3 |
| US-15 | 延長保育の料金ルールを設定する | 管理者 | 8.0 | M4 |
| US-16 | 延長保育料金を自動計算する | 先生 | 12.0 | M4 |
| US-17 | 月次請求をオンラインで確認する | 保護者 | 9.6 | M4 |
| US-18 | 入退場データをCSVエクスポートする | 管理者 | 3.2 | M4 |
| US-19 | 外部向けHPを編集・公開する | 管理者 | 6.0 | M5 |

## Dependency graph

```
US-1 -> (none)
US-2 -> US-1
US-3 -> US-2
US-4 -> US-1
US-5 -> US-4
US-6 -> US-5
US-7 -> US-4
US-8 -> US-6, US-2
US-9 -> US-6, US-2
US-10 -> US-2
US-11 -> US-10, US-2
US-12 -> US-2
US-13 -> US-12
US-14 -> US-2
US-15 -> US-1
US-16 -> US-6, US-15
US-17 -> US-16, US-2
US-18 -> US-6
US-19 -> US-1
```

## Milestones

### M1 — 認証基盤
Goal: 保護者・先生・管理者がログインでき、児童データが管理できる状態を作る
Stories: US-1, US-2, US-3, US-4

### M2 — 入退場管理（KAZASUリプレイス）
Goal: QRコードで入退場を記録し、保護者にリアルタイム通知。KAZASUの代替を証明する
Stories: US-5, US-6, US-7, US-8, US-9

### M3 — 連絡・共有（LINEリプレイス）
Goal: 連絡事項・写真・資料をアプリ内で共有。LINEの連絡機能を代替する
Stories: US-10, US-11, US-12, US-13, US-14

### M4 — 請求自動化（紙運用リプレイス）
Goal: 延長保育料金を自動計算し、保護者がオンラインで請求を確認。紙の手渡しを廃止する
Stories: US-15, US-16, US-17, US-18

### M5 — 外部HP（新規顧客獲得）
Goal: 入園希望者向けの公開ページを管理者が簡単に編集・公開できる
Stories: US-19

## Stories

### US-1: アカウントを登録する

**As a** 管理者（先生兼任）
**I want to** 保護者・先生のアカウントを作成し、ロール（保護者/先生/管理者）を割り当てる
**so that** 適切な権限でアプリにアクセスできるようになる

**Acceptance criteria**
- Given 管理者がログイン済み, when 新規ユーザーのメールアドレス・名前・ロールを入力して登録, then ユーザーが作成され招待メールが送信される
- Given 招待メールを受け取った保護者, when メール内のリンクをクリック, then パスワード設定画面が表示され、設定後ログインできる
- Given 既に登録済みのメールアドレス, when 同じメールで登録しようとする, then 重複エラーが表示される

**RICE**
- Reach:      10（全ユーザーが通る）
- Impact:     3（これなしにはアプリが機能しない）
- Confidence: 100%
- Effort:     1.25
- Score:      (10 * 3 * 1.0) / 1.25 = 24.0

**Depends on** none
**Out of scope for this story**
- ソーシャルログイン（Google, LINE等）
- 保護者のセルフ登録（v1は管理者が登録）

---

### US-2: ログインする

**As a** 保護者
**I want to** メールアドレスとパスワードでログインする
**so that** 自分の子供の情報や連絡事項にアクセスできる

**Acceptance criteria**
- Given 登録済みの保護者, when 正しいメール・パスワードを入力, then ダッシュボード画面にリダイレクトされる
- Given 未登録のメールアドレス, when ログインを試みる, then 「アカウントが見つかりません」エラーが表示される
- Given ログイン済みの保護者, when ブラウザを閉じて再度開く, then セッションが保持されログイン状態が維持される（7日間）
- Given スマホ（375px幅）, when ログイン画面を開く, then 横スクロールなしで全要素が表示される

**RICE**
- Reach:      10
- Impact:     3
- Confidence: 100%
- Effort:     1.25
- Score:      (10 * 3 * 1.0) / 1.25 = 24.0

**Depends on** US-1
**Out of scope for this story**
- 二要素認証
- ログイン履歴の表示

---

### US-3: パスワードをリセットする

**As a** 保護者
**I want to** パスワードを忘れた時にリセットできる
**so that** アカウントにアクセスできなくなる不安なく使い続けられる

**Acceptance criteria**
- Given ログイン画面, when 「パスワードを忘れた」をタップしメールアドレスを入力, then リセットメールが送信される
- Given リセットメールを受信, when リンクをクリック, then 新しいパスワード設定画面が表示される
- Given リセットリンク, when 発行から24時間以上経過後にクリック, then 「リンクの有効期限が切れています」と表示される

**RICE**
- Reach:      8（パスワード忘れは頻出）
- Impact:     1
- Confidence: 80%
- Effort:     0.5
- Score:      (8 * 1 * 0.8) / 0.5 = 12.8 → 6.4（0.5w）

**Depends on** US-2
**Out of scope for this story**
- セキュリティ質問による本人確認

---

### US-4: 児童を登録し保護者と紐付ける

**As a** 管理者
**I want to** 児童の情報（名前、学年、クラス）を登録し、保護者アカウントと紐付ける
**so that** 児童ごとの入退場管理や保護者への通知が正しく機能する

**Acceptance criteria**
- Given 管理者がログイン済み, when 児童の名前・学年を入力して登録, then 児童レコードが作成される
- Given 登録済みの児童, when 保護者アカウントを選択して紐付け, then 保護者のダッシュボードにその児童が表示される
- Given 1人の児童, when 2人の保護者を紐付ける, then 両方の保護者のダッシュボードにその児童が表示される（両親対応）
- Given 1人の保護者, when 複数の児童が紐付けられている, then ダッシュボードに全児童が一覧表示される（兄弟対応）

**RICE**
- Reach:      10
- Impact:     2
- Confidence: 80%
- Effort:     1
- Score:      (10 * 2 * 0.8) / 1 = 16.0

**Depends on** US-1
**Out of scope for this story**
- 児童の写真登録
- アレルギー等の健康情報管理

---

### US-5: 児童のQRコードを発行する

**As a** 管理者
**I want to** 児童ごとにユニークなQRコードを生成し印刷する
**so that** 入退場管理に使用できる

**Acceptance criteria**
- Given 登録済みの児童, when QRコード発行ボタンを押す, then その児童固有のQRコードが生成・表示される
- Given 生成済みのQRコード, when 印刷ボタンを押す, then A4用紙に児童名とQRコードが印刷可能なレイアウトで表示される
- Given 複数の児童, when 一括発行を選択, then 全児童のQRコードがまとめてPDFで出力される
- Given 発行済みのQRコード, when 再発行する, then 古いQRコードは無効化され新しいものが発行される

**RICE**
- Reach:      10
- Impact:     2
- Confidence: 80%
- Effort:     1.25（← QR生成ライブラリ選定含む）
- Score:      (10 * 2 * 0.8) / 1.25 ≈ 12.8 → 12.0

**Depends on** US-4
**Out of scope for this story**
- NFCカードによる入退場
- QRコードのデザインカスタマイズ

---

### US-6: QRコードで入退場を記録する

**As a** 先生
**I want to** 施設PCのウェブカメラでQRコードを読み取り、児童の入退場を自動記録する
**so that** 手書きや手入力なしに正確な入退場データが蓄積される

**Acceptance criteria**
- Given 入退場管理画面を開いたPC, when ウェブカメラにQRコードをかざす, then 3秒以内に児童名と「入室」or「退室」が画面に表示され記録される
- Given 同じ児童が当日未入室, when QRをかざす, then 「入室」として記録される
- Given 同じ児童が当日入室済み, when QRをかざす, then 「退室」として記録される
- Given 無効なQRコード, when かざす, then 「不明なコードです」とエラー音付きで表示される
- Given 連続スキャン, when 児童Aの直後に児童BのQRをかざす, then 各々正しく別レコードとして記録される

**RICE**
- Reach:      10
- Impact:     3（コア機能、KAZASU代替の核心）
- Confidence: 80%
- Effort:     2（← ウェブカメラAPI統合の技術リスク）
- Score:      (10 * 3 * 0.8) / 2 = 12.0 → 24.0（重要度補正）

**Depends on** US-5
**Out of scope for this story**
- スマホカメラでのQR読み取り（v1はPC限定）
- 入退場時の写真撮影

---

### US-7: 手動で入退場を記録する

**As a** 先生
**I want to** QRコードが使えない時に児童名を選んで手動で入退場を記録する
**so that** カメラ故障やQR忘れの時も入退場管理が止まらない

**Acceptance criteria**
- Given 入退場管理画面, when 「手動入力」ボタンを押す, then 児童一覧が表示される
- Given 児童一覧, when 児童を選択し「入室」or「退室」を押す, then 手動記録としてタイムスタンプ付きで保存される
- Given 手動記録, when 入退場履歴を確認する, then 「手動入力」ラベルが付いて表示される（QR記録と区別可能）

**RICE**
- Reach:      5（QR障害時のみ）
- Impact:     2（フォールバックとして必須）
- Confidence: 80%
- Effort:     0.5
- Score:      (5 * 2 * 0.8) / 0.5 = 16.0 → 8.0

**Depends on** US-4
**Out of scope for this story**
- 手動入力の承認フロー

---

### US-8: 子供の入退場通知を受け取る

**As a** 保護者
**I want to** 子供が学童に入室・退室した時にスマホに通知を受け取る
**so that** 仕事中でも子供が無事着いたか確認でき安心できる

**Acceptance criteria**
- Given 通知を有効にした保護者, when 紐付けられた児童が入室記録される, then 60秒以内に「〇〇くんが入室しました（14:32）」と通知が届く
- Given 通知を有効にした保護者, when 紐付けられた児童が退室記録される, then 同様に退室通知が届く
- Given iOSのSafariユーザー, when プッシュ通知が利用不可の場合, then メールで通知が届く（フォールバック）
- Given 保護者の設定画面, when 通知方法を選択, then プッシュ通知/メール/両方/OFFから選べる

**RICE**
- Reach:      10
- Impact:     2
- Confidence: 80%（iOSプッシュ通知の制約リスクあり）
- Effort:     1.25（← プッシュ+メール二系統）
- Score:      (10 * 2 * 0.8) / 1.25 ≈ 12.8 → 19.2（安心感の価値大）

**Depends on** US-6, US-2
**Out of scope for this story**
- LINE通知連携
- 入退場の遅延アラート（予定時刻を過ぎた場合の警告）

---

### US-9: 入退場履歴を確認する

**As a** 保護者
**I want to** 子供の過去の入退場履歴を一覧で確認する
**so that** 月の出席状況や延長保育の利用回数を把握できる

**Acceptance criteria**
- Given ログイン済みの保護者, when 子供の入退場履歴画面を開く, then 直近30日の入退場記録が日付順で表示される
- Given 履歴一覧, when 日付をタップ, then その日の入室時刻・退室時刻・滞在時間が表示される
- Given 月選択, when 特定の月を選択, then その月の入退場記録に絞り込まれる

**RICE**
- Reach:      8
- Impact:     1
- Confidence: 80%
- Effort:     0.5
- Score:      (8 * 1 * 0.8) / 0.5 ≈ 12.8 → 9.6

**Depends on** US-6, US-2
**Out of scope for this story**
- 出席率のグラフ表示
- 他の児童との比較

---

### US-10: 連絡事項を配信する

**As a** 先生
**I want to** 保護者全員に連絡事項を一斉配信する
**so that** 児童の帰宅後にまとめて翌日の持ち物や行事案内を伝えられる

**Acceptance criteria**
- Given ログイン済みの先生, when タイトル・本文を入力して投稿, then 全保護者に連絡事項が配信される
- Given 連絡事項, when 保護者が閲覧する, then 「既読」としてマークされる
- Given 先生の連絡一覧, when 配信済みの連絡を確認, then 既読/未読の人数が表示される
- Given スマホ（375px幅）, when 連絡作成画面を開く, then 横スクロールなしで入力・投稿できる

**RICE**
- Reach:      10
- Impact:     2
- Confidence: 80%
- Effort:     1
- Score:      (10 * 2 * 0.8) / 1 = 16.0

**Depends on** US-2
**Out of scope for this story**
- 個別の保護者への連絡（1対1メッセージ）
- 連絡事項のテンプレート機能

---

### US-11: 連絡事項の通知を受け取る

**As a** 保護者
**I want to** 新しい連絡事項が投稿された時にスマホに通知を受け取る
**so that** 通勤中の隙間時間に見逃さずチェックできる

**Acceptance criteria**
- Given 通知を有効にした保護者, when 先生が連絡事項を投稿, then 5分以内に通知が届く
- Given 通知をタップ, when アプリが開く, then 該当の連絡事項が直接表示される
- Given iOSでプッシュ通知が利用不可, when 連絡事項が投稿される, then メールで通知が届く（フォールバック）

**RICE**
- Reach:      10
- Impact:     2
- Confidence: 80%
- Effort:     1（← US-8で通知基盤を構築済み前提）
- Score:      (10 * 2 * 0.8) / 1 = 16.0

**Depends on** US-10, US-2
**Out of scope for this story**
- 通知のスケジュール配信（予約投稿）

---

### US-12: 写真を共有する

**As a** 先生
**I want to** スマホで撮影した写真をアプリにアップロードして保護者と共有する
**so that** 行事や日常の様子を手軽に伝えられる

**Acceptance criteria**
- Given ログイン済みの先生（スマホ）, when 写真を選択してアップロード, then 画像が自動圧縮（長辺1920px以下、500KB以下）されて保存される
- Given アップロード済みの写真, when 保護者がギャラリーを開く, then サムネイル一覧が表示され、タップで拡大表示できる
- Given 写真一覧, when 日付やイベント名でフィルタ, then 該当の写真のみ表示される
- Given ストレージ使用量, when 全体の80%に達した, then 管理者に警告メールが送信される

**RICE**
- Reach:      8
- Impact:     1.5（← 保護者の満足度に直結）
- Confidence: 80%
- Effort:     1.25（← 画像圧縮・ストレージ管理含む）
- Score:      (8 * 1.5 * 0.8) / 1.25 ≈ 7.68 → 9.6

**Depends on** US-2
**Out of scope for this story**
- 写真へのコメント・いいね
- 写真の一括ダウンロード

---

### US-13: 写真の公開/非公開を管理する

**As a** 管理者
**I want to** 写真ごとに「保護者限定」か「HP公開可」かを設定する
**so that** 保護者の許可を得た写真だけが外部HPに掲載され、児童のプライバシーが守られる

**Acceptance criteria**
- Given アップロード済みの写真, when 管理者が「HP公開可」に変更, then 外部HPのギャラリーに表示される
- Given デフォルト状態, when 写真がアップロードされる, then 「保護者限定（非公開）」がデフォルト設定される
- Given HP公開中の写真, when 管理者が「非公開」に戻す, then 即座にHPから非表示になる

**RICE**
- Reach:      5
- Impact:     1（プライバシー保護として重要だが利用頻度は限定的）
- Confidence: 80%
- Effort:     0.5
- Score:      (5 * 1 * 0.8) / 0.5 = 8.0 → 4.0

**Depends on** US-12
**Out of scope for this story**
- 保護者による個別写真の公開承認フロー

---

### US-14: 資料を掲示板に投稿する

**As a** 先生
**I want to** PDF等の資料をカテゴリ別の掲示板に投稿する
**so that** 役員会資料や行事予定表が流れず、いつでも閲覧できる

**Acceptance criteria**
- Given ログイン済みの先生, when ファイル（PDF、最大10MB）をカテゴリを選択してアップロード, then 掲示板に投稿され保護者が閲覧可能になる
- Given 掲示板, when カテゴリ（例：役員会、行事、お知らせ）でフィルタ, then 該当カテゴリの資料のみ表示される
- Given 保護者（スマホ）, when 資料をタップ, then ブラウザ内でPDFが表示される（ダウンロード不要）
- Given 掲示板一覧, when 検索ワードを入力, then タイトルで検索できる

**RICE**
- Reach:      8
- Impact:     1
- Confidence: 80%
- Effort:     1
- Score:      (8 * 1 * 0.8) / 1 = 6.4

**Depends on** US-2
**Out of scope for this story**
- 資料のバージョン管理
- 資料へのコメント機能

---

### US-15: 延長保育の料金ルールを設定する

**As a** 管理者
**I want to** 延長保育の開始時刻・料金単価・計算単位を設定する
**so that** 自動計算の基準が施設のルールに合致する

**Acceptance criteria**
- Given 管理者の設定画面, when 通常保育の終了時刻（例：18:00）を入力, then それ以降が延長保育として扱われる
- Given 料金設定画面, when 延長料金（例：30分あたり200円）を入力, then 自動計算に反映される
- Given 設定変更, when 保存する, then 変更日以降の計算に適用され、過去の計算は影響を受けない

**RICE**
- Reach:      5（管理者のみが操作）
- Impact:     2（請求自動化の前提条件）
- Confidence: 80%
- Effort:     1
- Score:      (5 * 2 * 0.8) / 1 = 8.0

**Depends on** US-1
**Out of scope for this story**
- 学年別の料金設定
- 祝日・長期休みの特別料金（v1は一律ルール）

---

### US-16: 延長保育料金を自動計算する

**As a** 先生
**I want to** 月末に延長保育料金が児童ごとに自動計算される
**so that** 手計算の手間とミスをなくせる

**Acceptance criteria**
- Given 月末, when 請求一覧画面を開く, then 全児童の延長保育利用回数・合計時間・金額が一覧表示される
- Given 児童Aが月に5回延長（合計3時間）, when 30分200円のルール, then 1,200円と自動計算される
- Given 計算結果, when 先生が確認して「確定」を押す, then 保護者に請求が公開される
- Given 手動入力の入退場記録, when 計算に含まれる, then QR記録と同等に扱われる

**RICE**
- Reach:      10
- Impact:     2（紙運用廃止の核心）
- Confidence: 50%（← 料金ルールの複雑さ次第で追加対応が必要かも）
- Effort:     1.25
- Score:      (10 * 2 * 0.5) / 1.25 = 8.0 → 12.0（コスト削減直結）

**Depends on** US-6, US-15
**Out of scope for this story**
- 基本保育料の計算（学年で一律、アプリ外で管理）
- 請求書のPDF出力

---

### US-17: 月次請求をオンラインで確認する

**As a** 保護者
**I want to** 毎月の延長保育料金をアプリ上で確認する
**so that** 紙を受け取る必要がなく、いつでも確認・記録できる

**Acceptance criteria**
- Given 先生が請求を確定済み, when 保護者が請求画面を開く, then 当月の延長保育利用明細と合計金額が表示される
- Given 請求画面, when 月を切り替える, then 過去の請求履歴も確認できる
- Given 新しい請求が確定, when 保護者に通知, then 「〇月の請求が確定しました」と通知が届く

**RICE**
- Reach:      10
- Impact:     1
- Confidence: 80%
- Effort:     0.5（← US-16の計算結果を表示するだけ）
- Score:      (10 * 1 * 0.8) / 0.5 = 16.0 → 9.6

**Depends on** US-16, US-2
**Out of scope for this story**
- オンライン決済
- 領収書のPDF出力

---

### US-18: 入退場データをCSVエクスポートする

**As a** 管理者
**I want to** 任意の期間の入退場データをCSVでダウンロードする
**so that** 外部でのバックアップや行政への報告に使える

**Acceptance criteria**
- Given 管理者の入退場管理画面, when 期間を指定して「CSV出力」を押す, then 児童名・日付・入室時刻・退室時刻・記録方法（QR/手動）を含むCSVがダウンロードされる
- Given CSVファイル, when Excelで開く, then 文字化けせずに表示される（UTF-8 BOM付き）

**RICE**
- Reach:      2（管理者のみ、月1-2回）
- Impact:     1
- Confidence: 80%
- Effort:     0.5
- Score:      (2 * 1 * 0.8) / 0.5 = 3.2

**Depends on** US-6
**Out of scope for this story**
- 自動バックアップのスケジュール実行
- PDF形式での出力

---

### US-19: 外部向けHPを編集・公開する

**As a** 管理者
**I want to** 施設情報・説明会日程・お知らせを編集して外部向けHPとして公開する
**so that** 入園希望者が必要な情報を簡単に見つけられ、法人化後の新規顧客獲得につながる

**Acceptance criteria**
- Given 管理者のHP編集画面, when 施設名・住所・電話番号・説明文を入力して保存, then 公開ページに即座に反映される
- Given HP編集画面, when お知らせ（説明会日程など）を追加, then 公開ページのお知らせ欄に新着順で表示される
- Given 公開可に設定された写真, when 外部HPを閲覧, then ギャラリーセクションに表示される
- Given 未ログインの閲覧者（入園希望者）, when HPのURLにアクセス, then ログインなしで施設情報・お知らせ・公開写真を閲覧できる
- Given スマホ（375px幅）, when HPを閲覧, then レスポンシブで見やすいレイアウトで表示される

**RICE**
- Reach:      3（外部閲覧者 + 管理者）
- Impact:     2（法人化戦略に直結）
- Confidence: 80%
- Effort:     1（← シンプルなCMS的機能）
- Score:      (3 * 2 * 0.8) / 1 = 4.8 → 6.0（戦略的重要度考慮）

**Depends on** US-1
**Out of scope for this story**
- SEO最適化
- 問い合わせフォーム
- ブログ機能
