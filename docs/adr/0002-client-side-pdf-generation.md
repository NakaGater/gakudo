# ADR-0002: QRカードPDF生成をクライアントサイドで行う

Date: 2026-04-19
Status: accepted

## Context

QRコードカードの生成（US-6）では、生徒名＋QRコードをカードサイズでPDF出力する。サーバーサイドでPDFを生成する方法とクライアントサイドで生成する方法がある。

## Options considered

1. **クライアントサイド（jsPDF + qrcode）** — ブラウザ上でQRコード画像を生成し、jsPDFでPDFを組み立ててダウンロード
   - Pros: サーバーリソース不要、Vercel Edge/Serverless Functionsの実行時間制限を回避、即座にプレビュー可能
   - Cons: 大量生成時のブラウザ負荷（30人程度なら問題なし）

2. **サーバーサイド（Puppeteer / PDFKit）** — Next.js Route HandlerでPDFを生成
   - Pros: サーバー側で一括処理
   - Cons: Puppeteerはバンドルサイズ大、Vercel Serverless Functionsのメモリ/時間制限に抵触するリスク

3. **外部サービス（Vercel OG Image等）** — 画像生成API
   - Pros: スケーラブル
   - Cons: PDFではなく画像。カード印刷に不向き

## Decision

**クライアントサイド（jsPDF + qrcode）** を採用。30人分のQRカードPDFはブラウザで十分処理可能。サーバーリソースを消費せず、先生がその場で即座にPDFを生成・ダウンロードできる。

## Consequences

- Positive: インフラコストゼロ、実装シンプル、オフラインでも動作
- Negative: クライアントのスペックに依存（KAZASU用のWindowsノートPCで検証要）
- Neutral: 将来100人超の施設に対応する場合は再検討

## References

- PRD FR-5: QRコード生成・カード印刷
- User Story US-6
