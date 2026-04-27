import Link from "next/link";
import { FaqAccordion } from "@/app/(public)/components/faq-accordion";
import type { SlugPageProps } from "./page-props";

export function FaqPage({ title, content, metadata }: SlugPageProps) {
  const subtitle = (metadata?.subtitle as string) || "はじめての方もご安心ください。";
  const questions = (metadata?.questions as Array<{ q: string; a: string }>) || [];

  return (
    <>
      <section style={{ padding: "32px 24px 0" }}>
        <div className="mx-auto max-w-4xl text-center">
          <div className="font-hand text-xs text-cr-orange mb-2">📖 だい５しょう</div>
          <h1 className="font-story font-black text-ink ink-bleed" style={{ fontSize: "28px" }}>
            <span className="crayon-underline">{title}</span>
          </h1>
          <p className="mt-3 text-sm text-ink-mid">{subtitle}</p>
          {content && (
            <p className="mt-2 text-sm text-ink-mid leading-relaxed max-w-2xl mx-auto">{content}</p>
          )}
        </div>
      </section>

      <section style={{ padding: "24px 24px 40px" }}>
        <div className="mx-auto max-w-3xl">
          {questions.length > 0 ? (
            <FaqAccordion questions={questions} />
          ) : (
            <p className="text-center text-ink-mid text-sm">質問はまだ登録されていません。</p>
          )}
        </div>
      </section>

      <section style={{ padding: "0 24px 40px" }}>
        <div className="mx-auto max-w-3xl text-center">
          <div className="rounded-xl bg-page-deep border-2 border-page-edge p-6 shadow-[2px_2px_0_var(--page-edge)]">
            <p className="text-sm text-ink font-story font-bold mb-2">💬 その他のご質問は</p>
            <p className="text-xs text-ink-mid leading-relaxed">
              お気軽に
              <Link
                href="/?inquiry=general#inquiry"
                className="text-cr-orange font-bold hover:underline"
              >
                お問い合わせフォーム
              </Link>
              からご連絡ください。
              <br />
              見学のお申し込みも随時受け付けております。
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
