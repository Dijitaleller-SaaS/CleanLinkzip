import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: "website" | "article";
  noIndex?: boolean;
  jsonLd?: object;
}

const SITE_NAME = "CleanLink";
const DEFAULT_TITLE = "CleanLink — Profesyonel Ev, Ofis, Koltuk ve Halı Temizliği";
const DEFAULT_DESCRIPTION =
  "CleanLink ile eviniz, ofisiniz, koltuğunuz ve halınız için en iyi temizlik firmalarını bulun. Onaylı profesyoneller, şeffaf fiyatlar, anında rezervasyon.";
const BASE_URL = "https://cleanlinktr.com";
const DEFAULT_OG_IMAGE = `${BASE_URL}/opengraph.jpg`;

function setMeta(selector: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    const attr = selector.includes("property=") ? "property" : "name";
    const val = selector.match(/["']([^"']+)["']/)?.[1] ?? "";
    el.setAttribute(attr, val);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string, extra?: Record<string, string>) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
  if (extra) Object.entries(extra).forEach(([k, v]) => el!.setAttribute(k, v));
}

function upsertJsonLd(id: string, data: object) {
  let el = document.querySelector<HTMLScriptElement>(`script[data-seo-id="${id}"]`);
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.setAttribute("data-seo-id", id);
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function removeJsonLd(id: string) {
  document.querySelector(`script[data-seo-id="${id}"]`)?.remove();
}

export function useSEO({
  title,
  description,
  canonical,
  ogImage,
  ogType = "website",
  noIndex = false,
  jsonLd,
}: SEOProps = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
    const fullDescription = description ?? DEFAULT_DESCRIPTION;
    const fullCanonical = canonical ? `${BASE_URL}${canonical}` : BASE_URL;
    const image = ogImage ?? DEFAULT_OG_IMAGE;

    document.title = fullTitle;

    setMeta(`meta[name="description"]`, fullDescription);
    setMeta(`meta[name="robots"]`, noIndex ? "noindex, nofollow" : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1");

    setMeta(`meta[property="og:title"]`, fullTitle);
    setMeta(`meta[property="og:description"]`, fullDescription);
    setMeta(`meta[property="og:url"]`, fullCanonical);
    setMeta(`meta[property="og:image"]`, image);
    setMeta(`meta[property="og:type"]`, ogType);
    setMeta(`meta[property="og:site_name"]`, SITE_NAME);
    setMeta(`meta[property="og:image:width"]`, "1280");
    setMeta(`meta[property="og:image:height"]`, "720");
    setMeta(`meta[property="og:locale"]`, "tr_TR");

    setMeta(`meta[name="twitter:card"]`, "summary_large_image");
    setMeta(`meta[name="twitter:title"]`, fullTitle);
    setMeta(`meta[name="twitter:description"]`, fullDescription);
    setMeta(`meta[name="twitter:image"]`, image);
    setMeta(`meta[name="twitter:site"]`, "@cleanlinktr");

    setLink("canonical", fullCanonical);

    if (jsonLd) {
      upsertJsonLd("page-jsonld", jsonLd);
    } else {
      removeJsonLd("page-jsonld");
    }

    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title, description, canonical, ogImage, ogType, noIndex, jsonLd]);
}
