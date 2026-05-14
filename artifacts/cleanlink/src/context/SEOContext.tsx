import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { Helmet } from "react-helmet-async";

export const SITE_NAME = "CleanLink";
export const BASE_URL = "https://cleanlinktr.com";
export const DEFAULT_TITLE = "CleanLink — Profesyonel Ev, Ofis, Koltuk ve Halı Temizliği";
export const DEFAULT_DESCRIPTION =
  "CleanLink ile eviniz, ofisiniz, koltuğunuz ve halınız için en iyi temizlik firmalarını bulun. Onaylı profesyoneller, şeffaf fiyatlar, anında rezervasyon.";
export const DEFAULT_OG_IMAGE = `${BASE_URL}/opengraph.jpg`;

interface SEOData {
  title: string;
  description: string;
  canonical: string;
  ogImage: string;
  ogType: "website" | "article";
  noIndex: boolean;
}

interface SEOContextType {
  setSEO: (data: Partial<SEOData>) => void;
}

const SEOContext = createContext<SEOContextType>({ setSEO: () => {} });

export function useSEOContext() {
  return useContext(SEOContext);
}

export function SEOProvider({ children }: { children: ReactNode }) {
  const [seo, setSEOState] = useState<SEOData>({
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    canonical: BASE_URL,
    ogImage: DEFAULT_OG_IMAGE,
    ogType: "website",
    noIndex: false,
  });

  const setSEO = useCallback((data: Partial<SEOData>) => {
    setSEOState((prev) => ({ ...prev, ...data }));
  }, []);

  const robotsContent = seo.noIndex
    ? "noindex, nofollow"
    : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1";

  return (
    <SEOContext.Provider value={{ setSEO }}>
      <Helmet prioritizeSeoTags>
        <html lang="tr" />
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <meta name="robots" content={robotsContent} />
        <link rel="canonical" href={seo.canonical} />

        <meta property="og:type" content={seo.ogType} />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:url" content={seo.canonical} />
        <meta property="og:title" content={seo.title} />
        <meta property="og:description" content={seo.description} />
        <meta property="og:image" content={seo.ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:alt" content={seo.title} />
        <meta property="og:locale" content="tr_TR" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@cleanlinktr" />
        <meta name="twitter:title" content={seo.title} />
        <meta name="twitter:description" content={seo.description} />
        <meta name="twitter:image" content={seo.ogImage} />
        <meta name="twitter:image:alt" content={seo.title} />
      </Helmet>
      {children}
    </SEOContext.Provider>
  );
}
