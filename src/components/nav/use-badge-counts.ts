"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isStaff } from "@/lib/auth/roles";

type BadgeCounts = {
  pendingInquiries: number;
  unreadAnnouncements: number;
};

export function useBadgeCounts(role: string, userId: string): BadgeCounts {
  const [counts, setCounts] = useState<BadgeCounts>({
    pendingInquiries: 0,
    unreadAnnouncements: 0,
  });

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function fetchCounts() {
      const results: BadgeCounts = { pendingInquiries: 0, unreadAnnouncements: 0 };

      if (isStaff(role)) {
        const { count } = await supabase
          .from("inquiries")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending");
        results.pendingInquiries = count ?? 0;
      }

      if (role === "parent") {
        const [totalRes, readRes] = await Promise.all([
          supabase.from("announcements").select("id", { count: "exact", head: true }),
          supabase.from("announcement_reads").select("announcement_id", { count: "exact", head: true }).eq("user_id", userId),
        ]);
        results.unreadAnnouncements = Math.max(0, (totalRes.count ?? 0) - (readRes.count ?? 0));
      }

      if (!cancelled) setCounts(results);
    }

    fetchCounts();
    return () => { cancelled = true; };
  }, [role, userId]);

  return counts;
}
