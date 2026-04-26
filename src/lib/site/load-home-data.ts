import { createClient } from "@/lib/supabase/server";

export type FeatureItem = { icon: string; title: string; description: string };

export type HomeNewsItem = {
  id: string;
  title: string;
  body: string;
  published_at: string;
};

export type HomePageData = {
  heroText: string;
  heroTitle: string;
  heroEmphasis: string;
  featuresHeading: string;
  featuresSubtitle: string;
  featureItems: FeatureItem[];
  photoUrls: string[];
  newsItems: HomeNewsItem[];
  accessContent: string;
  accessMeta: Record<string, unknown>;
};

const DEFAULT_HERO_TEXT =
  "星ヶ丘こどもクラブは、保護者の手で運営する学童保育施設です。約30名の児童が、宿題・遊び・おやつの時間を通じて、のびのびと放課後を過ごしています。";

const DEFAULT_HERO_TITLE = "子どもたちの\n笑顔あふれる\n放課後を";
const DEFAULT_HERO_EMPHASIS = "笑顔あふれる";

const DEFAULT_FEATURES: FeatureItem[] = [
  {
    icon: "Users",
    title: "父母運営のあたたかさ",
    description:
      "保護者が運営に参加することで、家庭とクラブが一体となってお子さまの成長を見守ります。",
  },
  {
    icon: "Heart",
    title: "異年齢の交流",
    description:
      "1年生から6年生まで一緒に過ごすことで、思いやりやリーダーシップが自然と育まれます。",
  },
  {
    icon: "Calendar",
    title: "季節の行事",
    description: "お花見、七夕、クリスマス会など四季折々の行事を通じて、豊かな思い出を育みます。",
  },
  {
    icon: "Apple",
    title: "食育・おやつ",
    description:
      "栄養バランスを考えたおやつで、旬の味覚を楽しみます。みんなで食べる時間も大切にしています。",
  },
];

/**
 * Phase 3-B: HomePage data load extracted out of (public)/page.tsx so
 * the page itself focuses on JSX. Keeps the same try/catch fallback
 * behavior — DB outage → defaults rendered.
 *
 * Three queries fan out in parallel: home page metadata, public
 * photos for the hero slideshow, and the news feed.
 */
export async function loadHomePageData(): Promise<HomePageData> {
  const data: HomePageData = {
    heroText: DEFAULT_HERO_TEXT,
    heroTitle: DEFAULT_HERO_TITLE,
    heroEmphasis: DEFAULT_HERO_EMPHASIS,
    featuresHeading: "施設の特徴",
    featuresSubtitle: "デジタルの力で、保護者の安心と運営の効率化を両立します。",
    featureItems: DEFAULT_FEATURES,
    photoUrls: [],
    newsItems: [],
    accessContent: "",
    accessMeta: {},
  };

  try {
    const supabase = await createClient();

    const [homeResult, photosResult, newsResult] = await Promise.all([
      supabase.from("site_pages").select("title, content, metadata").eq("slug", "home").single(),
      supabase
        .from("photos")
        .select("storage_path")
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("site_news")
        .select("id, title, body, published_at")
        .order("published_at", { ascending: false }),
    ]);

    const homePage = homeResult.data as {
      title: string;
      content: string;
      metadata: Record<string, unknown>;
    } | null;

    if (homePage?.content) {
      data.heroText = homePage.content;
    }
    if (homePage?.metadata) {
      const m = homePage.metadata;
      if (m.hero_title) data.heroTitle = m.hero_title as string;
      if (m.hero_emphasis) data.heroEmphasis = m.hero_emphasis as string;
      if (m.features_heading) data.featuresHeading = m.features_heading as string;
      if (m.features_subtitle) data.featuresSubtitle = m.features_subtitle as string;
      if (Array.isArray(m.features) && m.features.length > 0) {
        data.featureItems = m.features as FeatureItem[];
      }
      // Access info is namespaced under access_* on the home metadata.
      if (m.access_address) data.accessContent = m.access_address as string;
      data.accessMeta = {
        subtitle: m.access_subtitle ?? data.accessMeta.subtitle,
        opening_hours: m.access_opening_hours ?? data.accessMeta.opening_hours,
        phone: m.access_phone ?? data.accessMeta.phone,
        phone_hours: m.access_phone_hours ?? data.accessMeta.phone_hours,
        visit_heading: m.access_visit_heading ?? data.accessMeta.visit_heading,
        visit_text: m.access_visit_text ?? data.accessMeta.visit_text,
        map_embed_url: m.access_map_embed_url ?? data.accessMeta.map_embed_url,
      };
    }

    const photos = photosResult.data;
    if (photos && photos.length > 0) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      data.photoUrls = photos.map(
        (p) => `${supabaseUrl}/storage/v1/object/public/photos/${p.storage_path}`,
      );
    }

    const news = newsResult.data as HomeNewsItem[] | null;
    if (news && news.length > 0) {
      data.newsItems = news;
    }
  } catch {
    // DB outage → render defaults.
  }

  return data;
}
