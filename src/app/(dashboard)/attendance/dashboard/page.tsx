import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth/get-user";
import { Card, CardContent, Badge, Button } from "@/components/ui";
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-fg">本日の入退室状況</h1>
        <form action={handleRefresh}>
          <Button type="submit" variant="secondary" size="sm">
            更新
          </Button>
        </form>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Card>
          <CardContent>
            <p className="text-sm text-fg-muted">合計</p>
            <p className="text-2xl font-bold text-fg">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-fg-muted">入室中</p>
            <p className="text-2xl font-bold text-enter">{entered}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-fg-muted">退室済</p>
            <p className="text-2xl font-bold text-exit">{exited}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-fg-muted">未入室</p>
            <p className="text-2xl font-bold text-fg">{none}</p>
          </CardContent>
        </Card>
      </div>

      {/* Child list */}
      {sorted.length === 0 ? (
        <p className="text-fg-muted text-center py-8">
          児童が登録されていません
        </p>
      ) : (
        <ul className="divide-y divide-border" role="list">
          {sorted.map((child) => {
            const config = statusConfig[child.status];
            return (
              <li
                key={child.childId}
                className="flex items-center justify-between py-3 gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-fg font-medium truncate">
                    {child.name}
                  </span>
                  <span className="text-fg-muted text-xs shrink-0">
                    {child.grade}年
                  </span>
                  <Badge variant={config.variant}>{config.label}</Badge>
                </div>
                <div className="text-sm text-fg-muted shrink-0">
                  {child.status === "entered" && child.enterTime && (
                    <span>{formatTime(child.enterTime)}</span>
                  )}
                  {child.status === "exited" && (
                    <span>
                      {child.enterTime && formatTime(child.enterTime)}
                      {child.enterTime && child.exitTime && " → "}
                      {child.exitTime && formatTime(child.exitTime)}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
