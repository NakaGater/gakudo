import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AboutPage } from "./about-page";
import { DailyLifePage } from "./daily-life-page";
import { EnrollmentPage } from "./enrollment-page";
import { FaqPage } from "./faq-page";
import type { Metadata } from "next";

type PageProps = {
  params: Promise<{ slug: string }>;
};

// Slugs that this catch-all is willing to render. Anything else (including
// `news` / `gallery` / `access` which have their own routes elsewhere, and
// arbitrary strings like `/random-thing-xyz`) must 404.
//
// `notFound()` only sets a 404 status when invoked BEFORE streaming begins.
// Calling it after `await supabase.from(...).single()` (i.e. once an I/O
// boundary has been crossed) leaves the response status at 200 in Next 16
// production builds — observed in CI on flow10. Validating the slug against
// this list at the very top of the handler keeps the notFound() call ahead
// of any await and restores the proper 404.
const VALID_SLUGS = new Set(["about", "faq", "daily-life", "enrollment", "home"]);

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!VALID_SLUGS.has(slug)) return { title: "ページが見つかりません" };
  try {
    const supabase = await createClient();
    const { data } = (await supabase
      .from("site_pages")
      .select("title")
      .eq("slug", slug)
      .single()) as { data: { title: string } | null };

    if (!data) return { title: "ページが見つかりません" };
    return { title: `${data.title} — 星ヶ丘こどもクラブ` };
  } catch {
    return { title: "ページが見つかりません" };
  }
}

const PAGE_COMPONENTS: Record<
  string,
  React.FC<{ title: string; content: string; metadata: Record<string, unknown> }>
> = {
  about: AboutPage,
  faq: FaqPage,
  "daily-life": DailyLifePage,
  enrollment: EnrollmentPage,
};

export default async function SitePage({ params }: PageProps) {
  const { slug } = await params;

  // Reject unknown slugs BEFORE any await — see VALID_SLUGS comment above
  // for why this matters for the 404 status code.
  if (!VALID_SLUGS.has(slug)) notFound();

  let page: {
    title: string;
    content: string;
    updated_at: string;
    metadata: Record<string, unknown>;
  } | null = null;
  try {
    const supabase = await createClient();
    const { data } = (await supabase
      .from("site_pages")
      .select("title, content, updated_at, metadata")
      .eq("slug", slug)
      .single()) as {
      data: {
        title: string;
        content: string;
        updated_at: string;
        metadata: Record<string, unknown>;
      } | null;
    };
    page = data;
  } catch {
    notFound();
  }

  if (!page) notFound();

  const PageComponent = PAGE_COMPONENTS[slug];
  if (PageComponent) {
    return <PageComponent title={page.title} content={page.content} metadata={page.metadata} />;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-story font-black text-ink ink-bleed mb-4" style={{ fontSize: "28px" }}>
        <span className="crayon-underline">{page.title}</span>
      </h1>
      <div className="text-sm text-ink-mid leading-relaxed whitespace-pre-wrap">{page.content}</div>
    </div>
  );
}
