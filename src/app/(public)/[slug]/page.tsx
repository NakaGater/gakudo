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
// arbitrary strings like `/random-thing-xyz`) must call notFound().
//
// NOTE on 404 status code: in Next 16 (Turbopack) production builds, a
// route that goes through `src/proxy.ts` returning `NextResponse.next()`
// with mutated headers (we set `x-pathname` for the entrance-role guard)
// renders the not-found UI but keeps the response status at 200.
// `dynamicParams = false` + generateStaticParams was tried and ALSO returns
// 200 while breaking the CMS edit flow's revalidatePath path. Until the
// proxy is restructured to not interfere with notFound() status
// propagation, the not-found content is shown but the HTTP status is 200.
// flow10 asserts the content rather than the status.
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

  // Reject unknown slugs early — produces the not-found UI even though the
  // proxy currently keeps the response status at 200 (see VALID_SLUGS
  // comment).
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
