import { useState, useMemo, useEffect, useRef } from "react";
import {
  Star, ShieldCheck, MapPin, ChevronLeft, ChevronRight,
  Home, SprayCan, EyeOff, Layers, Sofa, Wind, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FirmaProfilModal, FirmaData } from "@/components/firma/FirmaProfilModal";
import { useApp, ADMIN_EMAIL, defaultFirmaProfile, defaultPrices, defaultScopes, type VendorEntry } from "@/context/AppContext";
import { apiAdminSetVisibilityByName } from "@/lib/api";
import { useLocation } from "wouter";
import { getFirmaSlugFromUrl, toSlug } from "@/lib/analytics";

const COMPANIES: FirmaData[] = [
  {
    id: 1, name: "Gün Temizlik Hizmetleri",
    rating: 4.8, reviews: 0, location: "İstanbul / Şişli",
    tags: ["Koltuk Yıkama", "Halı Yıkama", "Ev Temizliği"],
    verified: true, isPremium: true, badge: "pilot", image: "", phone: "",
    bio: "Koltuk, halı ve ev temizliğinde profesyonel çözümler. Buharlı yıkama teknolojisi ve çevre dostu ürünlerle temiz bir yaşam alanı.",
    founded: "2023", completedJobs: 0, hasPati: false, isNatureFriendly: false,
    certs: [{ label: "Sigortalı Hizmet", icon: ShieldCheck, color: "bg-blue-100 text-blue-600", bg: "bg-blue-50 border-blue-100" }],
    services: [
      { name: "L Koltuk Yıkama", price: "600", unit: "/ set", scope: "Buharlı derin temizlik, leke ve koku giderme." },
      { name: "Halı Yıkama", price: "35", unit: "/ m²", scope: "Endüstriyel yıkama, organik deterjan, kuru teslim." },
      { name: "2+1 Ev Temizliği", price: "1.400", unit: "/ ziyaret", scope: "Tüm odalar, mutfak, banyo dezenfeksiyonu dahil." },
    ],
    galleryColors: [
      { gradient: "from-emerald-400 to-teal-500", icon: Sofa, label: "Koltuk Yıkama" },
      { gradient: "from-teal-400 to-primary", icon: Layers, label: "Halı Yıkama" },
      { gradient: "from-cyan-400 to-sky-500", icon: Home, label: "Ev Temizliği" },
    ],
    reviewList: [],
  },
  {
    id: 2, name: "Cleanlink Temizlik",
    rating: 4.9, reviews: 0, location: "İstanbul / Beşiktaş",
    tags: ["Ev Temizliği", "Ofis", "Derin Temizlik"],
    verified: true, isPremium: true, badge: "pilot", image: "", phone: "",
    bio: "Ev, ofis ve inşaat sonrası temizlik hizmetlerinde güvenilir çözüm ortağınız. Çevre dostu ürünler ve eğitimli personel ile kaliteli hizmet.",
    founded: "2024", completedJobs: 0, hasPati: true, isNatureFriendly: true,
    certs: [{ label: "Sigortalı Hizmet", icon: ShieldCheck, color: "bg-blue-100 text-blue-600", bg: "bg-blue-50 border-blue-100" }],
    services: [
      { name: "2+1 Ev Temizliği", price: "1.500", unit: "/ ziyaret", scope: "Tüm odalar, mutfak, banyo dezenfeksiyonu dahil." },
      { name: "3+1 Ev Temizliği", price: "2.200", unit: "/ ziyaret", scope: "Balkon, dolap içleri ve fırın temizliği de dahil." },
      { name: "Ofis Temizliği", price: "850", unit: "/ gün", scope: "50m²'ye kadar ofis, ortak alan ve tuvalet." },
    ],
    galleryColors: [
      { gradient: "from-teal-400 to-primary", icon: Home, label: "Ev Temizliği" },
      { gradient: "from-emerald-400 to-teal-500", icon: SprayCan, label: "Derin Temizlik" },
      { gradient: "from-cyan-400 to-sky-500", icon: Wind, label: "Ofis Temizliği" },
    ],
    reviewList: [],
  },
  {
    id: 3, name: "Elitplus+ Koltuk Yıkama",
    rating: 4.9, reviews: 0, location: "İstanbul / Gaziosmanpaşa",
    tags: ["Koltuk Yıkama", "Araç İçi", "Buharlı"],
    verified: true, isPremium: true, badge: "pilot", image: "", phone: "",
    bio: "Buharlı yıkama teknolojisiyle koltuk, L koltuk ve araç içi temizliğinde uzman. Aynı gün servis ve hızlı kuruma garantisi.",
    founded: "2024", completedJobs: 0, hasPati: true, isNatureFriendly: true,
    certs: [{ label: "Sigortalı Hizmet", icon: ShieldCheck, color: "bg-blue-100 text-blue-600", bg: "bg-blue-50 border-blue-100" }],
    services: [
      { name: "L Koltuk Yıkama", price: "650", unit: "/ set", scope: "Buharlı derin temizlik, leke ve koku giderme." },
      { name: "Tekli Koltuk", price: "200", unit: "/ adet", scope: "Standart koltuk buharlı yıkama." },
      { name: "Araç İçi Temizlik", price: "450", unit: "/ araç", scope: "Koltuk ve tavan buharlı yıkama, koku giderme." },
    ],
    galleryColors: [
      { gradient: "from-sky-400 to-blue-500", icon: Sofa, label: "Koltuk Yıkama" },
      { gradient: "from-blue-400 to-indigo-500", icon: Wind, label: "Buhar Sistemi" },
      { gradient: "from-indigo-400 to-violet-500", icon: SprayCan, label: "Araç İçi" },
    ],
    reviewList: [],
  },
];

