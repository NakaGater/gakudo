import type { SlugPageProps } from "./page-props";

export function EnrollmentPage({ title, content, metadata }: SlugPageProps) {
  const subtitle = (metadata?.subtitle as string) || "お子さまの放課後を、安心して過ごせる場所に。";
  const eligibility = (metadata?.eligibility as { target: string; capacity: string }) || {
    target: "小学1〜6年生",
    capacity: "約40名",
  };
  const hours = (metadata?.hours as Array<{ label: string; time: string }>) || [];
  const fees = (metadata?.fees as Array<{ label: string; amount: string; note: string }>) || [];
  const siblingFees =
    (metadata?.sibling_fees as Array<{ label: string; amount: string; note: string }>) || [];
  const steps =
    (metadata?.steps as Array<{ emoji: string; title: string; description: string }>) || [];
  const documents = (metadata?.documents as string[]) || [];
  const notes = (metadata?.notes as string[]) || [];

  return (
    <>
      <section style={{ padding: "32px 24px 0" }}>
        <div className="mx-auto max-w-4xl text-center">
          <div className="font-hand text-xs text-cr-orange mb-2">📖 だい４しょう</div>
          <h1 className="font-story font-black text-ink ink-bleed" style={{ fontSize: "28px" }}>
            <span className="crayon-underline">{title}</span>
          </h1>
          <p className="mt-3 text-sm text-ink-mid">{subtitle}</p>
          {content && (
            <p className="mt-2 text-sm text-ink-mid leading-relaxed max-w-2xl mx-auto">{content}</p>
          )}
        </div>
      </section>

      <section style={{ padding: "24px 24px" }}>
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-wrap gap-4 justify-center">
            <div className="rounded-xl border-2 border-page-edge p-5 bg-page shadow-[2px_2px_0_var(--page-edge)] text-center min-w-[160px]">
              <p className="text-3xl mb-2">🎒</p>
              <p className="text-xs text-ink-mid font-bold">対象</p>
              <p className="font-story font-bold text-ink text-sm mt-1">{eligibility.target}</p>
            </div>
            <div className="rounded-xl border-2 border-page-edge p-5 bg-page shadow-[2px_2px_0_var(--page-edge)] text-center min-w-[160px]">
              <p className="text-3xl mb-2">👫</p>
              <p className="text-xs text-ink-mid font-bold">定員</p>
              <p className="font-story font-bold text-ink text-sm mt-1">{eligibility.capacity}</p>
            </div>
          </div>
        </div>
      </section>

      {hours.length > 0 && (
        <section style={{ padding: "24px 24px" }}>
          <div className="mx-auto max-w-4xl">
            <h2
              className="font-story font-black text-ink text-center mb-6"
              style={{ fontSize: "20px" }}
            >
              <span className="crayon-underline">🕐 開所時間</span>
            </h2>
            <div className="mx-auto max-w-md">
              <div className="rounded-xl border-2 border-page-edge overflow-hidden">
                {hours.map((h, i) => (
                  <div
                    key={h.label}
                    className={`flex justify-between px-5 py-3 ${i % 2 === 0 ? "bg-page" : "bg-page-deep"}`}
                  >
                    <span className="font-story font-bold text-ink text-sm">{h.label}</span>
                    <span className="text-sm text-ink-mid">{h.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {fees.length > 0 && (
        <section
          style={{
            padding: "24px 24px",
            background: "linear-gradient(180deg, transparent, rgba(255,217,61,.03), transparent)",
          }}
        >
          <div className="mx-auto max-w-4xl">
            <h2
              className="font-story font-black text-ink text-center mb-6"
              style={{ fontSize: "20px" }}
            >
              <span className="crayon-underline">💰 料金（学年別）</span>
            </h2>
            <div className="mx-auto max-w-md">
              <div className="rounded-xl border-2 border-page-edge overflow-hidden">
                {fees.map((f, i) => (
                  <div
                    key={f.label}
                    className={`flex items-center justify-between px-5 py-3 ${i % 2 === 0 ? "bg-page" : "bg-page-deep"}`}
                  >
                    <div>
                      <span className="font-story font-bold text-ink text-sm">{f.label}</span>
                      {f.note && (
                        <span className="text-[10px] text-ink-light ml-2">({f.note})</span>
                      )}
                    </div>
                    <span className="font-story font-black text-cr-orange text-base">
                      {f.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {siblingFees.length > 0 && (
              <div className="mt-4">
                <h3 className="font-story font-bold text-ink text-center text-sm mb-3">
                  👨‍👩‍👧‍👦 兄弟割引料金
                </h3>
                <div className="mx-auto max-w-md">
                  <div className="rounded-xl border-2 border-dashed border-cr-green overflow-hidden">
                    {siblingFees.map((f, i) => (
                      <div
                        key={f.label}
                        className={`flex items-center justify-between px-5 py-3 ${i % 2 === 0 ? "bg-[rgba(213,245,227,.2)]" : "bg-[rgba(213,245,227,.4)]"}`}
                      >
                        <div>
                          <span className="font-story font-bold text-ink text-sm">{f.label}</span>
                          {f.note && (
                            <span className="text-[10px] text-ink-light ml-2">({f.note})</span>
                          )}
                        </div>
                        <span className="font-story font-black text-cr-green text-base">
                          {f.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {steps.length > 0 && (
        <section style={{ padding: "24px 24px" }}>
          <div className="mx-auto max-w-4xl">
            <h2
              className="font-story font-black text-ink text-center mb-6"
              style={{ fontSize: "20px" }}
            >
              <span className="crayon-underline">📋 入所の流れ</span>
            </h2>
            <div className="flex flex-col gap-4 max-w-lg mx-auto">
              {steps.map((s, i) => (
                <div key={s.title} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-star border-2 border-star-gold text-xl">
                      {s.emoji}
                    </div>
                    {i < steps.length - 1 && <div className="w-0.5 h-6 bg-page-edge mt-1" />}
                  </div>
                  <div className="pt-1">
                    <h3 className="font-story font-bold text-ink text-sm">
                      STEP {i + 1}. {s.title}
                    </h3>
                    <p className="text-xs text-ink-mid mt-1 leading-relaxed">{s.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {documents.length > 0 && (
        <section style={{ padding: "24px 24px" }}>
          <div className="mx-auto max-w-4xl">
            <h2
              className="font-story font-black text-ink text-center mb-4"
              style={{ fontSize: "20px" }}
            >
              <span className="crayon-underline">📄 必要書類</span>
            </h2>
            <ul className="mx-auto max-w-md space-y-2">
              {documents.map((doc) => (
                <li key={doc} className="flex items-center gap-2 text-sm text-ink">
                  <span className="text-cr-orange">✔</span>
                  <span className="font-story">{doc}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {notes.length > 0 && (
        <section style={{ padding: "24px 24px 32px" }}>
          <div className="mx-auto max-w-4xl">
            <div className="rounded-xl border-2 border-dashed border-cr-yellow bg-[rgba(255,248,197,.3)] p-5">
              <h3 className="font-story font-bold text-ink text-sm mb-3">⚠️ ご注意</h3>
              <ul className="space-y-1.5">
                {notes.map((note) => (
                  <li
                    key={note}
                    className="text-xs text-ink-mid leading-relaxed flex items-start gap-2"
                  >
                    <span className="text-cr-orange mt-0.5">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
