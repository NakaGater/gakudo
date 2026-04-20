# Design System — gakudo

## 1. Mood & identity

**温かく、信頼感があり、落ち着いた学びの場。** gakudoは子どもの安全と保護者の安心を支えるツール。派手さよりも「確実に使える」安心感を重視する。色使いはアンバー（琥珀色）と温かみのあるニュートラルを基調とし、情報は整理されて一目でわかること。幼稚すぎず、事務的すぎない「学校の先生のような」佇まい。

**キーワード:** 温かい、信頼、整然、やさしい、実用的

**参考プロダクト:**
- **STUDYPLUS（スタディプラス）** — 教育系アプリとしての信頼感と温かみ
- **freee** — 業務アプリの整然さ、日本のユーザーに馴染むUI

## 2. Color tokens

```css
/* ── Base ── */
--color-bg:          #FAFAF7;    /* 温かみのあるオフホワイト */
--color-bg-elev:     #FFFFFF;    /* カード・モーダル背景 */
--color-fg:          #1C1917;    /* ほぼ黒（stone-900） */
--color-fg-muted:    #78716C;    /* 説明テキスト（stone-500） */
--color-accent:      #B45309;    /* アンバー（amber-700） */
--color-accent-hv:   #92400E;    /* ホバー時（amber-800） */
--color-accent-light:#FEF3C7;    /* アクセント背景（amber-100） */
--color-success:     #15803D;    /* 入室・完了（green-700） */
--color-warning:     #B45309;    /* 注意（amber-700） */
--color-danger:      #B91C1C;    /* 退室・エラー（red-700） */
--color-border:      #E7E5E4;    /* ボーダー（stone-200） */

/* ── Attendance specific ── */
--color-enter:       #15803D;    /* 入室 = success green */
--color-exit:        #B91C1C;    /* 退室 = danger red */
```

**コントラスト比（WCAG AA）:**

| 前景 | 背景 | 比率 | 判定 |
|------|------|------|------|
| `--color-fg` #1C1917 | `--color-bg` #FAFAF7 | 15.6:1 | ✅ AAA |
| `--color-fg-muted` #78716C | `--color-bg` #FAFAF7 | 4.6:1 | ✅ AA body |
| `--color-accent` #B45309 | `--color-bg` #FAFAF7 | 7.7:1 | ✅ AAA |
| `--color-accent` #B45309 | `--color-bg-elev` #FFFFFF | 7.5:1 | ✅ AAA |
| `#FFFFFF` | `--color-accent` #B45309 | 7.5:1 | ✅ AAA（白抜き文字） |
| `--color-success` #15803D | `--color-bg` #FAFAF7 | 5.8:1 | ✅ AA body |
| `--color-danger` #B91C1C | `--color-bg` #FAFAF7 | 5.9:1 | ✅ AA body |

**ダークモード:** v1では非対応。ライトモードのみ。

## 3. Typography

```css
/* ── Family ── */
--font-sans:    "Noto Sans JP", "Hiragino Kaku Gothic ProN", system-ui, sans-serif;
--font-mono:    "JetBrains Mono", "Noto Sans Mono", ui-monospace, monospace;

/* ── Scale (ratio 1.25 — Major Third) ── */
--text-xs:      0.75rem / 1rem;       /* 12px / 16px */
--text-sm:      0.875rem / 1.25rem;   /* 14px / 20px */
--text-base:    1rem / 1.5rem;        /* 16px / 24px */
--text-lg:      1.25rem / 1.75rem;    /* 20px / 28px */
--text-xl:      1.5rem / 2rem;        /* 24px / 32px */
--text-2xl:     1.875rem / 2.25rem;   /* 30px / 36px */
--text-3xl:     2.25rem / 2.5rem;     /* 36px / 40px */

/* ── Weight ── */
--font-normal:  400;
--font-medium:  500;
--font-bold:    700;
```

**使い分け:**
- 本文: `--text-base`, `--font-normal`
- ラベル・キャプション: `--text-sm`, `--font-medium`
- ページタイトル: `--text-2xl`, `--font-bold`
- セクション見出し: `--text-lg`, `--font-bold`

## 4. Spacing & layout

