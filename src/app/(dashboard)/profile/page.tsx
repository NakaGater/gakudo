import { getUser } from "@/lib/auth/get-user";
import { ProfileForm } from "./profile-form";
import { NotificationSettings } from "./notification-settings";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const user = await getUser();
  const params = await searchParams;

  return (
    <>
      <div className="main__hdr">
        <h1 className="main__title font-story">👤 プロフィール</h1>
      </div>
      <div className="flex flex-col gap-6">
        <ProfileForm user={user} success={params.success === "1"} />
        <NotificationSettings />
      </div>
    </>
  );
}
