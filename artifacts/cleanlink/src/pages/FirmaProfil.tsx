import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import {
  Star, MapPin, ShieldCheck, Phone, CheckCircle2, Calendar,
  Sparkles, Award, Home, AlertTriangle,
} from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { BookingModal } from "@/components/booking/BookingModal";
import {
  apiGetVendors, apiGetReviews,
  type PublicVendorApi, type ApiReview, type ReviewStats,
} from "@/lib/api";
import { toSlug, trackGTMEvent } from "@/lib/analytics";
import { SERVICE_KEYS, SERVICE_META, SERVICE_GROUPS } from "@/context/AppContext";
import { trackAdCall, trackAdQuote } from "@/lib/adTracking";
import NotFound from "@/pages/not-found";

const BASE_URL = "https://cleanlinktr.com";

function digitsOnly(s: string) { return s.replace(/[^0-9]/g, ""); }
function toWaNumber(p: string) {
  const d = digitsOnly(p); if (!d) return "";
  if (d.startsWith("90")) return d;
  if (d.startsWith("0")) return "90" + d.slice(1);
  if (d.length === 10) return "90" + d;
  return d;
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487 2.981 1.287 2.981.858 3.519.804.538-.054 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884Z"/>
    </svg>
  );
}

function StarRow({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`w-4 h-4 ${i <= Math.round(n) ? "fill-yellow-400 text-yellow-400" : "text-border"}`} />
      ))}
    </div>
  );
}

