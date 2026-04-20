# Search-first research — gakudo

## Summary
- 8 capabilities researched
- Adopt: 5, Extend: 1, Compose: 1, Build: 1

## Capabilities

### 1. Authentication（認証）
**Decision:** Adopt — Supabase Auth

**Queries used:**
- "Best React authentication library 2025 2026: Supabase Auth vs Clerk vs NextAuth comparison for small projects with free tier"

**Candidates considered:**
1. **Supabase Auth** — 50,000 MAU無料、オープンソース、React SDK充実、メール/パスワード＋OAuth対応、セルフホスト可能
2. **Clerk** — 5,000 MAU無料、UIコンポーネント充実、セットアップ最速。クローズドソース、ベンダーロックイン高
3. **NextAuth.js (Auth.js)** — 完全無料＆OSS、制限なし。ただし自前DB管理必要、UI最低限

**Evidence for decision:**
- Supabase AuthはDB・ストレージ・リアルタイムとの統合が一体で、別々のサービスを組み合わせる必要がない
- 50,000 MAU無料は学童30家庭＋先生数名に対して十分すぎる余裕
- Clerkは優秀だがベンダーロックインが高く、無料枠5,000MAUも十分だが拡張性でSupabaseが上
- NextAuth.jsは自由度最大だが、Supabaseを使う場合はAuth統合の方が開発効率が高い

**Extensions needed:** なし
**Risks:** Supabase無料プランは1週間非アクティブでプロジェクトがpauseする可能性あり

---

### 2. BaaS / Database（バックエンド・データベース）
**Decision:** Adopt — Supabase (PostgreSQL)

**Queries used:**
- "Supabase vs Firebase vs PocketBase 2025 comparison for small web apps: free tier, React integration, storage"

**Candidates considered:**
1. **Supabase** — PostgreSQL、500MB DB無料、RLS（行レベルセキュリティ）、React SDK、S3互換ストレージ
2. **Firebase** — Firestore 1GB無料、5GBファイルストレージ。NoSQL、リード/ライト課金制、ベンダーロックイン高
3. **PocketBase** — セルフホスト無料、SQLite。サーバー運用必要、マネージドなし

**Evidence for decision:**
- PostgreSQLはリレーショナルデータモデル（児童⇔保護者の紐付け、入退場記録⇔請求計算）に最適
- Auth・DB・Storageが一体で開発効率最大化
- RLSにより「保護者は自分の子供のデータのみ閲覧可能」を宣言的に実装可能
- Firebaseはリレーショナルモデルに弱く、従量課金の予測が難しい
- PocketBaseはマネージドサービスがなく、無料運用の制約と矛盾

**Extensions needed:** なし
**Risks:** 無料枠のDB 500MB、ファイルストレージ1GBの上限に注意

---

### 3. QRコード生成
**Decision:** Adopt — react-qr-code

**Queries used:**
- "Best JavaScript QR code generator library 2025: qrcode.js vs react-qr-code comparison"

**Candidates considered:**
1. **react-qr-code** — SVG出力、React JSXコンポーネント、13KB、依存なし、UTF-8対応
2. **qrcode.js** — Canvas/Table出力、4KB、バニラJS向け
3. **qr-code-styling** — ブランディング対応（ロゴ埋め込み等）、大きめ

**Evidence for decision:**
- Reactプロジェクトなので、JSXコンポーネントとして使えるreact-qr-codeが最適
- SVG出力は印刷品質が高く、QRコードのPDF出力にも適している
- qrcode.jsは優秀だがReact統合に追加作業が必要

**Extensions needed:** なし（PDF出力はブラウザのprint APIまたはjsPDFで対応）
**Risks:** なし

---

### 4. QRコード読取（ウェブカメラ）
**Decision:** Adopt — html5-qrcode

**Queries used:**
- "Best JavaScript QR code scanner library 2025 webcam browser: html5-qrcode vs zxing-js vs jsQR comparison"

**Candidates considered:**
1. **html5-qrcode** — カメラUI内蔵、QR＋バーコード対応、プラグアンドプレイ、アクティブメンテナンス
2. **zxing-js** — 多フォーマット対応、産業標準、カメラUIは手動構築必要
3. **jsQR** — 最軽量、QRのみ、カメラUI・ウェブカメラ制御なし（自前実装必要）

**Evidence for decision:**
- html5-qrcodeはカメラUI内蔵で最短実装。QRかざし→3秒以内表示のNFRに最も合致
- zxing-jsは多機能だがカメラUI構築が必要で開発コスト増
- jsQRは軽量だがカメラ制御を全て自前実装する必要がありリスク高

**Extensions needed:** なし
**Risks:** PC内蔵カメラの品質差による読取精度のばらつき

---

### 5. メール送信
**Decision:** Adopt — Resend

**Queries used:**
- "Best free email sending service 2025 for small apps: Resend vs SendGrid vs Mailgun free tier comparison"

