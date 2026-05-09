/* ─── CleanLink Central Analytics Service ───────────────────────────────────
 * GTM dataLayer entegrasyonu + URL yönetimi
 * Google Tag Manager container ID'si index.html'deki placeholder'a girilecek.
 * ─────────────────────────────────────────────────────────────────────────── */

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

/* Turkish → URL-safe slug */
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* Push a conversion event to GTM dataLayer */
export function trackGTMEvent(
  action: "call" | "quote" | "order" | "whatsapp",
  vendorName: string,
  extra?: Record<string, unknown>
) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "cleanlink_conversion",
    vendor_name: vendorName,
    vendor_slug: toSlug(vendorName),
    action,
    timestamp: new Date().toISOString(),
    ...extra,
  });
}

/* Firma profil URL'ini güncelle (?firma=slug) — modal açılınca çağrılır */
export function updateFirmaUrl(vendorName: string) {
  try {
    const slug = toSlug(vendorName);
    const url = new URL(window.location.href);
    url.searchParams.set("firma", slug);
    window.history.pushState({ firma: slug }, "", url.toString());
  } catch { /* ignore */ }
}

/* Modal kapanınca URL'i temizle */
export function clearFirmaUrl() {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete("firma");
    window.history.pushState({}, "", url.toString());
  } catch { /* ignore */ }
}

/* URL'den firma slug'ını oku (deep-link / Google Ads landing) */
export function getFirmaSlugFromUrl(): string | null {
  try {
    return new URLSearchParams(window.location.search).get("firma");
  } catch {
    return null;
  }
}

/* Body scroll kilidi — iç içe modal desteği için sayaç tabanlı */
export function lockBodyScroll() {
  const count = parseInt(document.body.dataset.scrollLock || "0") + 1;
  document.body.dataset.scrollLock = String(count);
  document.body.style.overflow = "hidden";
}

export function unlockBodyScroll() {
  const count = Math.max(0, parseInt(document.body.dataset.scrollLock || "0") - 1);
  document.body.dataset.scrollLock = String(count);
  if (count === 0) document.body.style.overflow = "";
}