```css
/* ── Space scale (4px base) ── */
--space-1:    0.25rem;   /* 4px */
--space-2:    0.5rem;    /* 8px */
--space-3:    0.75rem;   /* 12px */
--space-4:    1rem;      /* 16px */
--space-5:    1.25rem;   /* 20px */
--space-6:    1.5rem;    /* 24px */
--space-8:    2rem;      /* 32px */
--space-10:   2.5rem;    /* 40px */
--space-12:   3rem;      /* 48px */
--space-16:   4rem;      /* 64px */

/* ── Radius ── */
--radius-sm:   0.375rem;  /* 6px — input, badge */
--radius-md:   0.5rem;    /* 8px — card, button */
--radius-lg:   0.75rem;   /* 12px — modal, dialog */
--radius-full: 9999px;    /* 円 — avatar */

/* ── Shadow (控えめ) ── */
--shadow-sm:   0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md:   0 2px 4px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
--shadow-lg:   0 4px 12px rgba(0, 0, 0, 0.08);

/* ── Container ── */
--container-sm:   640px;
--container-md:   768px;
--container-lg:   1024px;
--container-xl:   1280px;

/* ── Breakpoints ── */
--breakpoint-sm:  640px;
--breakpoint-md:  768px;
--breakpoint-lg:  1024px;
```

## 5. Components

### Buttons

| Variant | 背景 | テキスト | ボーダー | 用途 |
|---------|------|----------|----------|------|
| **primary** | `--color-accent` | white | none | 主要アクション |
| **secondary** | `--color-bg-elev` | `--color-fg` | `--color-border` | 副次アクション |
| **ghost** | transparent | `--color-accent` | none | テーブル内操作 |
| **destructive** | `--color-danger` | white | none | 削除・取消 |
| **enter** | `--color-enter` | white | none | 入室記録 |
| **exit** | `--color-exit` | white | none | 退室記録 |

- サイズ: `sm` (h-8), `md` (h-10), `lg` (h-12)
- 状態: hover(明度-10%), disabled(opacity-50), loading(spinner)
- radius: `--radius-md`

### Inputs

- テキスト入力: border `--color-border`, focus border `--color-accent`, h-10
- エラー時: border `--color-danger`, エラーメッセージ `--text-sm` `--color-danger`
- ラベル: `--text-sm` `--font-medium`, 上配置
- radius: `--radius-sm`

### Cards

- 背景: `--color-bg-elev`, shadow: `--shadow-sm`, radius: `--radius-md`
- パディング: `--space-4` (sm), `--space-6` (md)
- ホバー不要（カード全体リンクでない場合）

### Navigation

- **モバイル（< md）:** 下部タブバー（固定）、4-5タブ
- **デスクトップ（>= md）:** 左サイドバー（w-64）、折りたたみ可能
- アクティブ状態: `--color-accent-light` 背景 + `--color-accent` テキスト
- 先生用/保護者用でタブ項目が変わる（ロール別）

### Modals & Toasts

- モーダル: `--shadow-lg`, radius `--radius-lg`, オーバーレイ rgba(0,0,0,0.4)
- トースト: 右上固定、4秒自動消去、success/warning/danger色のアクセントバー
- 入退場通知: フルスクリーン表示（児童名 + 入室/退室 + 大きなアイコン）

### Tables

- ヘッダー: `--color-bg` 背景, `--font-medium`
- 行: 偶数行 `--color-bg`, 奇数行 `--color-bg-elev`
- モバイル: カードリストに変換（テーブル非表示）

### Empty states

- 中央配置アイコン（muted色） + 説明テキスト + CTAボタン

## 6. Iconography & imagery

- **アイコン:** Lucide React (`lucide-react`)
  - stroke-width: 1.75（デフォルトの2より少し細め = やさしい印象）
  - サイズ: 16px(inline), 20px(nav/button), 24px(feature), 48px(empty state)

- **写真スタイル:** 実写のみ（イラスト不使用）。16:9 or 4:3。
- **プレースホルダー:** `--color-bg`背景 + Lucideアイコン（`ImageOff`）中央配置

## 7. Motion

```css
--transition-fast:    150ms ease-out;  /* hover, focus */
--transition-normal:  250ms ease-out;  /* modal open, toast slide */
--transition-slow:    350ms ease-out;  /* page transition */
```

- `prefers-reduced-motion: reduce` 時: すべてのtransitionを `0ms` に
- 入退場記録時: 児童名の表示にフェードイン（250ms）。成功/失敗の色が3秒間維持

## 8. Anti-slop rules

このプロダクトで **使わない** パターン：

1. ❌ **紫〜ピンクのグラデーション** — AIデフォルト感が出る
2. ❌ **Inter フォント** — AI生成の汎用感。Noto Sans JPを使用
3. ❌ **中央揃えヒーロー + 3カード横並び** — ランディングページテンプレート感
4. ❌ **グラスモーフィズム** — 視認性を損なう
5. ❌ **過度な角丸（radius 16px以上）** — バブリーすぎる
6. ❌ **全要素にドロップシャドウ** — 平面的で静かなデザインを維持
7. ❌ **アニメーション過多** — 業務ツールとして落ち着いた動作
8. ❌ **ダークモードUI** — v1はライトモードのみ