export default function FirmaProfil() {
  const { slug } = useParams<{ slug: string }>();
  const [vendors, setVendors] = useState<PublicVendorApi[] | null>(null);
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [stats, setStats] = useState<ReviewStats>({ count: 0, average: 0 });
  const [showBooking, setShowBooking] = useState(false);

  useEffect(() => {
    apiGetVendors().then(setVendors).catch(() => setVendors([]));
  }, []);

  const vendor = useMemo(
    () => vendors?.find(v => toSlug(v.name) === slug) ?? null,
    [vendors, slug]
  );

  useEffect(() => {
    if (!vendor) return;
    apiGetReviews(vendor.userId)
      .then(({ reviews, stats }) => { setReviews(reviews); setStats(stats); })
      .catch(() => {});
  }, [vendor]);

  /* SEO + JSON-LD */
  const seoTitle = vendor
    ? `${vendor.name} — ${vendor.regions[0] ?? "Türkiye"} Profesyonel Temizlik`
    : "Firma";
  const seoDesc = vendor
    ? `${vendor.name}: ${vendor.bio?.slice(0, 140) || `${vendor.regions.join(", ") || "Türkiye"} bölgesinde profesyonel temizlik hizmeti.`} CleanLink üzerinden anında randevu alın.`
    : "";

  const ogImage = vendor?.galleryUrls?.[0] ?? undefined;
  useSEO({
    title: seoTitle,
    description: seoDesc,
    canonical: vendor ? `/firma/${slug}` : "/firmalar",
    ogImage,
    ogType: "website",
    noIndex: !vendor,
  });

  /* Inject JSON-LD LocalBusiness schema */
  useEffect(() => {
    if (!vendor) return;
    const id = "ld-firma";
    const old = document.getElementById(id); if (old) old.remove();
    const data = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": vendor.name,
      "description": vendor.bio || `${vendor.regions.join(", ")} bölgesinde profesyonel temizlik`,
      "url": `${BASE_URL}/firma/${slug}`,
      "areaServed": vendor.regions,
      "address": vendor.regions[0] ? { "@type": "PostalAddress", "addressLocality": vendor.regions[0], "addressCountry": "TR" } : undefined,
      "aggregateRating": stats.count > 0 ? {
        "@type": "AggregateRating",
        "ratingValue": stats.average,
        "reviewCount": stats.count,
      } : undefined,
      "priceRange": "₺₺",
    };
    const s = document.createElement("script");
    s.id = id; s.type = "application/ld+json";
    s.textContent = JSON.stringify(data);
    document.head.appendChild(s);
    return () => { document.getElementById(id)?.remove(); };
  }, [vendor, slug, stats]);

  const services = useMemo(() => {
    if (!vendor) return [];
    return SERVICE_KEYS
      .filter(k => vendor.prices?.[k] && vendor.prices[k] > 0)
      .map(k => ({ key: k, ...SERVICE_META[k], price: vendor.prices[k], scope: vendor.serviceScopes?.[k] ?? "" }));
  }, [vendor]);

  const grouped = useMemo(() =>
    SERVICE_GROUPS.map(g => ({
      group: g,
      items: services.filter(s => s.group === g),
    })).filter(g => g.items.length > 0),
  [services]);

  const bookingFirma = useMemo(() => ({
    name: vendor?.name ?? "",
    services: services.map(s => ({
      name: s.label,
      price: String(s.price),
      unit: s.unit,
      scope: s.scope,
    })),
  }), [vendor?.name, services]);

  if (vendors === null) {
    return (
      <PageLayout breadcrumbs={[{ label: "Firmalar", href: "/firmalar" }, { label: "Yükleniyor…" }]}>
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-secondary rounded-2xl" />
          <div className="h-64 bg-secondary rounded-2xl" />
        </div>
      </PageLayout>
    );
  }
  if (!vendor) return <NotFound />;

  const isPaid = vendor.isSubscribed || vendor.isSponsor;
  const phoneNum = "";

  const handleBook = () => {
    setShowBooking(true);
    trackAdQuote();
    trackGTMEvent("quote", vendor.name);
  };

  return (
    <PageLayout breadcrumbs={[
      { label: "Firmalar", href: "/firmalar" },
      { label: vendor.name },
    ]}>
      {/* ─── Hero ─── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary/10 via-white to-violet-50 rounded-3xl border border-border p-6 md:p-10 mb-8 shadow-sm"
      >
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center text-white font-bold text-3xl flex-shrink-0 shadow-lg">
            {vendor.name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {isPaid && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200">
                  <Sparkles className="w-3 h-3" /> Sponsor / Elite
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                <ShieldCheck className="w-3 h-3" /> Onaylı Firma
              </span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">{vendor.name}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-4">
              {vendor.regions.length > 0 && (
                <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4 text-primary" /> {vendor.regions.slice(0,3).join(", ")}</span>
              )}
              {stats.count > 0 ? (
                <span className="inline-flex items-center gap-1.5"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> <strong className="text-foreground">{stats.average}</strong> ({stats.count} yorum)</span>
              ) : (
                <span className="text-xs italic">Yorum bekleniyor</span>
              )}
            </div>
            {vendor.bio && <p className="text-sm md:text-base text-foreground/90 leading-relaxed mb-5">{vendor.bio}</p>}

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleBook} className="h-11 rounded-xl font-bold gap-2 shadow-md shadow-primary/20">
                <Calendar className="w-4 h-4" /> Randevu Al / Ödeme Yap
              </Button>
              {isPaid && phoneNum && (
                <>
                  <a
                    href={`tel:${digitsOnly(phoneNum)}`}
                    onClick={() => { trackAdCall(); trackGTMEvent("call", vendor.name); }}
                    className="h-11 px-5 rounded-xl border-2 border-primary text-primary font-bold inline-flex items-center gap-2 hover:bg-primary/5 transition"
                  >
                    <Phone className="w-4 h-4" /> Ara
                  </a>
                  {toWaNumber(phoneNum) && (
                    <a
                      href={`https://wa.me/${toWaNumber(phoneNum)}?text=${encodeURIComponent(`Merhaba, ${vendor.name} hakkında bilgi almak istiyorum.`)}`}
                      target="_blank" rel="noopener noreferrer"
                      onClick={() => trackGTMEvent("whatsapp", vendor.name)}
                      className="h-11 px-4 rounded-xl bg-[#25D366] text-white font-bold inline-flex items-center gap-2 hover:bg-[#1ebe5a] transition shadow-md"
                    >
                      <WhatsAppIcon className="w-5 h-5" />
                    </a>
                  )}
                </>
              )}
            </div>
            {!isPaid && (
              <p className="mt-3 text-xs text-amber-700 inline-flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Doğrudan iletişim için randevu oluşturun. Pilot dönemde ödeme hizmet sonunda firmaya yapılır.
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* ─── Services & Prices ─── */}
      {grouped.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-foreground mb-4">Hizmetler & Fiyatlar</h2>
          <div className="space-y-4">
            {grouped.map(g => (
              <div key={g.group} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-border bg-secondary/30">
                  <span className="text-sm font-bold text-foreground">{g.group}</span>
                </div>
                <div className="divide-y divide-border">
                  {g.items.map(s => (
                    <div key={s.key} className="flex items-start justify-between gap-4 px-5 py-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground">{s.label}</p>
                        {s.scope && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.scope}</p>}
                      </div>
                      <div className="text-right whitespace-nowrap">
                        <p className="font-bold text-foreground">{s.price.toLocaleString("tr-TR")} TL</p>
                        <p className="text-[10px] text-muted-foreground">{s.unit}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Service Areas ─── */}
      {vendor.regions.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-display font-bold text-foreground mb-3">Hizmet Bölgeleri</h2>
          <div className="flex flex-wrap gap-2">
            {vendor.regions.map(r => (
              <Link key={r} href={`/firmalar?sehir=${encodeURIComponent(r)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/20 text-primary text-xs font-semibold hover:bg-primary/10 transition">
                <MapPin className="w-3 h-3" /> {r}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─── Reviews ─── */}
      <section className="mb-8">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-2xl font-display font-bold text-foreground">Müşteri Yorumları</h2>
          {stats.count > 0 && (
            <div className="flex items-center gap-2">
              <StarRow n={stats.average} />
              <span className="font-bold text-foreground">{stats.average}</span>
              <span className="text-sm text-muted-foreground">({stats.count})</span>
            </div>
          )}
        </div>
        {reviews.length === 0 ? (
          <div className="bg-secondary/30 border border-border rounded-2xl p-6 text-center text-sm text-muted-foreground">
            Henüz yorum yok. Bu firmadan hizmet aldıysanız ilk yorumu siz bırakabilirsiniz.
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.slice(0, 8).map(r => (
              <article key={r.id} className="bg-white rounded-2xl border border-border p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-teal-600 text-white text-xs font-bold flex items-center justify-center">
                    {r.customerName.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-foreground">{r.customerName}</p>
                    <StarRow n={r.puan} />
                  </div>
                  <time className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("tr-TR")}</time>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">{r.yorum}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ─── Trust footer ─── */}
      <section className="bg-gradient-to-br from-primary/5 to-violet-50 rounded-2xl border border-border p-6 md:p-8 text-center mb-4">
        <Award className="w-10 h-10 mx-auto text-primary mb-3" />
        <h3 className="font-display text-xl font-bold text-foreground mb-2">CleanLink Garantisi</h3>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-4">
          {vendor.name} CleanLink üzerinden onaylanmış bir firmadır. Pilot dönemde ödeme hizmet sonunda doğrudan firmaya yapılır; online ödeme ve taksit altyapısı yakında devreye alınacaktır.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Onaylı kimlik</span>
          <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Güvenli ödeme</span>
          <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Pilot dönem · ödeme firmaya</span>
          <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Yorum sonrası puan</span>
        </div>
      </section>

      {showBooking && <BookingModal firma={bookingFirma} onClose={() => setShowBooking(false)} />}
    </PageLayout>
  );
}
