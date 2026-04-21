import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth/get-user";
import { Button } from "@/components/ui";
import {
  getDashboardAttendanceStatus,
  type DashboardChildStatus,
} from "../actions";

import { formatTimeJST } from "@/lib/time/jst";

function formatTime(iso: string): string {
  return formatTimeJST(iso);
}

const statusOrder: Record<DashboardChildStatus["status"], number> = {
  entered: 0,
  none: 1,
  exited: 2,
};

const statusConfig = {
  none: { label: "未入室", variant: "default" as const },
  entered: { label: "入室中", variant: "enter" as const },
  exited: { label: "退室済", variant: "exit" as const },
} as const;

export default async function AttendanceDashboardPage() {
  const user = await getUser();
  if (user.role !== "admin" && user.role !== "teacher") redirect("/");

  const children = await getDashboardAttendanceStatus();

  const total = children.length;
  const entered = children.filter((c) => c.status === "entered").length;
  const exited = children.filter((c) => c.status === "exited").length;
  const none = children.filter((c) => c.status === "none").length;

  const enteredChildren = children.filter((c) => c.status === "entered");
  const exitedChildren = children.filter((c) => c.status === "exited");
  const noneChildren = children.filter((c) => c.status === "none");

  const today = new Date();
  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日（${dayNames[today.getDay()]}）`;

  async function handleRefresh() {
    "use server";
    revalidatePath("/attendance/dashboard");
  }

  const statusTagConfig = {
    entered: { icon: "⭐", label: "入室中", tagClass: "tag-present", avClass: "att-av--in" },
    exited: { icon: "→", label: "退室済", tagClass: "tag-left", avClass: "att-av--left" },
    none: { icon: "☆", label: "未入室", tagClass: "tag-absent", avClass: "att-av--no" },
  } as const;

  function renderAttRow(child: DashboardChildStatus) {
    const cfg = statusTagConfig[child.status];
    return (
      <div key={child.childId} className="att-row" role="listitem">
        <div className={`att-av ${cfg.avClass}`}>{child.name.charAt(0)}</div>
        <span className="att-name">{child.name}</span>
        <span className="att-grade">{child.grade}年</span>
        <span className="att-status">
          <span className={`tag ${cfg.tagClass}`}>{cfg.icon} {cfg.label}</span>
        </span>
        <span className="att-time">
          {child.status === "entered" && child.enterTime && formatTime(child.enterTime)}
          {child.status === "exited" && (
            <>
              {child.enterTime && formatTime(child.enterTime)}
              {child.enterTime && child.exitTime && " → "}
              {child.exitTime && formatTime(child.exitTime)}
            </>
          )}
          {child.status === "none" && "—"}
        </span>
      </div>
    );
  }

  return (
    <div>
      <div className="main__hdr">
        <div>
          <h1 className="main__title">📖 きょうの ようす</h1>
          <p className="main__date">{dateStr}</p>
        </div>
        <form action={handleRefresh}>
          <Button type="submit" variant="secondary" size="sm">🔄 更新</Button>
        </form>
      </div>

      {/* Summary strip with 星ちゃん */}
      <div className="summary-strip">
        <div className="summary-strip__hoshi">
          <svg width="24" height="28" viewBox="0 0 32 38" aria-hidden>
            <path d="M16 2l3.5 10.5H30l-8.5 6.5 3.2 10L16 22.5 7.3 29l3.2-10L2 12.5h10.5z" fill="#FFD93D" stroke="#E8B830" strokeWidth="1.5"/>
            <circle cx="12" cy="14" r="1.5" fill="#3B2F20"/><circle cx="20" cy="14" r="1.5" fill="#3B2F20"/>
            <circle cx="9" cy="17" r="2" fill="#FFB5C5" opacity=".55"/><circle cx="23" cy="17" r="2" fill="#FFB5C5" opacity=".55"/>
            <path d="M13 18 Q16 21 19 18" fill="none" stroke="#3B2F20" strokeWidth="1" strokeLinecap="round"/>
          </svg>
          <div>
            <span className="summary-strip__date">{dateStr}</span>
            <span className="summary-strip__greeting">みんな おかえりなさい ⭐</span>
          </div>
        </div>
        <div className="summary-strip__stats">
          <div className="summary-strip__stat">
            <span className="ss-icon">🏠</span>
            <span className="ss-num ss-num--in">{entered}</span>
            <span className="ss-label"><strong>入室中</strong></span>
          </div>
          <div className="summary-strip__stat">
            <span className="ss-icon">👋</span>
            <span className="ss-num ss-num--left">{exited}</span>
            <span className="ss-label"><strong>退室済</strong></span>
          </div>
          <div className="summary-strip__stat">
            <span className="ss-icon">💤</span>
            <span className="ss-num ss-num--out">{none}</span>
            <span className="ss-label"><strong>未入室</strong></span>
          </div>
        </div>
        {entered === total && total > 0 && (
          <div className="ss-complete-msg">⭐ みんな あつまったよ！</div>
        )}
      </div>

      {/* Teacher note */}
      <div className="teacher-note" style={{ marginTop: "-6px", position: "relative", zIndex: 0 }}>
        <span className="teacher-note__icon">✏️</span>
        <div>
          <div className="teacher-note__text"><em>きょうも みんな げんきに すごそうね ⭐</em></div>
        </div>
      </div>

      {/* Filter pills */}
      <div className="filters">
        <span className="fpill active">すべて<span className="fpill__c">({total})</span></span>
        <span className="fpill">⭐ 入室中<span className="fpill__c">({entered})</span></span>
        <span className="fpill">👋 退室済<span className="fpill__c">({exited})</span></span>
        <span className="fpill">☆ 未入室<span className="fpill__c">({none})</span></span>
      </div>

      {/* Attendance grouped by status */}
      {children.length === 0 ? (
        <p className="text-ink-mid text-center py-8">児童が登録されていません</p>
      ) : (
        <div role="list">
          {enteredChildren.length > 0 && (
            <>
              <div className="grade-div">
                <div className="grade-div__label">🏠 入室中 <span className="grade-div__count">（{enteredChildren.length}名）</span></div>
                <div className="grade-div__line" />
              </div>
              <div className="att-card">{enteredChildren.map(renderAttRow)}</div>
            </>
          )}
          {exitedChildren.length > 0 && (
            <>
              <div className="grade-div">
                <div className="grade-div__label">👋 退室済 <span className="grade-div__count">（{exitedChildren.length}名）</span></div>
                <div className="grade-div__line" />
              </div>
              <div className="att-card">{exitedChildren.map(renderAttRow)}</div>
            </>
          )}
          {noneChildren.length > 0 && (
            <>
              <div className="grade-div">
                <div className="grade-div__label">💤 未入室 <span className="grade-div__count">（{noneChildren.length}名）</span></div>
                <div className="grade-div__line" />
              </div>
              <div className="att-card">{noneChildren.map(renderAttRow)}</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
