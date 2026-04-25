import type { SlugPageProps } from "./page-props";

function stableRotation(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return ((Math.abs(hash) % 31) / 10 - 1.5).toFixed(1);
}

export function DailyLifePage({ title, content, metadata }: SlugPageProps) {
  const subtitle = (metadata?.subtitle as string) || "のびのび、すくすく。放課後の「もうひとつの家」";
  const activities = (metadata?.activities as Array<{ emoji: string; title: string; description: string }>) || [];
  const events = (metadata?.events as Array<{ emoji: string; title: string; season: string }>) || [];
  const philosophyHeading = (metadata?.philosophy_heading as string) || "親と子の「共育ち」";
  const philosophyEmoji = (metadata?.philosophy_emoji as string) || "🤝";
  const philosophyText = (metadata?.philosophy_text as string) || "";

  const seasonColors: Record<string, string> = {
    "春": "#FFE0F0",
    "夏": "#D6EEF8",
    "秋": "#FFF3CD",
    "冬": "#E8F0FE",
    "通年": "#D5F5E3",
  };

  return (
    <>
      <section style={{ padding: "32px 24px 0" }}>
        <div className="mx-auto max-w-4xl text-center">
          <div className="font-hand text-xs text-cr-orange mb-2">📖 だい３しょう</div>
          <h1 className="font-story font-black text-ink ink-bleed" style={{ fontSize: "28px" }}>
            <span className="crayon-underline">{title}</span>
          </h1>
          <p className="mt-3 text-sm text-ink-mid">{subtitle}</p>
          {content && (
            <p className="mt-2 text-sm text-ink-mid leading-relaxed max-w-2xl mx-auto">{content}</p>
          )}
        </div>
      </section>

      {activities.length > 0 && (
        <section style={{ padding: "24px 24px" }}>
          <div className="mx-auto max-w-4xl">
            <h2 className="font-story font-black text-ink text-center mb-6" style={{ fontSize: "20px" }}>
              <span className="crayon-underline">毎日の活動</span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activities.map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border-2 border-page-edge p-5 bg-page shadow-[2px_2px_0_var(--page-edge)] hover:shadow-[3px_3px_0_var(--page-edge)] transition-shadow"
                >
                  <p className="text-3xl mb-2">{item.emoji}</p>
                  <h3 className="font-story font-bold text-ink text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-ink-mid leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {events.length > 0 && (
        <section style={{ padding: "24px 24px", background: "linear-gradient(180deg, transparent, rgba(255,217,61,.03), transparent)" }}>
          <div className="mx-auto max-w-4xl">
            <h2 className="font-story font-black text-ink text-center mb-6" style={{ fontSize: "20px" }}>
              <span className="crayon-underline">季節の行事</span>
            </h2>
            <div className="flex flex-wrap gap-3 justify-center">
              {events.map((item) => (
                <div
                  key={item.title}
                  className="sticky-note px-4 py-3 text-center"
                  style={{
                    background: seasonColors[item.season] || "#FFF8C5",
                    transform: `rotate(${stableRotation(item.title)}deg)`,
                    minWidth: "120px",
                  }}
                >
                  <p className="text-2xl mb-1">{item.emoji}</p>
                  <p className="text-xs font-bold font-story text-ink">{item.title}</p>
                  <p className="text-[10px] text-ink-mid mt-0.5">{item.season}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {philosophyText && (
        <section style={{ padding: "24px 24px 40px" }}>
          <div className="mx-auto max-w-3xl">
            <div className="rounded-xl bg-page-deep border-2 border-page-edge p-8 shadow-[4px_4px_0_var(--page-edge)]">
              <div className="text-center mb-4">
                <p className="text-4xl mb-2">{philosophyEmoji}</p>
                <h2 className="font-story font-black text-ink" style={{ fontSize: "20px" }}>
                  <span className="crayon-underline">{philosophyHeading}</span>
                </h2>
              </div>
              <p className="text-sm text-ink-mid leading-relaxed whitespace-pre-wrap text-center">
                {philosophyText}
              </p>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
