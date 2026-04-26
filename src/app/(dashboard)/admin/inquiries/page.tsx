import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { isStaff } from "@/lib/auth/roles";
import { getInquiries } from "./actions";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "未対応", color: "bg-cr-yellow/20 text-cr-orange border-cr-yellow" },
  approved: { label: "承認済み", color: "bg-cr-green/10 text-cr-green border-cr-green/30" },
  declined: { label: "お断り", color: "bg-cr-red/10 text-cr-red border-cr-red/30" },
  replied: { label: "返信済み", color: "bg-cr-blue/10 text-cr-blue border-cr-blue/30" },
};

const TYPE_LABELS: Record<string, string> = {
  visit: "🏫 見学予約",
  general: "💬 問い合わせ",
};

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const user = await getUser();
  if (!isStaff(user.role)) redirect("/");

  const params = await searchParams;
  const statusFilter = params.status ?? "all";
  const page = Math.max(1, Number(params.page) || 1);
  const { rows: inquiries, totalPages, total } = await getInquiries(statusFilter, page);
  const buildLink = (statusKey: string, pageNum: number) => {
    const sp = new URLSearchParams();
    if (statusKey !== "all") sp.set("status", statusKey);
    if (pageNum > 1) sp.set("page", String(pageNum));
    const qs = sp.toString();
    return qs ? `/admin/inquiries?${qs}` : "/admin/inquiries";
  };

  const filters = [
    { key: "all", label: "すべて" },
    { key: "pending", label: "未対応" },
    { key: "approved", label: "承認済み" },
    { key: "declined", label: "お断り" },
    { key: "replied", label: "返信済み" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-fg mb-6">お問い合わせ管理</h1>

      {/* フィルタ */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((f) => (
          <Link
            key={f.key}
            href={buildLink(f.key, 1)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
              statusFilter === f.key
                ? "bg-accent text-white border-accent"
                : "bg-bg-elev text-fg-muted border-border hover:border-accent"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {inquiries.length === 0 ? (
        <div className="text-center py-12 text-fg-muted">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm">お問い合わせはまだありません</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-fg-muted mb-3">
            {total}件中 {(page - 1) * 50 + 1}–{Math.min(page * 50, total)}件目
          </p>
          <div className="flex flex-col gap-3">
            {inquiries.map((inq) => {
              const statusInfo = STATUS_LABELS[inq.status] ?? STATUS_LABELS.pending;
              return (
                <Link
                  key={inq.id}
                  href={`/admin/inquiries/${inq.id}`}
                  className="block rounded-lg border border-border bg-bg p-4 hover:border-accent transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs">{TYPE_LABELS[inq.type] ?? inq.type}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="font-bold text-fg text-sm truncate">{inq.name}</p>
                      <p className="text-xs text-fg-muted truncate mt-0.5">{inq.message}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-fg-muted">
                        {inq.created_at
                          ? new Date(inq.created_at).toLocaleDateString("ja-JP", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </p>
                      {inq.preferred_date && (
                        <p className="text-[10px] text-cr-orange mt-0.5">
                          希望: {inq.preferred_date}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          {totalPages > 1 && (
            <nav className="mt-6 flex justify-center gap-2 text-xs">
              {page > 1 && (
                <Link
                  href={buildLink(statusFilter, page - 1)}
                  className="px-3 py-1.5 rounded border border-border bg-bg-elev hover:border-accent"
                >
                  ← 前へ
                </Link>
              )}
              <span className="px-3 py-1.5 text-fg-muted">
                {page} / {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={buildLink(statusFilter, page + 1)}
                  className="px-3 py-1.5 rounded border border-border bg-bg-elev hover:border-accent"
                >
                  次へ →
                </Link>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
