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
// In Next 16 production builds, calling `notFound()` from inside a dynamic
// catch-all route handler does not reliably propagate a 404 status when the
// proxy (`src/proxy.ts`) returns a `NextResponse.next()` with mutated
// headers — the route handler renders the not-found UI but the response
// status stays at 200 (observed in CI on flow10).
//
// Switching the route to `dynamicParams = false` + `generateStaticParams`
// moves the unknown-slug rejection up to Next's routing layer, which
// returns 404 before any handler runs and bypasses the proxy's response
// shape entirely. CMS edits stay live because the corresponding action
// (`admin/site/actions.ts`) calls `revalidatePath("/" + slug)`.
const VALID_SLUGS = ["about", "faq", "daily-life", "enrollment", "home"] as const;
const VALID_SLUGS_SET = new Set<string>(VALID_SLUGS);

export const dynamicParams = false;

export function generateStaticParams() {
  return VALID_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!VALID_SLUGS_SET.has(slug)) return { title: "ページが見つかりません" };
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

  // dynamicParams=false already rejects unknown slugs at the routing layer,
  // but keep this defensive check so the function is well-typed when slug
  // happens to fall outside VALID_SLUGS in development hot-reload edge cases.
  if (!VALID_SLUGS_SET.has(slug)) notFound();

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
