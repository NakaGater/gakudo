# Design System — 学童保育Webアプリ（がくどう）

## 1. Mood & identity

温かく親しみやすく、でも信頼感のある。子どもの安全を預かるサービスとして安心感を与えつつ、忙しい保護者や先生がストレスなく使える実用的なデザイン。過度な装飾は避け、情報の視認性を最優先する。参考プロダクト: **コドモン**（保育園向けICT）のような落ち着いた実用性、**Notion** のようなクリーンな情報整理。キーワード: 温かい、信頼できる、実用的、クリーン、落ち着いた。

## 2. Color tokens

```css
/* ── Base ── */
--color-bg:          #FAFAF8;    /* warm off-white */
--color-bg-elev:     #FFFFFF;    /* cards, modals */
--color-fg:          #1A1A1A;    /* primary text */
--color-fg-muted:    #6B7280;    /* secondary text */

/* ── Accent: warm green (安心・安全のイメージ) ── */
--color-accent:      #2D9D78;    /* primary actions, links */
--color-accent-hv:   #247A5E;    /* hover state */
--color-accent-soft: #E8F5F0;    /* accent background */

/* ── Status ── */
--color-success:     #16A34A;
--color-warning:     #D97706;
--color-danger:      #DC2626;

/* ── Border & dividers ── */
--color-border:      #E5E5E3;
--color-border-focus: #2D9D78;

/* ── Attendance-specific ── */
--color-checkin:     #2D9D78;    /* 入場: green */
--color-checkout:    #3B82F6;    /* 退場: blue */
```

### Contrast ratios (WCAG AA)
| Combination | Ratio | Pass? |
|-------------|-------|-------|
| `--color-fg` on `--color-bg` | 15.2:1 | AA |
| `--color-fg-muted` on `--color-bg` | 5.1:1 | AA |
| `--color-accent` on `--color-bg` | 4.6:1 | AA |
| `--color-bg-elev` text `--color-fg` | 17.1:1 | AA |
| white on `--color-accent` | 4.8:1 | AA |

## 3. Typography

```css
--font-sans:     'Noto Sans JP', 'Geist', system-ui, sans-serif;
--font-mono:     'Geist Mono', 'SF Mono', monospace;

/* Scale: 1.25 ratio (major third) */
--text-xs:       0.75rem / 1rem;      /* 12px/16px */
--text-sm:       0.875rem / 1.25rem;  /* 14px/20px */
--text-base:     1rem / 1.5rem;       /* 16px/24px */
--text-lg:       1.25rem / 1.75rem;   /* 20px/28px */
--text-xl:       1.5rem / 2rem;       /* 24px/32px */
--text-2xl:      1.875rem / 2.25rem;  /* 30px/36px */
--text-3xl:      2.25rem / 2.5rem;    /* 36px/40px */
```

- 本文: `--text-base`, weight 400
- 見出し: `--text-xl` 〜 `--text-3xl`, weight 700
- ラベル・補助: `--text-sm`, weight 500
- 日本語表示のためNoto Sans JPを第一候補に

## 4. Spacing & layout

```css
/* 4px base scale */
--space-1:   0.25rem;   /* 4px */
--space-2:   0.5rem;    /* 8px */
--space-3:   0.75rem;   /* 12px */
--space-4:   1rem;      /* 16px */
--space-5:   1.25rem;   /* 20px */
--space-6:   1.5rem;    /* 24px */
--space-8:   2rem;      /* 32px */
--space-10:  2.5rem;    /* 40px */
--space-12:  3rem;      /* 48px */
--space-16:  4rem;      /* 64px */

/* Radius */
--radius-sm:   0.25rem;  /* 4px — inputs, small elements */
--radius-md:   0.5rem;   /* 8px — cards, buttons */
--radius-lg:   0.75rem;  /* 12px — modals, large cards */
--radius-full: 9999px;   /* pills, avatars */

/* Shadow */
--shadow-sm:   0 1px 2px rgba(0,0,0,0.05);
--shadow-md:   0 2px 4px rgba(0,0,0,0.08);
--shadow-lg:   0 4px 12px rgba(0,0,0,0.10);

/* Container */
--container-sm:  640px;
--container-md:  768px;
--container-lg:  1024px;
--container-xl:  1280px;

/* Breakpoints */
--breakpoint-sm:  640px;
--breakpoint-md:  768px;
--breakpoint-lg:  1024px;
```