const BADGE_CARD = {
  one_cikan: { label: "⭐ Öne Çıkan", style: "bg-violet-100 text-violet-700 border-violet-200" },
  acil: { label: "⚡ Acil Hizmet", style: "bg-orange-100 text-orange-700 border-orange-200" },
  en_iyi_fiyat: { label: "💰 En İyi Fiyat", style: "bg-green-100 text-green-700 border-green-200" },
  pilot: { label: "🚀 Pilot Firma", style: "bg-teal-100 text-teal-700 border-teal-200" },
};

/** Firms with 500+ completed jobs earn the "Doğa Dostu İşletme" badge */
const NATURE_FRIENDLY_THRESHOLD = 500;

/** Convert a dynamic vendor into a minimal FirmaData card for the vitrin */
function buildFirmaData(v: VendorEntry, idx: number): FirmaData {
  const regions = v.regions ?? [];
  const bio = v.bio ?? "";
  const prices = { ...defaultPrices, ...(v.prices ?? {}) };
  const scopes = { ...defaultScopes, ...(v.serviceScopes ?? {}) };
  return {
    id: 100 + idx,
    userId: v.userId,
    name: v.name,
    rating: 4.5,
    reviews: 0,
    location: v.district ? `${v.city ?? "İstanbul"} / ${v.district}` : (regions[0] ? `${regions[0]}, İstanbul` : (v.city ?? "İstanbul")),
    tags: regions.slice(0, 3).length ? regions.slice(0, 3) : ["Ev Temizliği"],
    verified: true,
    isPremium: v.isSponsor ?? false,
    isSubscribed: v.isSubscribed ?? false,
    isSponsor: v.isSponsor ?? false,
    badge: null,
    hasPati: v.hasPati ?? false,
    isNatureFriendly: v.isNatureFriendly ?? false,
    image: "",
    phone: v.phone ?? "",
    bio: bio || "Profesyonel temizlik hizmetleri.",
    founded: new Date().getFullYear().toString(),
    completedJobs: 0,
    certs: [],
    services: [
      { name: "2+1 Ev Temizliği",  price: prices.ev2p1.toString(),        unit: "/ ziyaret", scope: scopes.ev2p1 || "" },
      { name: "L Koltuk Yıkama",   price: prices.koltukL.toString(),      unit: "/ set",     scope: scopes.koltukL || "" },
      { name: "Halı Yıkama",       price: prices.haliStandart.toString(),  unit: "/ m²",     scope: scopes.haliStandart || "" },
      { name: "Ofis Temizliği",    price: prices.ofis.toString(),          unit: "/ gün",    scope: scopes.ofis || "" },
    ],
    galleryColors: [
      { gradient: "from-teal-400 to-primary", icon: Home, label: "Ev Temizliği" },
      { gradient: "from-emerald-400 to-teal-500", icon: SprayCan, label: "Derin Temizlik" },
    ],
    reviewList: [],
  };
}

