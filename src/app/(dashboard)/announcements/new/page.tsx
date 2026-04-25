import { redirect } from "next/navigation";
import { loadSelectableParents } from "@/lib/announcements/recipients-server";
import { getUser } from "@/lib/auth/get-user";
import { AnnouncementForm } from "./announcement-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "お知らせ作成",
};

export default async function NewAnnouncementPage() {
  const user = await getUser();
  if (user.role === "parent") {
    redirect("/announcements");
  }

  const parents = await loadSelectableParents();
  return <AnnouncementForm parents={parents} />;
}
