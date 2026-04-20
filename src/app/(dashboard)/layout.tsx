import { getUser } from "@/lib/auth/get-user";
import { Sidebar } from "@/components/nav/sidebar";
import { MobileTabs } from "@/components/nav/mobile-tabs";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Auth gate — redirects to /login if no valid session
  const user = await getUser();

  return (
    <div data-user-role={user.role} className="min-h-screen">
      <Sidebar user={user} />
      <main className="md:pl-64 pb-16 md:pb-0 min-h-screen">
        {children}
      </main>
      <MobileTabs user={user} />
    </div>
  );
}