**Candidates considered:**
1. **Resend** — 永続無料枠3,000通/月（100通/日）、React/Next.js統合優秀、モダンAPI
2. **SendGrid** — 無料プラン廃止（60日トライアルのみ）、その後$19.95/月～
3. **Mailgun** — 5,000通/3ヶ月トライアル、その後有料

**Evidence for decision:**
- Resendは唯一の永続無料枠。学童30家庭＋先生で月100通程度なら十分
- React Email統合でテンプレートをReactコンポーネントとして記述可能
- SendGridは無料プラン廃止でコスト制約と矛盾
- Supabase Authの招待メール・パスワードリセットはSupabase内蔵。追加のトランザクションメール（通知等）にResendを使用

**Extensions needed:** なし
**Risks:** 100通/日の上限。全保護者への一斉通知が30通なら問題なし

---

### 6. プッシュ通知
**Decision:** Compose — Web Push API + メールフォールバック

**Queries used:**
- "Web Push notification PWA iOS Safari 2025 2026: current support status and best libraries for React"

**Candidates considered:**
1. **Web Push API (標準)** + **web-push (サーバーサイド)** — 標準仕様、iOS 16.4+対応（ホーム画面追加が必要）
2. **OneSignal** — React SDK、iOS対応、無料枠あり。サードパーティ依存
3. **Firebase Cloud Messaging** — 無料、高信頼。Supabaseとの統合に追加作業必要

**Evidence for decision:**
- iOS Safari 16.4+でWeb Push対応済み（ホーム画面追加が条件）
- ただしiOSでは手動インストール必要、信頼性に課題、EUでは非対応
- 保護者の多くがiPhoneの場合、プッシュ通知だけでは不十分
- メール通知をフォールバックとして併用するCompose戦略が最も堅実
- サーバーサイドはweb-pushライブラリ＋VAPID、クライアントはService Worker

**Extensions needed:** メール通知との併用ロジック。保護者の通知設定UI
**Risks:** iOSユーザーへのプッシュ通知の信頼性。ホーム画面追加の導線設計が必要

---

### 7. 画像圧縮
**Decision:** Adopt — browser-image-compression

**Queries used:**
- "Best React image compression upload library 2025: browser-image-compression vs compressorjs"

**Candidates considered:**
1. **browser-image-compression** — Web Worker対応（UI非ブロック）、PNG対応良好、Promise/async API、950k+ weekly downloads
2. **compressorjs** — 最速圧縮、JPG特化、コールバックAPI、PNG圧縮弱い

**Evidence for decision:**
- Web Worker対応でUIがブロックされない（先生がスマホで複数写真アップロード時に重要）
- PNG含む多フォーマット対応
- Promise/async APIがReactのasync flowに自然にフィット
- 速度はcompressorjsに劣るが、1回数枚のアップロードなら問題なし

**Extensions needed:** なし
**Risks:** なし

---

### 8. 画像ストレージ
**Decision:** Extend — Supabase Storage

**Queries used:**
- "Best free image hosting storage for small apps 2025: Supabase Storage vs Cloudflare R2 vs S3 free tier"

**Candidates considered:**
1. **Supabase Storage** — 1GB無料、S3互換、Auth統合でRLSアクセス制御、React SDK統合済み
2. **Cloudflare R2** — 10GB無料、S3互換。Auth統合は別途構築必要
3. **AWS S3** — 5GB無料（12ヶ月限定）。本格的だが無料期間限定

**Evidence for decision:**
- Supabase StorageはAuth・DBと一体で、写真の公開/非公開制御をRLSで宣言的に実装できる
- 別サービス（R2、S3）を使うとAuth連携のための追加開発が必要
- 1GBは30人×写真で圧迫される可能性があるが、画像圧縮（500KB以下）＋アーカイブポリシーで管理

**Extensions needed:** ストレージ容量監視＋警告機能。圧縮画像のサイズ管理ポリシー。将来的にR2への移行パス
**Risks:** 1GB上限。写真500KB×1000枚で約500MB。月100枚ペースなら約10ヶ月で上限に近づく。有料プラン（$25/月）への移行またはR2併用を検討

---

## Decision summary

| Capability | Decision | Solution | 無料枠 |
|------------|----------|----------|--------|
| Authentication | Adopt | Supabase Auth | 50,000 MAU |
| BaaS / DB | Adopt | Supabase (PostgreSQL) | 500MB DB |
| QR生成 | Adopt | react-qr-code | OSS（無料） |
| QR読取 | Adopt | html5-qrcode | OSS（無料） |
| メール送信 | Adopt | Resend | 3,000通/月 |
| プッシュ通知 | Compose | Web Push API + メール | 標準API（無料） |
| 画像圧縮 | Adopt | browser-image-compression | OSS（無料） |
| 画像ストレージ | Extend | Supabase Storage | 1GB |
