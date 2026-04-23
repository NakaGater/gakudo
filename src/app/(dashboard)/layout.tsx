import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getUser } from "@/lib/auth/get-user";
import { Sidebar } from "@/components/nav/sidebar";
import { MobileTabs } from "@/components/nav/mobile-tabs";
import { PushPrompt } from "@/components/push/push-prompt";

const ENTRANCE_ALLOWED_PATHS = ['/attendance', '/api/'];

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

  // Entrance role restriction (moved from middleware to avoid extra DB query)
  if (user.role === "entrance") {
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") || "";
    const allowed = ENTRANCE_ALLOWED_PATHS.some(p => pathname.startsWith(p));
    if (!allowed) {
      redirect("/attendance/dashboard");
    }
  }

  return (
    <div data-user-role={user.role} className="desk-bg min-h-screen">
      <div className="clean-page">
        <div className={`season-strip ${getSeasonClass()}`} />
        <div className="dash">
          <Sidebar user={user} />
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
      <MobileTabs user={user} />
    </div>
  );
}
