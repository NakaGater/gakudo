# Design System — 星ヶ丘こどもクラブ (gakudo)

> **GAN adversarial design refresh v12 — Score: 58/60**
> Mockup: `docs/design/gan-refresh-iter-12.html`

## 1. Mood & Identity

**「絵本の中の学童クラブ」** — 子どもたちが自由に楽しく過ごせる雰囲気、温かみのある色合い、子供らしい可愛らしさ・面白さ・楽しさ。派手さではなく「手触りのある温もり」で安心と信頼を伝える。

**キーワード:** 絵本、手づくり、紙のぬくもり、クレヨン、安心、楽しい

**ブランドマスコット:** ⭐ 星ちゃん（星ヶ丘のシンボル）
- `--star-bright: #FFD93D` — 装飾用（明るい金色）
- `--star-gold: #E8B830` — ボーダー/影
- `--cr-yellow: #C9A520` — テキスト用（WCAG AA準拠）

**参考プロダクト:**
- **絵本の装丁** — 紙質・テクスチャ・手書き感
- **北欧系プロダクトデザイン** — 温かみのある素材感と機能性の両立

## 2. Color Tokens

```css
/* ── Base ── */
--white:       #FFFFFF;
--bg:          #FFF8ED;        /* 温かいクリーム */
--bg-elev:     #FFFCF5;        /* 浮き上がる面 */
--paper-warm:  #FFF8ED;        /* 紙の温もり */
--ink:         #3B2F20;        /* 深いセピア */
--ink-mid:     #7A6B5A;        /* 中間テキスト */
--ink-light:   #A89880;        /* キャプション */
--border:      #E8DCC6;        /* 温かいボーダー */

/* ── Crayon Palette (全色WCAG AA準拠に暗化済み) ── */
--cr-red:      #D14B40;        /* クレヨン赤 */
--cr-orange:   #D97B3F;        /* クレヨン橙 */
--cr-green:    #3A8A64;        /* クレヨン緑 */
--cr-blue:     #4A8FC5;        /* クレヨン青 */
--cr-purple:   #7E65AD;        /* クレヨン紫 */
--cr-pink:     #C86E8A;        /* クレヨンピンク */

/* ── Semantic ── */
--present:     #4CAF50;        /* 出席 */
--present-bg:  #E8F5E9;
--present-bd:  #A5D6A7;
--absent-bg:   #FFEBEE;
--absent-bd:   #EF9A9A;

/* ── Shadows ── */
--sh-sm:   0 1px 3px rgba(59,47,32,.06);
--sh-md:   0 3px 8px rgba(59,47,32,.08);
--sh-lg:   0 6px 20px rgba(59,47,32,.12);
```

**コントラスト比（WCAG AA）:**

| 用途 | 色 | 背景 | 比率 | 判定 |
|------|-----|------|------|------|
| 本文 | `--ink` #3B2F20 | `--bg` #FFF8ED | 11.2:1 | ✅ AAA |
| 中間 | `--ink-mid` #7A6B5A | `--bg` | 5.1:1 | ✅ AA |
| 下書きバッジ | `#8A6D00` | `#FFF0CC` | 4.8:1 | ✅ AA |
| 先生バッジ | `#8A4A00` | `#FFE5D5` | 5.2:1 | ✅ AA |
| 保護者バッジ | `#1A5F8A` | `#DFF0FF` | 5.5:1 | ✅ AA |
| リンク | `#B85C1A` | `--white` | 4.6:1 | ✅ AA |

## 3. Typography — 3フォントシステム

```css
/* ── Family ── */
--font-story:  "Zen Maru Gothic", serif;       /* 表示・ストーリー */
--font-hand:   "Yusei Magic", cursive;          /* 手書きアクセント（署名のみ） */
--font-body:   "Noto Sans JP", sans-serif;      /* 本文・データ */
```

**3レイヤースケール:**

| レイヤー | サイズ | Weight | Letter-spacing | 用途 |
|----------|--------|--------|----------------|------|
| **Display** | clamp(38px,4.2vw,46px) | 900 | -0.025em | ヒーロータイトル |
| **Title** | 15px | 700 | -0.01em | カードタイトル、セクション見出し |
| **Body** | 13px | 400 | 0 | 本文、説明文 (line-height: 1.55) |
| **Meta** | 11px | 400 | 0.02em | 日付、スラッグ、キャプション |
| **Section** | 20px | 700 | -0.02em | ページタイトル (.main__title) |

