import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import {
  MapPin, Star, ShieldCheck, ArrowRight, Sparkles,
  CheckCircle2, Phone, Search, Award, Calendar,
} from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { PageLayout } from "@/components/layout/PageLayout";
import { apiGetVendors, apiGetReviewStats, type PublicVendorApi, type ReviewStats } from "@/lib/api";
import { toSlug } from "@/lib/analytics";
import { SERVICE_KEYS, SERVICE_META, type ServiceKey } from "@/context/AppContext";
import NotFound from "@/pages/not-found";

const BASE_URL = "https://cleanlinktr.com";

/* ── Cities (must match toSlug output) ── */
export const CITIES = [
  "İstanbul", "Ankara", "İzmir", "Bursa", "Antalya",
  "Adana", "Konya", "Gaziantep", "Kocaeli", "Mersin",
] as const;

/* ── Service groups for landing pages ── */
export const SERVICE_GROUP_LANDINGS = [
  { slug: "ev-temizligi",  group: "Ev Temizliği",   priceFrom: 1500, label: "Ev Temizliği",
    intro: "Profesyonel ekiplerle dairenizi pırıl pırıl yapın. Standart, detaylı veya inşaat sonrası temizlik seçenekleri." },
  { slug: "koltuk-yikama", group: "Koltuk Yıkama",  priceFrom: 350,  label: "Koltuk Yıkama",
    intro: "Adresinize gelen mobil koltuk yıkama: leke, koku ve mite karşı endüstriyel cihazlarla derin temizlik." },
  { slug: "hali-yikama",   group: "Halı Yıkama",    priceFrom: 35,   label: "Halı Yıkama",
    intro: "Halı fabrikasında özel şampuanla yıkama, kurutma ve adresinize teslim. m² fiyatlı, şeffaf." },
  { slug: "arac-sandalye", group: "Araç Koltuk Yıkama", priceFrom: 800, label: "Araç Koltuk Yıkama",
    intro: "Aracınızın koltuk, tavan ve halıfleksleri için profesyonel buharlı yıkama ve koku giderme hizmeti." },
  { slug: "yatak-yorgan",  group: "Yatak & Yorgan", priceFrom: 400,  label: "Yatak & Yorgan Temizliği",
    intro: "Akar, ter ve toza karşı yatak/yorgan/baza temizliği. UV sterilizasyon ile alerjenden arınma." },
] as const;

const CITY_SLUGS: Record<string, typeof CITIES[number]> = {};
for (const c of CITIES) CITY_SLUGS[toSlug(c)] = c;

const SERVICE_SLUGS = SERVICE_GROUP_LANDINGS.reduce<Record<string, typeof SERVICE_GROUP_LANDINGS[number]>>((acc, s) => {
  acc[s.slug] = s; return acc;
}, {});

export function getCityFromSlug(slug: string) { return CITY_SLUGS[slug.toLowerCase()] ?? null; }
export function getServiceFromSlug(slug: string) { return SERVICE_SLUGS[slug.toLowerCase()] ?? null; }

/* ─────────────────────────────────────────── */

