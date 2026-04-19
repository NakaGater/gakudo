# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.0] - 2026-04-19

### Added
- 公開HP（施設紹介・説明会案内・お知らせ）
- メールアドレス＋パスワードによるログイン・ログアウト
- パスワードリセット（メール経由）
- 先生用ダッシュボード（サイドバーナビ）
- 保護者用ダッシュボード（ボトムタブナビ、モバイルファースト）
- 生徒の登録・編集
- QRコードカード生成・PDF出力
- QRコードによる入退場記録（Webカメラスキャン）
- 入退場履歴閲覧（先生: 全生徒、保護者: 自分の子どものみ）
- 保護者アカウントの作成（先生が管理）
- 連絡事項の登録・閲覧
- 写真のアップロード・閲覧（Signed URLによるアクセス制御）
- 公開お知らせの管理・HP表示
- ロールベースアクセス制御（RLS + Middleware + Server Actions）

### Security
- 全Server Actionsにロールベース認証ガードを追加
- 子どもの写真はSigned URL（有効期限1時間）で配信
- パスワードはSupabase Auth（bcrypt）でハッシュ化保存
