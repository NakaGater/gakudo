import { getUser } from "@/lib/auth/get-user";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Auth gate — redirects to /login if no valid session
  const user = await getUser();

  return (
    <div data-user-role={user.role} className="min-h-screen">
      {children}
    </div>
  );
}