const COMPANY_NAMES = new Set(COMPANIES.map(c => c.name));

export function FeaturedCompanies() {
  const [selected, setSelected] = useState<FirmaData | null>(null);
  const [showAllMobile, setShowAllMobile] = useState(false);
  const [, navigate] = useLocation();
  /* Context gives us live firmaProfile so "Reklamı Başlat" instantly reflects here */
  const { user, firmaProfile, vendors, refreshVendors, setShowAuthModal, setAuthMode } = useApp();

  const isAdmin = user?.email === ADMIN_EMAIL;

  const handleAdminRemove = (e: React.MouseEvent, firmaName: string) => {
    e.stopPropagation();
    apiAdminSetVisibilityByName(firmaName, true)
      .then(() => refreshVendors())
      .catch(() => void 0);
  };

  /* ?firma=slug deep-link: sayfa yüklenince URL parametresini okuyup ilgili modalı aç */
  useEffect(() => {
    const slug = getFirmaSlugFromUrl();
    if (!slug) return;
    const allFirms = [...COMPANIES, ...vendors
      .filter(v => v.isPublished && !COMPANY_NAMES.has(v.name))
      .map((v, i) => buildFirmaData(v, i))
    ];
    const match = allFirms.find(f => toSlug(f.name) === slug);
    if (match) setSelected(match);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getLiveProfile = (companyName: string) => {
    /* If the logged-in firma is THIS company, use the live context profile (triggers re-render) */
    if (user?.type === "firma" && user.name === companyName) {
      return firmaProfile;
    }
    return { ...defaultFirmaProfile };
  };

  /* All published DB vendors not already represented in static COMPANIES */
  const dynamicVendors = useMemo(() =>
    vendors
      .filter(v => v.isPublished && !COMPANY_NAMES.has(v.name))
      .map((v, i) => buildFirmaData(v, i))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  , [vendors]);

  /* Carousel = DB vendors first, then static COMPANIES — each firm exactly once */
  const carouselFirms = useMemo(() => {
    const dbNames = new Set(dynamicVendors.map(d => d.name));
    const staticFirms = COMPANIES.filter(c => !dbNames.has(c.name));
    return [...dynamicVendors, ...staticFirms];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dynamicVendors, user?.name]);

  /* ── rAF auto-scroll: 40 px/s, pauses on hover & after arrow click ── */
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    if (carouselFirms.length === 0) return;
    const el = trackRef.current;
    if (!el) return;
    let raf = 0;
    let prev = 0;
    const SPEED = 40; // px/s
    const tick = (now: number) => {
      if (!pausedRef.current && el) {
        const dt = prev ? (now - prev) / 1000 : 0;
        el.scrollLeft += SPEED * dt;
        if (el.scrollLeft >= el.scrollWidth / 2) el.scrollLeft -= el.scrollWidth / 2;
      }
      prev = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [carouselFirms.length]);

  const handleArrow = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    pausedRef.current = true;
    el.scrollBy({ left: dir * 320, behavior: "smooth" });
    setTimeout(() => { pausedRef.current = false; }, 1000);
  };

  const renderCard = (company: FirmaData, index: number, mobileGrid = false) => {
    const liveProfile = getLiveProfile(company.name);
    const vendorData = vendors.find(v => v.name === company.name);
    const firstGalleryImg = (vendorData?.galleryUrls ?? [])[0] ?? null;
    const galleryCount = vendorData?.galleryUrls?.length || company.galleryColors.length;
    const effectiveSponsor = vendorData?.isSponsor ?? liveProfile.isSponsor ?? false;
    const isVip = effectiveSponsor;
    const liveRegions = liveProfile.regions;
    const cardBadge = company.badge ? BADGE_CARD[company.badge] : null;
    return (
      <div
        key={`${company.id}-${index}`}
        className={`${mobileGrid ? "w-full" : "w-[280px] md:w-[320px] flex-shrink-0"} bg-white rounded-3xl border border-border shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 group flex flex-col relative overflow-hidden cursor-pointer`}
        onClick={() => {
          if (user?.type === "firma" && user.name === company.name) {
            navigate("/firma-dashboard");
            return;
          }
          setSelected(company);
        }}
      >
                {/* Gallery preview strip */}
                <div className={`h-28 ${firstGalleryImg ? "bg-gray-900" : `bg-gradient-to-br ${company.galleryColors[0].gradient}`} flex items-center justify-center relative overflow-hidden`}>
                  {firstGalleryImg
                    ? <img src={firstGalleryImg} alt={company.name} className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
                    : (() => { const Icon = company.galleryColors[0].icon; return <Icon className="w-12 h-12 text-white/30" />; })()
                  }

                  {/* Elite 24 / Sponsorlu badge — top right */}
                  {isVip ? (
                    <div className="absolute top-3 right-3 bg-amber-400 text-amber-900 text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide shadow-lg flex items-center gap-1">
                      ★ Elite 24
                    </div>
                  ) : (
                    <div className="absolute top-3 right-3 bg-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide shadow-lg">
                      Sponsorlu
                    </div>
                  )}

                  {/* Dynamic label — top left */}
                  {cardBadge && !isAdmin && (
                    <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full border text-[10px] font-bold ${cardBadge.style}`}>
                      {cardBadge.label}
                    </div>
                  )}

                  {/* Admin: remove from featured */}
                  {isAdmin && (
                    <button
                      onClick={e => handleAdminRemove(e, company.name)}
                      className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/90 hover:bg-red-600 text-white text-[10px] font-bold transition-colors z-10"
                    >
                      <EyeOff className="w-2.5 h-2.5" />
                      Yayından Kaldır
                    </button>
                  )}

                  <div className="absolute bottom-2 left-3 flex gap-1">
                    {Array.from({ length: galleryCount }).map((_, i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/60" />
                    ))}
                  </div>
                  <div className="absolute bottom-2 right-3 bg-black/25 text-white text-xs px-2 py-0.5 rounded-full">
                    {galleryCount} fotoğraf
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  {/* Identity */}
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div>
                      <h3 className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5 flex-wrap">
                        {company.name}
                        {company.verified && (
                          <span title="Onaylı Firma">
                            <ShieldCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          </span>
                        )}
                      </h3>
                      {/* Rozet satırı — tek flex row */}
                      {((company.isNatureFriendly || (company.completedJobs ?? 0) >= NATURE_FRIENDLY_THRESHOLD) || company.hasPati) && (
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          {(company.isNatureFriendly || (company.completedJobs ?? 0) >= NATURE_FRIENDLY_THRESHOLD) && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 text-[10px] font-bold">
                              🌳 Doğa Dostu İşletme
                            </span>
                          )}
                          {company.hasPati && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-bold">
                              🐾 Pati Seçeneği
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center text-sm text-muted-foreground mt-0.5">
                        <MapPin className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                        {company.location}
                      </div>
                      {/* Live service regions from firma panel */}
                      {liveRegions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {liveRegions.slice(0, 3).map(r => (
                            <span key={r} className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-medium">
                              {r}
                            </span>
                          ))}
                          {liveRegions.length > 3 && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-secondary text-muted-foreground rounded font-medium">
                              +{liveRegions.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 bg-yellow-100/60 text-yellow-700 px-2.5 py-1 rounded-lg font-bold text-sm flex-shrink-0">
                      <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                      {company.rating}
                    </div>
                  </div>

                  {/* Reviews count */}
                  <p className="text-xs text-muted-foreground mb-3">
                    {company.reviews} değerlendirme · {company.completedJobs}+ iş tamamlandı
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-5 flex-grow">
                    {company.tags.map(tag => (
                      <span key={tag} className="px-2.5 py-1 bg-secondary text-primary rounded-full text-xs font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Starting price — misafirlerden gizlenir */}
                  <div className="flex items-baseline gap-1 mb-4">
                    {user ? (
                      <>
                        <span className="text-xs text-muted-foreground">Başlayan fiyat</span>
                        <span className="font-bold text-foreground ml-1">
                          {(() => {
                            const prices = Object.values(liveProfile.prices).filter((p): p is number => typeof p === "number" && p > 0);
                            const minPrice = prices.length > 0 ? Math.min(...prices) : null;
                            return minPrice !== null ? minPrice.toLocaleString("tr-TR") : company.services[0]?.price;
                          })()} TL
                        </span>
                        <span className="text-xs text-muted-foreground">{company.services[0]?.unit}</span>
                      </>
                    ) : (
                      <button
                        onClick={() => { setAuthMode("musteri"); setShowAuthModal(true); }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold border border-primary/20 hover:bg-primary/20 transition-colors"
                      >
                        <Lock className="w-3 h-3" />
                        Fiyatları Görmek İçin Üye Olun
                      </button>
                    )}
                  </div>

                  <Button
                    onClick={e => { e.stopPropagation(); setSelected(company); }}
                    className="w-full bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white rounded-xl h-12 font-semibold transition-all"
                  >
                    Profil ve Fiyatlar
                  </Button>
                </div>
      </div>
    );
  };

  return (
    <section id="hizmetler" className="py-24 bg-white relative overflow-hidden">
      <FirmaProfilModal firma={selected} onClose={() => setSelected(null)} />

      {/* Section header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Öne Çıkan Firmalar
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Bölgenizdeki en yüksek puanlı ve güvenilir temizlik firmalarını keşfedin.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/firmalar")}
            className="rounded-full px-6 font-medium text-primary border-primary/20 hover:bg-primary/5 hover:text-primary flex-shrink-0"
          >
            Tümünü Gör <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Desktop: sonsuz carousel — mobilde gizli */}
      <div className="relative hidden md:block">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-14 z-10 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-14 z-10 bg-gradient-to-l from-white to-transparent" />
        <button
          onClick={() => handleArrow(-1)}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white shadow-lg border border-border flex items-center justify-center text-foreground hover:bg-primary hover:text-white hover:border-primary transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleArrow(1)}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white shadow-lg border border-border flex items-center justify-center text-foreground hover:bg-primary hover:text-white hover:border-primary transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <div
          ref={trackRef}
          className="overflow-x-scroll scrollbar-none px-14 pb-4 flex flex-nowrap gap-5"
          onMouseEnter={() => { pausedRef.current = true; }}
          onMouseLeave={() => { pausedRef.current = false; }}
        >
          {[...carouselFirms, ...carouselFirms].map((company, index) => renderCard(company, index))}
        </div>
      </div>

      {/* Mobil: 2 sütun grid, ilk 2 kart görünür + "Daha Fazla Gör" — masaüstünde gizli */}
      <div className="md:hidden px-4 pb-6">
        <div className="grid grid-cols-1 gap-3">
          {carouselFirms.slice(0, 2).map((company, i) => renderCard(company, i, true))}
        </div>

        {carouselFirms.length > 2 && (
          <>
            <div
              style={{ display: "grid", gridTemplateRows: showAllMobile ? "1fr" : "0fr" }}
              className="transition-[grid-template-rows] duration-500 ease-out"
            >
              <div className="overflow-hidden">
                <div className="grid grid-cols-1 gap-3 pt-3">
                  {carouselFirms.slice(2).map((company, i) => renderCard(company, i + 2, true))}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowAllMobile(v => !v)}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-primary/20 bg-primary/5 text-primary font-semibold text-sm hover:bg-primary/10 active:scale-95 transition-all"
            >
              {showAllMobile ? (
                <>Daha Az Gör <ChevronLeft className="w-4 h-4 -rotate-90" /></>
              ) : (
                <>Daha Fazla Gör <ChevronRight className="w-4 h-4 rotate-90" /></>
              )}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