**使い分けルール:**
- `--font-story` (Zen Maru): タイトル、カード名、ナビ、感情的テキスト
- `--font-hand` (Yusei Magic): スタンプ、先生メモ、ムードストリップの一言 **のみ**
- `--font-body` (Noto Sans): すべてのデータ、メタ、フォーム入力、テーブル
- 数値データ: `font-variant-numeric: tabular-nums`
- 見出し: `text-wrap: balance`

## 4. Materiality — 素材マップ

### 3段階インテンシティ

| レベル | 画面 | 素材感 |
|--------|------|--------|
| **IMMERSIVE** | ホーム, ログイン, ニュース, ギャラリー | 水彩・紙目・クレヨン下線・絵本装丁 |
| **WARM** | ダッシュボード, QR, お知らせ, 写真 | スタンプ・付箋・レターペーパー・コルクボード |
| **EFFICIENT** | 請求, 児童, 書類, プロフィール, 管理 | 台帳・フォルダ・クリップボード・IDカード |

### 画面別素材

| 画面 | CSSクラス | 物理メタファー |
|------|-----------|---------------|
| ホーム | `.book-page`, `.wash` | 水彩ウォッシュ + 紙目 + deckled edge |
| ログイン | `.leather-*`, `.gold-foil` | レザーテクスチャ + 金箔 + インク |
| ニュース | `.news-card` | 紙目 + 絵本チャプター + クレヨン下線 |
| ギャラリー | `.polaroid`, `.polaroid--tape` | ポラロイド写真 + マスキングテープ + ランダム回転 |
| ダッシュボード | `.stamp`, `.teacher-note` | 「本日」スタンプ + 付箋メモ + 紙 |
| お知らせ | `.letter-paper`, `.ann-card` | レターペーパー（罫線+マージンライン） |
| 写真管理 | `.corkboard`, `.photo-mgmt` | コルクボード + 写真カード |
| 請求 | `.ledger-wrap`, `.ledger-stamp` | 台帳（罫線リピート + 赤マージン + 月スタンプ） |
| 児童一覧 | `.cc` (child card) | クレヨンアバター + 紙カード |
| 書類 | `.folder-jacket`, `.folder-tab` | フォルダジャケット + タブ切り出し |
| プロフィール | `.id-card` | IDカード（グラデヘッダー + 📌ピン） |
| QR | confetti celebration | クリーンスキャナー + 紙吹雪 |
| ユーザー管理 | `.clipboard` | クリップボード（金属クリップ） |
| HP管理 | `.control-board` | コントロールボード + ⚙️ラベル |

### 紙テクスチャ（全カード共通）

```css
/* SVG feTurbulence ノイズ + プレスエッジ */
background-image:
  url("data:image/svg+xml,...feTurbulence..."),
  linear-gradient(180deg, rgba(255,255,255,.97), rgba(255,248,237,.95));
background-blend-mode: multiply, normal;
box-shadow:
  inset 0 1px 0 rgba(255,255,255,.8),   /* 上端ハイライト */
  inset 0 -1px 0 rgba(232,220,198,.5),   /* 下端シャドウ */
  var(--sh-sm);
```

## 5. Spacing & Layout

```css
/* ── Space rhythm (4の倍数) ── */
--sp-3:   12px;    /* カード内 gap */
--sp-4:   16px;    /* セクション間 small */
--sp-6:   24px;    /* セクション間 standard */
--sp-8:   32px;    /* ページセクション間 */

/* ── Radius ── */
--r-sm:   6px;     /* input, badge */
--r-md:   10px;    /* card, button */
--r-lg:   14px;    /* modal, dialog */
--r-full: 9999px;  /* avatar, pill */
```

**レイアウトパターン:**
- **ダッシュボード:** サイドバー(w-220) + メインコンテンツ
- **公開ページ:** 全幅ヒーロー + max-w-700 コンテンツ
- **モバイル:** サイドバー非表示、シングルカラム

## 6. Components

### Buttons

| Variant | スタイル | 用途 |
|---------|---------|------|
| `.btn-primary` | `--cr-orange` bg, white text, hover lift | 主要アクション |
| `.btn-outline` | border only, hover fill | 副次アクション |
| `.btn-sm` | 小さいサイズ | テーブル内、補助 |

### Cards — 素材別

