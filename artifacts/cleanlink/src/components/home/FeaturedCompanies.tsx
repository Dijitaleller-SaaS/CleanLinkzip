import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  Star, ShieldCheck, MapPin, ChevronLeft, ChevronRight,
  Home, SprayCan, EyeOff, Layers, Sofa, Wind, Lock, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FirmaProfilModal, FirmaData } from "@/components/firma/FirmaProfilModal";
import { useApp, ADMIN_EMAIL, defaultFirmaProfile, defaultPrices, defaultScopes, SERVICE_META, type VendorEntry, type ServiceKey } from "@/context/AppContext";
import { apiAdminSetVisibilityByName } from "@/lib/api";
import { useLocation } from "wouter";
import { getFirmaSlugFromUrl, toSlug } from "@/lib/analytics";

const COMPANIES: FirmaData[] = [
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
    services: (() => {
      const active = (Object.entries(prices) as [ServiceKey, number][])
        .filter(([, p]) => p > 0)
        .slice(0, 3)
        .map(([key, price]) => ({
          name:  SERVICE_META[key].label,
          price: price.toLocaleString("tr-TR"),
          unit:  SERVICE_META[key].unit.replace("TL / ", "/ "),
          scope: scopes[key] || "",
        }));
      return active.length > 0 ? active : [
        { name: "Hizmet bilgisi yakında", price: "—", unit: "", scope: "" },
      ];
    })(),
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

  /* ── Multi-kart carousel: masaüstünde 3 kart aynı anda, oklarla kaydır ── */
  const VISIBLE = 3;          // masaüstünde aynı anda görünen kart sayısı
  const CARD_STEP = 340;      // 320px kart + 20px gap
  const LOOP_THRESHOLD = 24;  // 24 pilot firmada döngü devreye girer

  const canLoop = carouselFirms.length >= LOOP_THRESHOLD;
  const maxScrollIdx = Math.max(0, carouselFirms.length - VISIBLE);

  const [currentIdx, setCurrentIdx] = useState(0);
  const skipTransitionRef = useRef(false);

  useEffect(() => { setCurrentIdx(0); }, [carouselFirms.length]);

  const handleArrow = useCallback((dir: 1 | -1) => {
    const N = carouselFirms.length;
    if (N <= VISIBLE) return;
    setCurrentIdx(prev => {
      if (canLoop) return ((prev + dir) % N + N) % N;
      return Math.max(0, Math.min(prev + dir, maxScrollIdx));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carouselFirms.length, canLoop, maxScrollIdx]);

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

                  {/* Firma sahibi: kendi kartında Yönet butonu */}
                  {!isAdmin && user?.type === "firma" && user.name === company.name && (
                    <div className="absolute top-2 left-2 z-10">
                      <button
                        onClick={e => { e.stopPropagation(); navigate("/firma-dashboard"); }}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/90 hover:bg-primary text-white text-[10px] font-bold transition-colors"
                      >
                        <Settings className="w-2.5 h-2.5" /> Yönet
                      </button>
                    </div>
                  )}

                  {/* Admin: yönet + kaldır */}
                  {isAdmin && (
                    <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/admin-dashboard?firma=${encodeURIComponent(company.name)}`); }}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/90 hover:bg-primary text-white text-[10px] font-bold transition-colors"
                      >
                        <Settings className="w-2.5 h-2.5" /> Yönet
                      </button>
                      <button
                        onClick={e => handleAdminRemove(e, company.name)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/90 hover:bg-red-600 text-white text-[10px] font-bold transition-colors"
                      >
                        <EyeOff className="w-2.5 h-2.5" /> Kaldır
                      </button>
                    </div>
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

      {/* Desktop: 3 kart yan yana, oklarla kaydır — mobilde gizli */}
      <div className="relative hidden md:block">
        {/* Sol ok — N > 3 ve başta değilsek (veya döngü modunda) */}
        {carouselFirms.length > VISIBLE && (canLoop || currentIdx > 0) && (
          <button
            onClick={() => handleArrow(-1)}
            className="absolute left-4 top-[45%] -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white shadow-lg border border-border flex items-center justify-center text-foreground hover:bg-primary hover:text-white hover:border-primary transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {/* Sağ ok — N > 3 ve sonda değilsek (veya döngü modunda) */}
        {carouselFirms.length > VISIBLE && (canLoop || currentIdx < maxScrollIdx) && (
          <button
            onClick={() => handleArrow(1)}
            className="absolute right-4 top-[45%] -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white shadow-lg border border-border flex items-center justify-center text-foreground hover:bg-primary hover:text-white hover:border-primary transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Kart bandı — overflow ile kırpılır, 3 kart görünür */}
        <div className="overflow-hidden px-16 pb-4">
          <div
            className={`flex gap-5 ${skipTransitionRef.current ? "" : "transition-transform duration-500"}`}
            style={{ transform: `translateX(calc(-${currentIdx} * ${CARD_STEP}px))` }}
          >
            {carouselFirms.map((company, index) => (
              <div key={`${company.id}-${index}`} className="w-[320px] flex-shrink-0">
                {renderCard(company, index)}
              </div>
            ))}
          </div>
        </div>

        {/* Nokta göstergeler — yalnızca 4–7 firma arasında, 24+'da sadece oklar yeterli */}
        {carouselFirms.length > VISIBLE && carouselFirms.length < LOOP_THRESHOLD && (
          <div className="flex justify-center gap-2 pb-4">
            {Array.from({ length: maxScrollIdx + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIdx(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === currentIdx ? "w-6 bg-primary" : "w-2 bg-primary/25"
                }`}
              />
            ))}
          </div>
        )}
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
