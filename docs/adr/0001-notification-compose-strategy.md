# ADR-0001: 通知のCompose戦略（Web Push + Email fallback）

Date: 2026-04-20
Status: accepted

## Context

gakudoでは入退場時の保護者通知と連絡事項の配信が必要。通知手段としてプッシュ通知が理想だが、iOSではPWAをホーム画面に追加しないとWeb Pushが利用できず、対応が不安定。LINE通知APIは無料枠の制約が厳しく、サードパーティ依存も増える。

保護者全員に確実に届く通知手段が必要であり、単一チャネルでは不十分。

## Options considered

1. **Web Push のみ** — コスト0円。ただしiOSの制約により全保護者への到達率が低い。
2. **Email のみ** — 確実に届くが、リアルタイム性が低い。Resend無料枠3,000通/月で30人規模なら十分。
3. **Web Push + Email fallback（Compose）** — Push対応端末にはPush、非対応/未登録にはEmailで送信。到達率とリアルタイム性のバランスが最良。
4. **LINE Messaging API** — 保護者が慣れているが、無料枠200通/月は不足。月額5,000円〜が必要。

## Decision

**Option 3: Web Push + Email fallback（Compose戦略）** を採用。

ユーザーごとに通知設定（push / email / both / off）を持ち、pushサブスクリプションがある場合はpush優先、なければemailにフォールバック。

## Consequences

- **Positive:** iOS非対応ユーザーにもメールで確実に届く。コスト0円（Resend無料枠内）。
- **Positive:** 将来LINE連携を追加する場合、notificationPreferencesにチャネルを追加するだけで拡張可能。
- **Negative:** 通知モジュールが2チャネル分の実装を持つ（やや複雑）。
- **Neutral:** push通知のVAPIDキー管理が必要。

## References

- search-first.md: Push Notifications — Compose判定
- PRD FR-5: 入退場通知
- PRD FR-7: 連絡配信
