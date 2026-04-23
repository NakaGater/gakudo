import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { EditPageForm } from "./edit-page-form";

type Params = { slug: string };

export default async function EditSitePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const user = await getUser();
  if (user.role !== "admin") redirect("/");

  const supabase = await createClient();
  const { data: page, error } = await supabase
    .from("site_pages")
    .select("slug, title, content, metadata")
    .eq("slug", slug)
    .single<{ slug: string; title: string; content: string; metadata: Record<string, unknown> }>();

  if (error || !page) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/admin/site/pages"
        className="text-sm text-accent hover:text-accent-hv transition-colors"
      >
        ← ページ一覧に戻る
      </Link>

      <h1 className="text-2xl font-bold text-fg mt-4 mb-6">
        ページ編集: {page.title}
      </h1>

      <EditPageForm slug={page.slug} title={page.title} content={page.content} metadata={page.metadata} />
    </div>
  );
}
