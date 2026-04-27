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

// Slugs this catch-all renders. Anything else (`news` / `gallery` /
// `access` have their own routes; arbitrary strings like `/random-xyz`)
// must produce a 404.
//
// `dynamicParams = false` + `generateStaticParams` tells Next's router
// to reject any slug not returned below. That rejection happens BEFORE
// any handler runs, so the response status is 404 — sidestepping the
// streaming-SSR issue where notFound() inside a Suspense boundary
// (the (public)/loading.tsx fallback) leaves the response at 200.
//
// Cache invalidation: admin/site/actions.ts calls `revalidatePath("/" +
// slug)` after a CMS edit so the corresponding static page is rebuilt
// on the next request.
const VALID_SLUGS = ["about", "faq", "daily-life", "enrollment", "home"] as const;
const VALID_SLUGS_SET = new Set<string>(VALID_SLUGS);

export const dynamicParams = false;

export function generateStaticParams() {
  return VALID_SLUGS.map((slug) => ({ slug }));
}

type SitePageRow = {
  title: string;
  content: string;
  updated_at: string;
  metadata: Record<string, unknown>;
};

async function fetchSitePage(slug: string): Promise<SitePageRow | null> {
  try {
    const supabase = await createClient();
    const { data } = (await supabase
      .from("site_pages")
      .select("title, content, updated_at, metadata")
      .eq("slug", slug)
      .single()) as { data: SitePageRow | null };
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  // dynamicParams=false guarantees slug is in VALID_SLUGS by the time we
  // get here, but keep the guard so this function is safe to reuse.
  if (!VALID_SLUGS_SET.has(slug)) return { title: "ページが見つかりません" };
  const page = await fetchSitePage(slug);
  if (!page) return { title: "ページが見つかりません" };
  return { title: `${page.title} — 星ヶ丘こどもクラブ` };
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

  // Belt-and-suspenders: dynamicParams=false should prevent us from
  // ever getting an unknown slug, but if e.g. a future generateStaticParams
  // change misses a row this still returns the right not-found UI.
  if (!VALID_SLUGS_SET.has(slug)) notFound();

  const page = await fetchSitePage(slug);
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