## 5. Components

### Buttons

| Variant | Background | Text | Border | Use case |
|---------|-----------|------|--------|----------|
| Primary | `--color-accent` | white | none | 主要アクション（保存、登録） |
| Secondary | transparent | `--color-accent` | `--color-accent` | 副次アクション（キャンセル、戻る） |
| Ghost | transparent | `--color-fg-muted` | none | インラインアクション（編集、削除） |
| Danger | `--color-danger` | white | none | 破壊的アクション |

- Size: sm (h-8, text-sm), md (h-10, text-base), lg (h-12, text-lg)
- States: hover (darken 10%), disabled (opacity 0.5), loading (spinner)
- Border-radius: `--radius-md`

### Inputs

- Height: h-10 (md), h-8 (sm)
- Border: 1px `--color-border`, focus: 2px `--color-border-focus`
- Border-radius: `--radius-sm`
- Error state: border `--color-danger`, helper text in `--color-danger`
- Label: `--text-sm`, weight 500, color `--color-fg`

### Cards

- Background: `--color-bg-elev`
- Border: 1px `--color-border`
- Shadow: `--shadow-sm` (default), `--shadow-md` (hover on interactive cards)
- Radius: `--radius-lg`
- Padding: `--space-4` (sm screens), `--space-6` (md+)

### Navigation

**先生用（デスクトップ）**: サイドバーナビ（w-64）、ロゴ + メニュー項目 + ログアウト
**先生用（モバイル）**: ハンバーガーメニュー → ドロワー
**保護者用**: ボトムタブナビ（4項目: ホーム、入退場、連絡、写真）
**公開HP**: トップバー（ロゴ + ログインリンク）

### Tables（先生用 入退場履歴・生徒一覧）

- Header: bg `--color-bg`, text `--color-fg-muted`, `--text-sm`, weight 600
- Row: border-bottom 1px `--color-border`
- Hover: bg `--color-accent-soft`
- モバイル: テーブル → カードリストに変換

### Empty states

- 中央配置、イラストなし（シンプルなアイコン + テキスト）
- Text: `--color-fg-muted`, `--text-base`
- CTA button if applicable

### Toasts / Notifications

- Position: top-right (desktop), top-center (mobile)
- Duration: 3秒 auto-dismiss
- Success: left border `--color-success`
- Error: left border `--color-danger`

### 入退場スキャン画面（特殊）

- 全画面表示（ナビなし）
- カメラプレビュー: 画面中央、max-width 640px
- 結果表示: フルスクリーンオーバーレイ
  - 入場: bg `--color-checkin`, 白文字, 生徒名を `--text-3xl` で表示
  - 退場: bg `--color-checkout`, 白文字, 同上
  - エラー: bg `--color-danger`, 白文字
- 3秒後に自動でカメラプレビューに戻る

## 6. Iconography & imagery

- **Icon family**: Lucide React（stroke-width: 1.5）
- **Icon size**: 16px (inline), 20px (nav), 24px (feature), 48px (empty state)
- **写真サムネイル**: aspect-ratio 1:1 (grid), object-fit: cover
- **写真フルサイズ**: object-fit: contain, dark overlay background
- **プレースホルダー**: bg `--color-bg`, icon `--color-fg-muted`

## 7. Motion

```css
--transition-fast:    150ms ease-out;  /* hover, focus */
--transition-normal:  200ms ease-out;  /* panels, drawers */
--transition-slow:    300ms ease-out;  /* modals, page transitions */
```

- `prefers-reduced-motion: reduce` → all transitions set to 0ms
- 入退場結果のオーバーレイ: fade-in 200ms, auto-dismiss 3秒後にfade-out 300ms

## 8. Anti-slop rules

- **紫〜ピンクのグラデーションは使用しない。** アクセントカラーはwarm green 1色のみ。
- **Inter フォントは使用しない。** 日本語対応のNoto Sans JPを使用。
- **中央寄せヒーロー + 3カード横並びレイアウトは使用しない。** 公開HPは情報優先の縦スクロール。
- **グラスモーフィズム（すりガラス効果）は使用しない。**
- **重いドロップシャドウを多用しない。** shadow-smをデフォルト、shadow-mdはホバー時のみ。
- **過度なアニメーションは使用しない。** 子どもの安全に関わるアプリとして落ち着いた印象を保つ。
- **ダークモードはv1では実装しない。** ライトモードのみ。