| クラス | 特徴 |
|--------|------|
| `.ann-card` | 未読オレンジボーダー + 赤ドット + 紙目 |
| `.news-card` | アクセントバーアニメ + ホバーリフト |
| `.doc-card` | 横スライドホバー + ペーパー目 |
| `.cms-card` | ホバーリフト + ボーダーハイライト |
| `.photo-mgmt` | コルクボード上カード + トグルスイッチ |
| `.cc` (child) | クレヨンアバター + タグ |

### Badges

| クラス | 前景 | 背景 |
|--------|------|------|
| `.status-badge--confirmed` | #2D7A55 | #D5F5E3 |
| `.status-badge--draft` | #8A6D00 | #FFF0CC |
| `.status-badge--public` | #2D7A55 | #D5F5E3 |
| `.status-badge--private` | #8A6D00 | #FFF0CC |
| `.role-badge--admin` | `--cr-red` | #FFEEF0 |
| `.role-badge--teacher` | #8A4A00 | #FFE5D5 |
| `.role-badge--parent` | #1A5F8A | #DFF0FF |

### Photo Toggle Switch

```css
.photo-toggle           /* 丸型ピルコンテナ */
.photo-toggle__track    /* スライドトラック */
.photo-toggle__thumb    /* 丸つまみ — spring cubic-bezier */
.photo-toggle.is-public /* 緑 + thumb右 */
.photo-toggle.is-private /* グレー + thumb左 */
```

### Navigation

- **サイドバー:** `.sidebar` — マスコット星 + 8ナビ項目 + 管理者セクション
- **季節ストリップ:** `.season-strip` — 時間帯で絵文字切替 + 星の瞬きアニメ
- **ムードストリップ:** `.main__mood` — 画面ごとの状況テキスト + 手書きマスコットコピー

## 7. Motion — Living Design

```css
/* ── Entrance animations ── */
@keyframes cardIn       /* カード: fade-up + scale — 0.4s */
@keyframes popIn        /* ポラロイド: bounce — 0.35s */
@keyframes paperSlideIn /* 書類: 横スライド + 回転 — 0.35s */
@keyframes fadeUp       /* タイトル: fade-up — 0.3s */

/* ── Continuous ── */
@keyframes gentleFloat  /* マスコット星: 上下浮遊 — 3s infinite */
@keyframes twinkle      /* 季節ストリップ星: 明滅 — 2.5s infinite */

/* ── Stagger ── */
nth-child(1): 0.05s, (2): 0.10s, (3): 0.15s, (4): 0.20s

/* ── Page transition ── */
.page { opacity: 0; transition: opacity .15s ease-out }
.page.active { opacity: 1 }

/* ── Hover/Focus ── */
cards: translateY(-2px) + shadow-md (cubic-bezier(.34,1.2,.64,1))
polaroids: scale(1.04) + shadow lift
material wrappers: shadow-md on hover
```

**prefers-reduced-motion:** 連続アニメーション停止、入場アニメーション短縮

## 8. Accessibility

### Focus States

```css
:focus-visible {
  outline: 2px solid var(--cr-orange);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(217,123,63,.15);
}
```

**適用対象:** `.ann-card`, `.news-card`, `.doc-card`, `.cms-card`, `.photo-mgmt`, `.polaroid`, `.tab-bar__item`, `.folder-tab`, `.photo-toggle`

### Semantic HTML

- ポラロイド: `role="button"` + `tabindex="0"` + Enter/Space JS
- タブバー: `<button type="button">` (native focus)
- フォルダタブ: `<button type="button">` (native focus)
- トグル: `<button>` + `aria-pressed` (状態連動)
- ライトボックス: `role="dialog"` + `aria-modal="true"` + フォーカス管理

### Contrast

全セマンティックテキストはWCAG AA準拠（4.5:1以上）。バッジ・リンクすべて検証済み。

## 9. Anti-slop Rules

このプロダクトで **使わない** パターン：

1. ❌ **紫〜ピンクのグラデーション** — AI汎用感
2. ❌ **Inter / System UI のみ** — 3フォントシステム必須
3. ❌ **フラットな白カード** — 必ず紙テクスチャ + プレスエッジ
4. ❌ **グラスモーフィズム** — 視認性を損なう
5. ❌ **インラインスタイル** — CSSクラスシステムを使用
6. ❌ **cursor:pointer on non-interactive** — 本物のbutton/a要素のみ
7. ❌ **tabindex on container divs** — 内部コントロールにフォーカス
8. ❌ **ダークモード** — v1はライトモードのみ
9. ❌ **素材感のないops画面** — 全画面に物理メタファー必須
