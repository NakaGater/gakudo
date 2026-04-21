import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#3B2F20] text-[#C8B8A0]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Facility info */}
          <div>
            <h3 className="mb-3 text-sm font-bold font-story tracking-wide text-[#FDF6E3]">
              ⭐ 星ヶ丘こどもクラブ
            </h3>
            <p className="text-sm leading-relaxed">
              保護者の手で運営する、地域に根ざした学童保育施設です。
              <br />
              子どもたちの「ただいま」が聞こえる、あたたかい居場所をこれからも守り続けます。
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="mb-3 text-sm font-bold font-story tracking-wide text-[#FDF6E3]">
              リンク
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="transition-colors hover:text-[#FFD93D]">
                  ホーム
                </Link>
              </li>
              <li>
                <Link href="/about" className="transition-colors hover:text-[#FFD93D]">
                  施設紹介
                </Link>
              </li>
              <li>
                <Link href="/news" className="transition-colors hover:text-[#FFD93D]">
                  お知らせ
                </Link>
              </li>
              <li>
                <Link href="/access" className="transition-colors hover:text-[#FFD93D]">
                  アクセス
                </Link>
              </li>
              <li>
                <Link href="/login" className="transition-colors hover:text-[#FFD93D]">
                  保護者ログイン
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-3 text-sm font-bold font-story tracking-wide text-[#FDF6E3]">
              お問い合わせ
            </h3>
            <address className="space-y-1 text-sm not-italic leading-relaxed">
              <p>〒123-4567</p>
              <p>東京都世田谷区桜丘3-12-8</p>
              <p>TEL: 03-1234-5678</p>
              <p>受付: 平日 9:00〜18:00</p>
            </address>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-10 border-t border-[#5A4A38] pt-6 text-center text-xs text-[#7D6D5A]">
          © 2025 星ヶ丘こどもクラブ. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
