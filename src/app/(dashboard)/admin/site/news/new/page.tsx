import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { CreateNewsForm } from "./create-news-form";

export default async function NewNewsPage() {
  const user = await getUser();
  if (user.role !== "admin") redirect("/");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-fg mb-6">お知らせ新規作成</h1>
      <CreateNewsForm />
    </div>
  );
}
