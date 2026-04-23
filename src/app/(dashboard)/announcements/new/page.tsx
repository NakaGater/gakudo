import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { AnnouncementForm } from "./announcement-form";

export const metadata: Metadata = {
  title: "お知らせ作成",
};

export default async function NewAnnouncementPage() {
  const user = await getUser();
  if (user.role === "parent") {
    redirect("/announcements");
  }

  return <AnnouncementForm />;
}
