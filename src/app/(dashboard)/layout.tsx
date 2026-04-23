import { getUser } from "@/lib/auth/get-user";
import { isStaff } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/nav/sidebar";
import { MobileTabs } from "@/components/nav/mobile-tabs";
import { PushPrompt } from "@/components/push/push-prompt";

function getSeasonClass(): string {
  const h = new Date().getHours();
  if (h >= 6 && h < 11) return "season--morning";
  if (h >= 11 && h < 16) return "season--afternoon";
  if (h >= 16 && h < 19) return "season--evening";
  return "season--night";
}

function getMoodMessage(): { icon: string; text: string } {
  const h = new Date().getHours();
  if (h >= 6 && h < 11) return { icon: "🌅", text: "おはよう！ きょうも たのしもう ⭐" };
  if (h >= 11 && h < 16) return { icon: "☀️", text: "みんな おかえりなさい ⭐" };
  if (h >= 16 && h < 19) return { icon: "🌇", text: "きょうも よくがんばったね ⭐" };
  return { icon: "🌙", text: "おつかれさま ⭐ また あした！" };
}

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUser();
  const mood = getMoodMessage();

  const supabase = await createClient();

  // Fetch pending inquiry count for staff badge
  let pendingInquiries = 0;
  if (isStaff(user.role)) {
    const { count } = await supabase
      .from("inquiries")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    pendingInquiries = count ?? 0;
  }

  // Fetch unread announcement count for parents
  let unreadAnnouncements = 0;
  if (user.role === "parent") {
    const [totalRes, readRes] = await Promise.all([
      supabase.from("announcements").select("id", { count: "exact", head: true }),
      supabase.from("announcement_reads").select("announcement_id", { count: "exact", head: true }).eq("user_id", user.id),
    ]);
    const total = totalRes.count ?? 0;
    const read = readRes.count ?? 0;
    unreadAnnouncements = Math.max(0, total - read);
  }

  return (
    <div data-user-role={user.role} className="desk-bg min-h-screen">
      <div className="clean-page">
        <div className={`season-strip ${getSeasonClass()}`} />
        <div className="dash">
          <Sidebar user={user} pendingInquiries={pendingInquiries} unreadAnnouncements={unreadAnnouncements} />
          <div className="main">
            <div className="main__mood">
              <span>{mood.icon}</span>
              <span>{mood.text}</span>
            </div>
            <PushPrompt />
            <div className="main__content">
              {children}
            </div>
          </div>
        </div>
      </div>
      <MobileTabs user={user} pendingInquiries={pendingInquiries} unreadAnnouncements={unreadAnnouncements} />
    </div>
  );
}
