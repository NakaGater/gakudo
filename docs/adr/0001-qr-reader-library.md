# ADR-0001: QRコード読み取りライブラリの選定

Date: 2026-04-19
Status: accepted

## Context

入退場記録（US-7）ではWindowsノートPCのWebカメラでQRコードを読み取る必要がある。ブラウザのMediaDevices APIでカメラにアクセスし、JSライブラリでQRコードをデコードする。読み取り精度と速度がKAZASU代替の成否を決める。

## Options considered

1. **html5-qrcode** — npm週間DL 200K+、ZXingベース、React対応。カメラ制御とQRデコードを一体提供。ドキュメント豊富。
   - Pros: 簡単に統合可能、カメラUI込み、活発にメンテ
   - Cons: バンドルサイズがやや大きい（~300KB）

2. **@zxing/browser + @zxing/library** — ZXingのJS移植。低レベルAPI。
   - Pros: 軽量、柔軟
   - Cons: カメラ制御を自前実装する必要あり、学習コスト高

3. **jsQR** — 画像からQRコードをデコードするライブラリ。カメラ制御なし。
   - Pros: 非常に軽量（~50KB）
   - Cons: カメラフレーム取得を自前実装、メンテナンス停滞気味

## Decision

**html5-qrcode** を採用。カメラ制御とQRデコードが一体で提供され、WindowsノートPCのWebカメラとの互換性が高い。入退場画面は常時起動のため、バンドルサイズは問題にならない。

## Consequences

- Positive: カメラUI実装が最小限で済む。PoC段階で読み取り精度を検証しやすい
- Negative: ライブラリへの依存。メンテナンス停止時は@zxing/browserに移行
- To revisit: M2完了後にWebカメラでの実機テストを行い、精度が不十分なら外付けカメラを検討

## References

- PRD FR-6: QRコード入退場記録
- User Story US-7
