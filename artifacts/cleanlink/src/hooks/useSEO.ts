import { useEffect } from "react";
import {
  useSEOContext,
  BASE_URL,
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  SITE_NAME,
} from "@/context/SEOContext";

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: "website" | "article";
  noIndex?: boolean;
  jsonLd?: object;
}

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

function setLink(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
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

function sendAuditLog(page: string, title: string, description: string, image: string) {
  fetch("/api/og-audit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ page, title, description, image }),
    keepalive: true,
  }).catch(() => {});
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
  const { setSEO } = useSEOContext();

  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
    const fullDescription = description ?? DEFAULT_DESCRIPTION;
    const fullCanonical = canonical ? `${BASE_URL}${canonical}` : BASE_URL;
    const image = ogImage ?? DEFAULT_OG_IMAGE;
    const robotsContent = noIndex
      ? "noindex, nofollow"
      : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1";

    setSEO({
      title: fullTitle,
      description: fullDescription,
      canonical: fullCanonical,
      ogImage: image,
      ogType,
      noIndex,
    });

    document.title = fullTitle;

    setMeta(`meta[name="description"]`, fullDescription);
    setMeta(`meta[name="robots"]`, robotsContent);

    setMeta(`meta[property="og:title"]`, fullTitle);
    setMeta(`meta[property="og:description"]`, fullDescription);
    setMeta(`meta[property="og:url"]`, fullCanonical);
    setMeta(`meta[property="og:image"]`, image);
    setMeta(`meta[property="og:type"]`, ogType);
    setMeta(`meta[property="og:site_name"]`, SITE_NAME);
    setMeta(`meta[property="og:image:width"]`, "1200");
    setMeta(`meta[property="og:image:height"]`, "630");
    setMeta(`meta[property="og:image:type"]`, "image/jpeg");
    setMeta(`meta[property="og:image:alt"]`, fullTitle);
    setMeta(`meta[property="og:locale"]`, "tr_TR");

    setMeta(`meta[name="twitter:card"]`, "summary_large_image");
    setMeta(`meta[name="twitter:title"]`, fullTitle);
    setMeta(`meta[name="twitter:description"]`, fullDescription);
    setMeta(`meta[name="twitter:image"]`, image);
    setMeta(`meta[name="twitter:image:alt"]`, fullTitle);
    setMeta(`meta[name="twitter:site"]`, "@cleanlinktr");

    setLink("canonical", fullCanonical);

    if (jsonLd) {
      upsertJsonLd("page-jsonld", jsonLd);
    } else {
      removeJsonLd("page-jsonld");
    }

    sendAuditLog(fullCanonical, fullTitle, fullDescription, image);

    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title, description, canonical, ogImage, ogType, noIndex, jsonLd, setSEO]);
}
