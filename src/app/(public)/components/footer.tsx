import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative text-white/55" style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='f'%3E%3CfeTurbulence baseFrequency='0.5' numOctaves='3'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)' opacity='.06'/%3E%3C/svg%3E"), linear-gradient(180deg, #3B2F20 0%, #2A2018 100%)`
    }}>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-10">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
          {/* Facility info */}
          <div>
            <h3 className="mb-1.5 text-[13px] font-bold font-story text-white">
              星ヶ丘こどもクラブ
            </h3>
            <p className="text-[11px] leading-[1.8]">
              保護者の手で運営する、地域に根ざした学童保育施設です。
              <br />
              子どもたちの「ただいま」が聞こえる、あたたかい居場所。
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="mb-1.5 text-[13px] font-bold font-story text-white">
              リンク
            </h3>
            <ul className="space-y-0.5 text-[11px]">
              <li><Link href="/" className="transition-colors hover:text-cr-yellow no-underline">ホーム</Link></li>
              <li><Link href="/about" className="transition-colors hover:text-cr-yellow no-underline">施設紹介</Link></li>
              <li><Link href="/daily-life" className="transition-colors hover:text-cr-yellow no-underline">日々の生活</Link></li>
              <li><Link href="/enrollment" className="transition-colors hover:text-cr-yellow no-underline">入所案内</Link></li>
              <li><Link href="/faq" className="transition-colors hover:text-cr-yellow no-underline">Q&A</Link></li>
              <li><Link href="/login" className="transition-colors hover:text-cr-yellow no-underline">保護者ログイン</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-1.5 text-[13px] font-bold font-story text-white">
              お問い合わせ
            </h3>
            <address className="text-[11px] not-italic leading-[1.8]">
              <p>〒464-0021</p>
              <p>名古屋市千種区星が丘1-5</p>
              <p>アーバンラフレ集会所内</p>
            </address>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-4 border-t border-white/[.06] pt-3.5 text-center text-[10px] text-white/20">
          © 2025 星ヶ丘こどもクラブ
        </div>
      </div>
      {/* Cat mascot */}
      <span className="absolute bottom-3 right-6 text-xl opacity-40 -rotate-[8deg]" aria-hidden="true">😺</span>
    </footer>
  );
}
