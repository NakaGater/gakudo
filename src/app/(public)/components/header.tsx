"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const navLinks = [
  { href: "/", label: "ホーム" },
  { href: "/about", label: "施設紹介" },
  { href: "/daily-life", label: "日々の生活" },
  { href: "/enrollment", label: "入所案内" },
  { href: "/faq", label: "Q&A" },
  { href: "/gallery", label: "ギャラリー" },
] as const;

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 border-b-2 border-dashed border-page-edge bg-page/95 backdrop-blur-sm z-20">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo with star mascot */}
        <Link href="/" className="flex items-center gap-2.5 font-story font-bold text-lg text-ink">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-star border-2 border-star-gold shadow-[2px_2px_0_var(--star-gold)] text-lg">
            ⭐
          </span>
          星ヶ丘こどもクラブ
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="メインナビゲーション">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-bold font-story text-ink-mid transition-colors hover:bg-page-deep hover:text-cr-orange"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="ml-1.5 inline-flex items-center rounded-[10px] bg-cr-orange border-2 border-[#B5663A] shadow-[0_3px_0_#B5663A] px-[14px] py-[6px] text-xs font-bold font-story text-white leading-none transition-all hover:-translate-y-px hover:shadow-[0_4px_0_#B5663A] active:translate-y-px active:shadow-[0_1px_0_#B5663A]"
          >
            ログイン
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg p-2 text-ink-mid transition-colors hover:bg-page-deep hover:text-cr-orange md:hidden"
          aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t-2 border-dashed border-page-edge bg-page md:hidden">
          <nav className="mx-auto max-w-6xl space-y-1 px-4 py-3 sm:px-6" aria-label="モバイルメニュー">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-lg px-3 py-2 text-base font-bold font-story text-ink-mid transition-colors hover:bg-page-deep hover:text-cr-orange"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="mt-2 block rounded-[10px] bg-cr-orange border-2 border-[#B5663A] shadow-[0_3px_0_#B5663A] px-3 py-2 text-center text-base font-bold font-story text-white transition-all hover:-translate-y-px hover:shadow-[0_4px_0_#B5663A] active:translate-y-px active:shadow-[0_1px_0_#B5663A]"
              onClick={() => setMenuOpen(false)}
            >
              ログイン
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
