"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Sun } from "lucide-react";

const navLinks = [
  { href: "/", label: "ホーム" },
  { href: "/about", label: "施設紹介" },
  { href: "/access", label: "アクセス" },
  { href: "/news", label: "お知らせ" },
  { href: "/gallery", label: "ギャラリー" },
] as const;

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bg/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-fg">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white">
            <Sun size={18} strokeWidth={1.75} />
          </span>
          星ヶ丘こどもクラブ
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="メインナビゲーション">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-fg-muted transition-colors hover:bg-accent-light hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="ml-2 inline-flex items-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hv"
          >
            ログイン
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-fg-muted transition-colors hover:bg-accent-light hover:text-accent md:hidden"
          aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-border bg-bg md:hidden">
          <nav className="mx-auto max-w-6xl space-y-1 px-4 py-3 sm:px-6" aria-label="モバイルメニュー">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-md px-3 py-2 text-base font-medium text-fg-muted transition-colors hover:bg-accent-light hover:text-accent"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="mt-2 block rounded-md bg-accent px-3 py-2 text-center text-base font-medium text-white transition-colors hover:bg-accent-hv"
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
