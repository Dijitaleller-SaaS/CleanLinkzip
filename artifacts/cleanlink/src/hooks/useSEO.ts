import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  noIndex?: boolean;
}

const SITE_NAME = "CleanLink";
const DEFAULT_TITLE = "CleanLink — Profesyonel Ev, Ofis, Koltuk ve Halı Temizliği";
const DEFAULT_DESCRIPTION =
  "CleanLink ile eviniz, ofisiniz, koltuğunuz ve halınız için en iyi temizlik firmalarını bulun. Onaylı profesyoneller, şeffaf fiyatlar, anında rezervasyon.";
const BASE_URL = "https://cleanlinktr.com";

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
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

export function useSEO({
  title,
  description,
  canonical,
  ogImage,
  noIndex = false,
}: SEOProps = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
    const fullDescription = description ?? DEFAULT_DESCRIPTION;
    const fullCanonical = canonical ? `${BASE_URL}${canonical}` : BASE_URL;
    const image = ogImage ?? `${BASE_URL}/opengraph.jpg`;

    document.title = fullTitle;

    setMeta("description", fullDescription);
    setMeta("robots", noIndex ? "noindex, nofollow" : "index, follow");

    setMeta("og:title", fullTitle, "property");
    setMeta("og:description", fullDescription, "property");
    setMeta("og:url", fullCanonical, "property");
    setMeta("og:image", image, "property");

    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", fullDescription);
    setMeta("twitter:image", image);

    setLink("canonical", fullCanonical);
  }, [title, description, canonical, ogImage, noIndex]);
}
