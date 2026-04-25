import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui";
import { getUser } from "@/lib/auth/get-user";
import { formatTimeJST } from "@/lib/time/jst";
import { getParentAttendanceStatus } from "../actions";

export default async function ParentAttendanceStatusPage() {
  const user = await getUser();
  if (user.role !== "parent") redirect("/attendance/dashboard");

  const { myChildren, summary } = await getParentAttendanceStatus();

  const today = new Date();
  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日（${dayNames[today.getDay()]}）`;

  async function handleRefresh() {
    "use server";
    revalidatePath("/attendance/status");
  }

  const statusConfig = {
    entered: { icon: "⭐", label: "入室中", tagClass: "tag-present", avClass: "att-av--in" },
    exited: { icon: "→", label: "退室済", tagClass: "tag-left", avClass: "att-av--left" },
    none: { icon: "☆", label: "未入室", tagClass: "tag-absent", avClass: "att-av--no" },
  } as const;

  return (
    <div>
      <div className="main__hdr">
        <div>
          <h1 className="main__title">📖 きょうの ようす</h1>
          <p className="main__date">{dateStr}</p>
        </div>
        <form action={handleRefresh}>
          <Button type="submit" variant="secondary" size="sm">
            🔄 更新
          </Button>
        </form>
      </div>

      {/* 全体サマリー（匿名） */}
      <div className="summary-strip">
        <div className="summary-strip__hoshi">
          <svg width="24" height="28" viewBox="0 0 32 38" aria-hidden>
            <path
              d="M16 2l3.5 10.5H30l-8.5 6.5 3.2 10L16 22.5 7.3 29l3.2-10L2 12.5h10.5z"
              fill="#FFD93D"
              stroke="#E8B830"
              strokeWidth="1.5"
            />
            <circle cx="12" cy="14" r="1.5" fill="#3B2F20" />
            <circle cx="20" cy="14" r="1.5" fill="#3B2F20" />
            <circle cx="9" cy="17" r="2" fill="#FFB5C5" opacity=".55" />
            <circle cx="23" cy="17" r="2" fill="#FFB5C5" opacity=".55" />
            <path
              d="M13 18 Q16 21 19 18"
              fill="none"
              stroke="#3B2F20"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </svg>
          <div>
            <span className="summary-strip__date">{dateStr}</span>
            <span className="summary-strip__greeting">学童のようすです ⭐</span>
          </div>
        </div>
        <div className="summary-strip__stats">
          <div className="summary-strip__stat">
            <span className="ss-icon">🏠</span>
            <span className="ss-num ss-num--in">{summary.entered}</span>
            <span className="ss-label">
              <strong>入室中</strong>
            </span>
          </div>
          <div className="summary-strip__stat">
            <span className="ss-icon">👋</span>
            <span className="ss-num ss-num--left">{summary.exited}</span>
            <span className="ss-label">
              <strong>退室済</strong>
            </span>
          </div>
          <div className="summary-strip__stat">
            <span className="ss-icon">💤</span>
            <span className="ss-num ss-num--out">{summary.none}</span>
            <span className="ss-label">
              <strong>未入室</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 自分の子ども */}
      <div className="teacher-note" style={{ marginTop: "-6px", position: "relative", zIndex: 0 }}>
        <span className="teacher-note__icon">👧</span>
        <div>
          <div className="teacher-note__text">
            <em>お子さまの入室状況</em>
          </div>
        </div>
      </div>

      {myChildren.length === 0 ? (
        <p className="text-ink-mid text-center py-8">登録されているお子さまがいません</p>
      ) : (
        <div className="att-card" role="list">
          {myChildren.map((child) => {
            const cfg = statusConfig[child.status];
            return (
              <div key={child.childId} className="att-row" role="listitem">
                <div className={`att-av ${cfg.avClass}`}>{child.name.charAt(0)}</div>
                <span className="att-name">{child.name}</span>
                <span className="att-grade">{child.grade}年</span>
                <span className="att-status">
                  <span className={`tag ${cfg.tagClass}`}>
                    {cfg.icon} {cfg.label}
                  </span>
                </span>
                <span className="att-time">
                  {child.status === "entered" && child.enterTime && formatTimeJST(child.enterTime)}
                  {child.status === "exited" && (
                    <>
                      {child.enterTime && formatTimeJST(child.enterTime)}
                      {child.enterTime && child.exitTime && " → "}
                      {child.exitTime && formatTimeJST(child.exitTime)}
                    </>
                  )}
                  {child.status === "none" && "—"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
