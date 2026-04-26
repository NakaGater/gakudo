import Image from "next/image";
import type { SlugPageProps } from "./page-props";

export function AboutPage({ title, content, metadata }: SlugPageProps) {
  const subtitle =
    (metadata?.subtitle as string) ||
    "子どもたちが「ただいま！」と駆け込んでくる、あたたかい居場所です。";
  const visionHeading = (metadata?.vision_heading as string) || "私たちの想い";
  const visionEmoji = (metadata?.vision_emoji as string) || "🏠";
  const visionTagline = (metadata?.vision_tagline as string) || "家庭のようなあたたかさ";
  const schedule = (metadata?.schedule as Array<{
    time: string;
    label: string;
    emoji: string;
  }>) || [
    { time: "14:00", label: "入室・宿題タイム", emoji: "📝" },
    { time: "15:30", label: "おやつ", emoji: "🍪" },
    { time: "16:00", label: "自由遊び・活動", emoji: "⚽" },
    { time: "18:00", label: "お迎え・退室", emoji: "👋" },
  ];
  const facilityInfo = (metadata?.facility_info as Array<{ label: string; value: string }>) || [
    { label: "施設名", value: "星ヶ丘こどもクラブ" },
    { label: "運営形態", value: "父母運営型 学童保育" },
    { label: "対象", value: "小学1〜6年生" },
    { label: "定員", value: "約30名" },
    { label: "開所時間", value: "平日 放課後〜19:00 / 土曜・長期休暇 8:00〜19:00" },
    { label: "休所日", value: "日曜・祝日・年末年始" },
  ];
  const staffMembers =
    (metadata?.staff_members as Array<{
      name: string;
      role: string;
      photo_url: string;
      profile: string;
    }>) || [];

  return (
    <>
      <section style={{ padding: "32px 24px 0" }}>
        <div className="mx-auto max-w-4xl text-center">
          <div className="font-hand text-xs text-cr-orange mb-2">📖 だい２しょう</div>
          <h1 className="font-story font-black text-ink ink-bleed" style={{ fontSize: "28px" }}>
            <span className="crayon-underline">{title}</span>
          </h1>
          <p className="mt-3 text-sm text-ink-mid leading-relaxed max-w-2xl mx-auto">{subtitle}</p>
        </div>
      </section>

      <section style={{ padding: "24px 24px" }}>
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div>
              <h2 className="font-story font-bold text-ink text-lg mb-3">{visionHeading}</h2>
              <div className="text-sm text-ink-mid leading-relaxed whitespace-pre-wrap">
                {content}
              </div>
            </div>
            <div className="rounded-xl bg-page-deep border-2 border-page-edge p-8 text-center shadow-[4px_4px_0_var(--page-edge)]">
              <p className="text-5xl mb-3">{visionEmoji}</p>
              <p className="text-sm font-bold font-story text-cr-orange">{visionTagline}</p>
            </div>
          </div>
        </div>
      </section>

      {schedule.length > 0 && (
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
              <span className="crayon-underline">1日の流れ</span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {schedule.map((item, i) => {
                const rotations = ["-1deg", "0.8deg", "-0.5deg", "1.2deg"];
                const colors = ["#FFF8C5", "#D5F5E3", "#D6EEF8", "#FFE0E8"];
                return (
                  <div
                    key={item.time}
                    className="sticky-note p-5 text-center"
                    style={{
                      background: colors[i % 4],
                      transform: `rotate(${rotations[i % 4]})`,
                    }}
                  >
                    <p className="text-3xl mb-2">{item.emoji}</p>
                    <p className="text-sm font-bold font-story text-cr-orange">{item.time}</p>
                    <p className="text-xs text-ink-mid mt-1">{item.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {staffMembers.length > 0 && (
        <section style={{ padding: "24px 24px" }}>
          <div className="mx-auto max-w-4xl">
            <h2
              className="font-story font-black text-ink text-center mb-6"
              style={{ fontSize: "20px" }}
            >
              <span className="crayon-underline">職員紹介</span>
            </h2>
            <div className="gallery-grid grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {staffMembers.map((member, i) => {
                const tapes = [
                  "polaroid--tape",
                  "",
                  "polaroid--tape-pink",
                  "",
                  "polaroid--tape-green",
                  "",
                ];
                const tape = tapes[i % 6];
                return (
                  <div
                    key={member.name + i}
                    className={`polaroid${tape ? ` ${tape}` : ""}`}
                    style={{ position: "relative" }}
                  >
                    {member.photo_url ? (
                      <Image
                        src={member.photo_url}
                        alt={member.name}
                        width={400}
                        height={300}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="polaroid__img"
                      />
                    ) : (
                      <div className="polaroid__img flex items-center justify-center text-5xl bg-[var(--paper-warm)]">
                        👤
                      </div>
                    )}
                    <div style={{ padding: "4px 0 0" }}>
                      <p className="font-story font-bold text-ink text-sm">{member.name}</p>
                      {member.role && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-cr-orange/10 text-cr-orange">
                          {member.role}
                        </span>
                      )}
                      {member.profile && (
                        <p className="mt-1 font-hand text-[11px] text-ink-mid leading-relaxed">
                          {member.profile}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {facilityInfo.length > 0 && (
        <section style={{ padding: "24px 24px 32px" }}>
          <div className="mx-auto max-w-4xl">
            <h2
              className="font-story font-black text-ink text-center mb-6"
              style={{ fontSize: "20px" }}
            >
              <span className="crayon-underline">施設概要</span>
            </h2>
            <div className="overflow-hidden rounded-xl border-2 border-page-edge shadow-[2px_2px_0_var(--page-edge)]">
              <table className="w-full text-sm">
                <tbody>
                  {facilityInfo.map((item) => (
                    <tr key={item.label} className="border-b border-page-edge last:border-b-0">
                      <th className="bg-page-deep px-4 py-3 text-left font-bold font-story text-ink w-1/3">
                        {item.label}
                      </th>
                      <td className="px-4 py-3 text-ink-mid">{item.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
