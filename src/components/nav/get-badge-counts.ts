import { isStaff } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export type BadgeCounts = {
  pendingInquiries: number;
  unreadAnnouncements: number;
};

export async function getBadgeCounts(role: string, userId: string): Promise<BadgeCounts> {
  const supabase = await createClient();
  let pendingInquiries = 0;
  let unreadAnnouncements = 0;

  if (isStaff(role)) {
    const { count } = await supabase
      .from("inquiries")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    pendingInquiries = count ?? 0;
  }

  if (role === "parent") {
    const [totalRes, readRes] = await Promise.all([
      supabase.from("announcements").select("id", { count: "exact", head: true }),
      supabase
        .from("announcement_reads")
        .select("announcement_id", { count: "exact", head: true })
        .eq("user_id", userId),
    ]);
    unreadAnnouncements = Math.max(0, (totalRes.count ?? 0) - (readRes.count ?? 0));
  }

  return { pendingInquiries, unreadAnnouncements };
}
