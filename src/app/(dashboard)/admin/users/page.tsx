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
    <div className="p-6 max-w-4xl mx-auto clipboard">
      <UsersClient users={users} currentUserId={user.id} />
    </div>
  );
}
