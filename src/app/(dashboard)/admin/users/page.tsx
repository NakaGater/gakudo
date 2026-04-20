import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { Badge } from "@/components/ui";
import type { BadgeVariant } from "@/components/ui";
import { UsersClient } from "./users-client";

const ROLE_LABELS: Record<string, string> = {
  admin: "管理者",
  teacher: "先生",
  parent: "保護者",
};

const ROLE_BADGE_VARIANT: Record<string, BadgeVariant> = {
  admin: "danger",
  teacher: "warning",
  parent: "default",
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default async function AdminUsersPage() {
  const user = await getUser();
  if (user.role !== "admin") redirect("/");

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profiles, error } = await (supabase.from("profiles") as any)
    .select("id, email, name, role, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-6">
        <p className="text-danger">ユーザー一覧の取得に失敗しました</p>
      </div>
    );
  }

  type Profile = {
    id: string;
    email: string;
    name: string;
    role: string;
    created_at: string;
  };

  const users = (profiles ?? []) as Profile[];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-fg">ユーザー管理</h1>
        <UsersClient />
      </div>

      <div className="rounded-md bg-bg-elev shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 font-medium text-fg-muted">名前</th>
              <th className="px-4 py-3 font-medium text-fg-muted">メールアドレス</th>
              <th className="px-4 py-3 font-medium text-fg-muted">役割</th>
              <th className="px-4 py-3 font-medium text-fg-muted">登録日</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-fg">{u.name}</td>
                <td className="px-4 py-3 text-fg-muted">{u.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={ROLE_BADGE_VARIANT[u.role] ?? "default"}>
                    {ROLE_LABELS[u.role] ?? u.role}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-fg-muted">
                  {formatDate(u.created_at)}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-fg-muted">
                  ユーザーがいません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
