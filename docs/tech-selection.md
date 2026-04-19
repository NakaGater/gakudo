# Tech selection — 学童保育Webアプリ（がくどう）

## Recommendation

Stack: **Next.js (App Router) + Supabase + Vercel**

React + TypeScriptの実務経験がそのまま活かせるNext.jsをフロントエンド/BFFに採用。バックエンドはSupabaseで認証・DB（PostgreSQL）・ストレージ・メール送信を一括カバーし、無料枠内での運用を実現する。Vercelの無料プランでホスティングし、公開HPはSSG/ISRでSEOとパフォーマンスを確保する。

## Constraints extracted from PRD

- NFR: 予算は無料枠で運用 → 無料ティアが充実したマネージドサービス必須
- NFR: HTTPS必須 → マネージドホスティング（自動SSL）が望ましい
- NFR: 写真ストレージ（1枚5MB以下、リサイズ済み） → オブジェクトストレージの無料枠が必要
- NFR: 同時接続50ユーザー → 小規模、サーバーレスで十分
- FR: メール送信（パスワードリセット） → メール送信サービスが必要
- FR: 公開HP（SEO対応） → SSR/SSGが必要
- FR: 認証（メール+パスワード、2ロール） → 認証サービスが必要
- FR: QRコード読み取り（ブラウザ + Webカメラ） → クライアントサイドJSライブラリで対応
- 制約: 開発者はReact + TypeScript、SpringBoot + Kotlinの経験あり

## Candidates considered

|                          | A: Next.js + Supabase + Vercel | B: Next.js + Firebase + Vercel | C: React SPA + SpringBoot + Railway |
|--------------------------|-------------------------------|-------------------------------|-------------------------------------|
| **フレームワーク** | Next.js 15 (App Router) | Next.js 15 (App Router) | React (Vite) + SpringBoot + Kotlin |
| **SSR / SSG** | ネイティブ対応（ISR含む） | ネイティブ対応 | SPAのみ（SSRなし）。公開HPのSEOに不利 |
| **DB** | PostgreSQL（Supabase、500MB無料） | Firestore（NoSQL、1GB無料） | PostgreSQL（Railway、500MB無料 → 有料化リスク） |
| **データモデル適合** | RDBでリレーション自然に表現 | NoSQLで多対多（ParentStudent）が不自然 | RDBで自然。JPA/Hibernateで型安全 |
| **認証** | Supabase Auth（メール+パスワード、RLS） | Firebase Auth（メール+パスワード） | Spring Security（自前実装） |
| **ストレージ** | Supabase Storage（1GB無料、RLS対応） | Firebase Storage（5GB無料） | S3互換（別途契約必要） |
| **メール送信** | Supabase Auth内蔵（パスワードリセット） | Firebase Auth内蔵 | 自前（SendGrid等を別途契約） |
| **Row Level Security** | ネイティブ（保護者が自分の子どもだけ見える制御に最適） | Security Rules（やや複雑） | アプリ層で自前実装 |
| **QRコード** | html5-qrcode（JSライブラリ） | 同左 | 同左 |
| **学習コスト** | 低（React+TS経験あり、Supabaseは学習しやすい） | 低（Firebase APIは独自だがドキュメント豊富） | 最低（既知のスタック）だがインフラ管理が増える |
| **デプロイ** | Vercel（ワンクリック、自動SSL） | Vercel + Firebase（2サービス管理） | Railway（有料化リスク）+ Vercel |
| **無料枠での月間コスト** | ¥0（Supabase Free + Vercel Free） | ¥0（Firebase Spark + Vercel Free） | リスクあり（Railwayの無料枠廃止傾向） |
| **将来の拡張性** | Edge Functions、Realtime、複数施設時もRLS拡張で対応 | Cloud Functions、大規模向き | 自由度最高だがインフラコスト増 |
| **Fit Score** | **9/10** | **7/10** | **5/10** |

### Fit Score 内訳

**A: Next.js + Supabase + Vercel (9/10)**
- Requirements fit: 4/4（SSG、認証、ストレージ、メール全てカバー）
- Ecosystem: 3/3（テンプレート豊富、RLS for マルチロール）
- Operability: 2/3（Supabaseは比較的新しいが安定、ドキュメント充実）

**B: Next.js + Firebase + Vercel (7/10)**
- Requirements fit: 3/4（NoSQLでリレーショナルデータの扱いが不自然）
- Ecosystem: 3/3（Firebase のドキュメント・コミュニティは最大級）
- Operability: 1/3（2サービスの管理、Firestore のクエリ制約）

**C: React SPA + SpringBoot + Railway (5/10)**
- Requirements fit: 2/4（SSRなし、メール・ストレージ別途必要）
- Ecosystem: 2/3（SpringBoot は成熟だがフルスタック構成の管理が複雑）
- Operability: 1/3（ホスティング無料枠のリスク、インフラ管理コスト大）

## Decision

- Chosen: **Next.js (App Router) + Supabase + Vercel**
- Rationale: React+TSの経験がそのまま活かせ、Supabaseが認証・DB・ストレージ・メールを無料枠で一括提供。PostgreSQLのRLSにより「保護者は自分の子どもだけ見える」というアクセス制御をDB層で安全に実装できる。公開HPはISRでSEO対応。SpringBoot+Kotlinも候補だが、無料ホスティングの不安定さとインフラ管理コストがv1の迅速なリリースに不利。
- Overridden by human? no
- Notes: Supabase Free Tier — DB 500MB、Storage 1GB、月5万Auth MAU、Edge Functions 50万回/月。30家庭+6先生の規模では十分。

## Recorded by
- date: 2026-04-19
- mode: human-approved
