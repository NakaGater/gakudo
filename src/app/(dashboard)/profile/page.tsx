import { getUser } from "@/lib/auth/get-user";
import { ProfileForm } from "./profile-form";

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
      <ProfileForm user={user} success={params.success === "1"} />
    </>
  );
}
