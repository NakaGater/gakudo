import Link from "next/link";

/**
 * Not-found UI for any `notFound()` call inside the (public) route group.
 *
 * Lives alongside `app/not-found.tsx`; this one is the closer boundary so
 * Next.js picks it first when notFound() is invoked from
 * `(public)/[slug]/page.tsx`. Without a not-found.tsx inside the (public)
 * group, Next 16 in our setup leaves the layout's `{children}` slot empty
 * (header + footer still render but the middle is blank), which is both a
 * UX regression and the cause of flow10's content assertion failing.
 */
export default function PublicNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <p className="font-story text-6xl font-black text-cr-orange ink-bleed">404</p>
      <h1 className="mt-4 font-story text-2xl font-bold text-ink">ページが見つかりません</h1>
      <p className="mt-3 text-sm text-ink-mid leading-relaxed">
        お探しのページは移動または削除された可能性があります。
        <br />
        URL をお確かめのうえ、もう一度お試しください。
      </p>
      <div className="mt-8">
        <Link
          href="/"
          className="inline-flex items-center rounded-[10px] bg-cr-orange border-2 border-[#B5663A] shadow-[0_3px_0_#B5663A] px-5 py-2 text-sm font-bold font-story text-white leading-none transition-all hover:-translate-y-px hover:shadow-[0_4px_0_#B5663A] active:translate-y-px active:shadow-[0_1px_0_#B5663A]"
        >
          ホームに戻る
        </Link>
      </div>
    </div>
  );
}