export default function HizmetSehir() {
  const { city: citySlug, service: serviceSlug } = useParams<{ city: string; service: string }>();
  const city = getCityFromSlug(citySlug ?? "");
  const service = getServiceFromSlug(serviceSlug ?? "");

  const [vendors, setVendors] = useState<PublicVendorApi[] | null>(null);
  const [stats, setStats] = useState<Record<string, ReviewStats>>({});

  useEffect(() => {
    apiGetVendors().then(setVendors).catch(() => setVendors([]));
  }, []);

  /* Filter vendors that serve this city + offer this service group */
  const matchingVendors = useMemo(() => {
    if (!vendors || !city || !service) return [];
    const groupKeys = SERVICE_KEYS.filter((k: ServiceKey) => SERVICE_META[k].group === service.group);
    return vendors.filter(v => {
      const inCity = v.regions?.some(r => r.toLowerCase().includes(city.toLowerCase()));
      const offersService = groupKeys.some(k => v.prices?.[k] && v.prices[k] > 0);
      return inCity && offersService;
    });
  }, [vendors, city, service]);

  useEffect(() => {
    if (matchingVendors.length === 0) return;
    apiGetReviewStats(matchingVendors.map(v => v.name))
      .then(setStats)
      .catch(() => {});
  }, [matchingVendors]);

  /* Average price from matching vendors for this group */
  const priceStats = useMemo(() => {
    if (!service || matchingVendors.length === 0) return null;
    const groupKeys = SERVICE_KEYS.filter((k: ServiceKey) => SERVICE_META[k].group === service.group);
    const prices: number[] = [];
    matchingVendors.forEach(v => {
      groupKeys.forEach(k => {
        const p = v.prices?.[k];
        if (p && p > 0) prices.push(p);
      });
    });
    if (prices.length === 0) return null;
    prices.sort((a,b)=>a-b);
    return {
      min: prices[0],
      max: prices[prices.length-1],
      avg: Math.round(prices.reduce((a,b)=>a+b,0) / prices.length),
    };
  }, [service, matchingVendors]);

  const seoTitle = city && service ? `${city} ${service.label} — Fiyatlar & Onaylı Firmalar 2026` : "Hizmet";
  const seoDesc = city && service
    ? `${city} ${service.label} hizmeti veren onaylı firmaları karşılaştırın. Ortalama fiyat ${(priceStats?.avg ?? service.priceFrom).toLocaleString("tr-TR")} TL'den başlar. Anında randevu, güvenli ödeme.`
    : "";

  useSEO({
    title: seoTitle,
    description: seoDesc,
    canonical: city && service ? `/hizmet/${citySlug}/${serviceSlug}` : "/firmalar",
    noIndex: !city || !service,
  });

  /* JSON-LD: Service + ItemList */
  useEffect(() => {
    if (!city || !service) return;
    const id = "ld-hizmet";
    document.getElementById(id)?.remove();
    const data = {
      "@context": "https://schema.org",
      "@type": "Service",
      "serviceType": service.label,
      "areaServed": { "@type": "City", "name": city },
      "provider": { "@type": "Organization", "name": "CleanLink", "url": BASE_URL },
      "url": `${BASE_URL}/hizmet/${citySlug}/${serviceSlug}`,
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "TRY",
        "lowPrice": priceStats?.min ?? service.priceFrom,
        "highPrice": priceStats?.max ?? service.priceFrom * 3,
        "offerCount": matchingVendors.length || 1,
      },
    };
    const s = document.createElement("script");
    s.id = id; s.type = "application/ld+json";
    s.textContent = JSON.stringify(data);
    document.head.appendChild(s);
    return () => { document.getElementById(id)?.remove(); };
  }, [city, service, citySlug, serviceSlug, priceStats, matchingVendors.length]);

  if (!city || !service) return <NotFound />;

  return (
    <PageLayout breadcrumbs={[
      { label: "Firmalar", href: "/firmalar" },
      { label: city, href: `/firmalar?sehir=${encodeURIComponent(city)}` },
      { label: service.label },
    ]}>
      {/* ─── Hero ─── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary/10 via-white to-violet-50 rounded-3xl border border-border p-6 md:p-10 mb-8 shadow-sm"
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3">
          <MapPin className="w-3 h-3" /> {city}
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
          {city}'da {service.label} — Onaylı Firmalar & Güncel Fiyatlar
        </h1>
        <p className="text-base text-foreground/80 leading-relaxed max-w-3xl mb-5">{service.intro}</p>
        <div className="flex flex-wrap gap-3 text-sm">
          <div className="bg-white border border-border rounded-xl px-4 py-2.5">
            <p className="text-xs text-muted-foreground">Ortalama Fiyat</p>
            <p className="font-bold text-foreground">{(priceStats?.avg ?? service.priceFrom).toLocaleString("tr-TR")} TL</p>
          </div>
          <div className="bg-white border border-border rounded-xl px-4 py-2.5">
            <p className="text-xs text-muted-foreground">Onaylı Firma</p>
            <p className="font-bold text-foreground">{matchingVendors.length}+</p>
          </div>
          <div className="bg-white border border-border rounded-xl px-4 py-2.5">
            <p className="text-xs text-muted-foreground">Hizmet Süresi</p>
            <p className="font-bold text-foreground">Aynı gün</p>
          </div>
        </div>
      </motion.section>

      {/* ─── Vendor list ─── */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-display font-bold text-foreground">
            {city}'daki {matchingVendors.length} firma
          </h2>
          <Link href="/firmalar" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
            Tüm firmalar <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {matchingVendors.length === 0 ? (
          <div className="bg-secondary/40 border border-border rounded-2xl p-8 text-center">
            <Search className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-foreground font-semibold mb-1">Bu bölgede henüz onaylı firma yok</p>
            <p className="text-sm text-muted-foreground mb-4">
              Yakında {city} için yeni firmalar eklenecek. Bu arada tüm firmalara göz atabilirsiniz.
            </p>
            <Link href="/firmalar" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition">
              Tüm Firmaları Gör <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matchingVendors.slice(0, 12).map(v => {
              const s = stats[v.name];
              const isPaid = v.isSubscribed || v.isSponsor;
              return (
                <Link key={v.id} href={`/firma/${toSlug(v.name)}`}
                  className="block bg-white rounded-2xl border border-border p-5 hover:border-primary hover:shadow-md transition group">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {v.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-foreground truncate group-hover:text-primary transition">{v.name}</h3>
                        {isPaid && <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                        {s && s.count > 0 ? (
                          <span className="inline-flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <strong className="text-foreground">{s.average}</strong> ({s.count})
                          </span>
                        ) : (
                          <span className="italic">Yorum bekleniyor</span>
                        )}
                        <span className="inline-flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-600" /> Onaylı</span>
                      </div>
                      {v.bio && <p className="text-xs text-muted-foreground line-clamp-2">{v.bio}</p>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── Why CleanLink ─── */}
      <section className="bg-white rounded-2xl border border-border p-6 md:p-8 mb-8">
        <h2 className="text-xl font-display font-bold text-foreground mb-4">{city}'da CleanLink ile {service.label} Neden Daha Avantajlı?</h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          {[
            { i: ShieldCheck, t: "Kimlik onaylı firmalar", d: "Her firma kimlik ve vergi belgesi ile doğrulanır." },
            { i: CheckCircle2, t: "Pilot dönem ödeme", d: "Ödeme hizmet sonunda doğrudan firmaya yapılır. Online ödeme ve taksit yakında." },
            { i: Star, t: "Gerçek müşteri yorumları", d: "Sadece tamamlanan siparişler için yorum yazılabilir." },
            { i: Calendar, t: "Anında randevu", d: "Aynı gün veya istediğiniz tarih için kolay rezervasyon." },
          ].map(({i:I, t, d}) => (
            <div key={t} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><I className="w-4 h-4 text-primary" /></div>
              <div><p className="font-semibold text-foreground">{t}</p><p className="text-muted-foreground text-xs leading-relaxed mt-0.5">{d}</p></div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Cross-links: other cities for same service ─── */}
      <section className="mb-8">
        <h3 className="text-lg font-bold text-foreground mb-3">Diğer Şehirlerde {service.label}</h3>
        <div className="flex flex-wrap gap-2">
          {CITIES.filter(c => c !== city).map(c => (
            <Link key={c} href={`/hizmet/${toSlug(c)}/${service.slug}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-border text-sm text-foreground hover:border-primary hover:text-primary transition">
              <MapPin className="w-3 h-3" /> {c}
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Cross-links: other services in same city ─── */}
      <section className="mb-8">
        <h3 className="text-lg font-bold text-foreground mb-3">{city}'da Diğer Temizlik Hizmetleri</h3>
        <div className="flex flex-wrap gap-2">
          {SERVICE_GROUP_LANDINGS.filter(s => s.slug !== service.slug).map(s => (
            <Link key={s.slug} href={`/hizmet/${citySlug}/${s.slug}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-border text-sm text-foreground hover:border-primary hover:text-primary transition">
              {s.label}
            </Link>
          ))}
        </div>
      </section>

      {/* ─── FAQ for SEO ─── */}
      <section className="bg-secondary/30 rounded-2xl border border-border p-6 md:p-8">
        <h2 className="text-xl font-display font-bold text-foreground mb-4">Sık Sorulan Sorular</h2>
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-semibold text-foreground">{city}'da {service.label} fiyatları ne kadar?</p>
            <p className="text-muted-foreground mt-1 leading-relaxed">
              CleanLink üzerindeki onaylı firmalara göre ortalama fiyat {(priceStats?.avg ?? service.priceFrom).toLocaleString("tr-TR")} TL'dir.
              {priceStats && ` En düşük ${priceStats.min.toLocaleString("tr-TR")} TL, en yüksek ${priceStats.max.toLocaleString("tr-TR")} TL.`}
              Fiyatlar; metrekare, kat, kirlilik düzeyi ve ek hizmetlere göre değişir.
            </p>
          </div>
          <div>
            <p className="font-semibold text-foreground">Aynı gün hizmet alabilir miyim?</p>
            <p className="text-muted-foreground mt-1 leading-relaxed">
              Evet. {city}'daki firmaların büyük çoğunluğu aynı gün veya ertesi gün randevu sunmaktadır. Uygun saat dilimini randevu sırasında seçebilirsiniz.
            </p>
          </div>
          <div>
            <p className="font-semibold text-foreground">Ödemeyi nasıl yapıyorum?</p>
            <p className="text-muted-foreground mt-1 leading-relaxed">
              Pilot dönemde ödeme hizmet sonunda doğrudan firmaya yapılır. Online ödeme ve 3 taksit altyapısı yakında devreye alınacaktır.
            </p>
          </div>
          <div>
            <p className="font-semibold text-foreground">Firmayı ben mi seçiyorum?</p>
            <p className="text-muted-foreground mt-1 leading-relaxed">
              Evet. {city}'da {service.label} sunan firmaları puan, fiyat ve yoruma göre karşılaştırır, dilediğinize randevu verirsiniz.
            </p>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
