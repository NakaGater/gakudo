import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { UsersClient } from "./users-client";

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
    <div className="clipboard">
      <div className="main__hdr">
        <h1 className="main__title font-story">👥 ユーザー管理</h1>
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-3 mb-6">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-ink">{users.length} ユーザー</span>
        <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-ink">{users.filter(u => u.role === "admin").length} 管理者</span>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-ink">{users.filter(u => u.role === "teacher").length} 先生</span>
        <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-ink">{users.filter(u => u.role === "parent").length} 保護者</span>
      </div>

      <UsersClient users={users} currentUserId={user.id} />
    </div>
  );
}
