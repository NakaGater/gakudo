import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth/get-user";
import { Button } from "@/components/ui";
import {
  getDashboardAttendanceStatus,
  type DashboardChildStatus,
} from "../actions";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });
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

  const sorted = [...children].sort(
    (a, b) => statusOrder[a.status] - statusOrder[b.status],
  );

  async function handleRefresh() {
    "use server";
    revalidatePath("/attendance/dashboard");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="main__hdr">
        <h1 className="main__title">📖 きょうの ようす</h1>
        <form action={handleRefresh}>
          <Button type="submit" variant="secondary" size="sm">
            更新
          </Button>
        </form>
      </div>

      {/* Summary strip */}
      <div className="summary-strip mb-8">
        <div className="summary-strip__stats">
          <div className="summary-strip__stat">
            <span className="text-ink-light text-sm">合計</span>
            <span className="text-lg font-bold">{total}</span>
          </div>
          <div className="summary-strip__stat">
            <span className="text-ink-light text-sm">入室中</span>
            <span className="text-lg font-bold text-enter">{entered}</span>
          </div>
          <div className="summary-strip__stat">
            <span className="text-ink-light text-sm">退室済</span>
            <span className="text-lg font-bold text-exit">{exited}</span>
          </div>
          <div className="summary-strip__stat">
            <span className="text-ink-light text-sm">未入室</span>
            <span className="text-lg font-bold">{none}</span>
          </div>
        </div>
      </div>

      {/* Child list */}
      {sorted.length === 0 ? (
        <p className="text-ink-mid text-center py-8">
          児童が登録されていません
        </p>
      ) : (
        <div className="att-card" role="list">
          {sorted.map((child) => {
            const config = statusConfig[child.status];
            const avVariant = child.status === "entered" ? "att-av--in" : child.status === "exited" ? "att-av--left" : "att-av--no";
            const tagVariant = child.status === "entered" ? "tag-present" : child.status === "exited" ? "tag-left" : "tag-absent";
            return (
              <div
                key={child.childId}
                className="att-row"
                role="listitem"
              >
                <div className={`att-av ${avVariant}`}>
                  {child.name.charAt(0)}
                </div>
                <span className="att-name truncate">
                  {child.name}
                </span>
                <span className="att-grade">
                  {child.grade}年
                </span>
                <span className="att-status">
                  <span className={`tag ${tagVariant}`}>{config.label}</span>
                </span>
                <span className="att-time">
                  {child.status === "entered" && child.enterTime && (
                    <>{formatTime(child.enterTime)}</>
                  )}
                  {child.status === "exited" && (
                    <>
                      {child.enterTime && formatTime(child.enterTime)}
                      {child.enterTime && child.exitTime && " → "}
                      {child.exitTime && formatTime(child.exitTime)}
                    </>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
