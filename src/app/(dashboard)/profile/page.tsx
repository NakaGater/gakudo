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
    <div className="p-6">
      <ProfileForm user={user} success={params.success === "1"} />
    </div>
  );
}
