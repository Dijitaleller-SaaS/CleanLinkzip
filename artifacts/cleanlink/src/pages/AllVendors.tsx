import { useState, useMemo } from "react";
import { useSEO } from "@/hooks/useSEO";
import { motion } from "framer-motion";
import { Search, MapPin, Star, ArrowLeft, Globe, SprayCan, Home, Sofa, Layers, EyeOff, CheckCircle2, CalendarClock, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { FirmaProfilModal, FirmaData } from "@/components/firma/FirmaProfilModal";
import { useApp, loadFirmaProfile, ADMIN_EMAIL, approveFirmaHavale, extendFirmaSubscription, isSubExpired, defaultPrices, defaultScopes, type VendorEntry } from "@/context/AppContext";
import { toSlug } from "@/lib/analytics";
import { apiAdminSetVisibilityByName } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

/* Static display enrichment for known seed vendors */
const STATIC_FIRM_DATA: Record<string, Partial<FirmaData>> = {
  "Yıldız Temizlik": {
    id: 1, rating: 4.9, reviews: 342,
    location: "Kadıköy, İstanbul", tags: ["Ev", "Ofis", "İnşaat Sonrası"],
    verified: true, isPremium: true, badge: "one_cikan", image: "company-1.png",
    phone: "0532 111 22 33",
    bio: "2015 yılından bu yana İstanbul'un Anadolu yakasında profesyonel ev, ofis ve inşaat sonrası temizlik hizmeti sunuyoruz.",
    founded: "2015", completedJobs: 1200, certs: [],
    services: [{ name: "2+1 Ev Temizliği", price: "1.500", unit: "/ ziyaret", scope: "" }],
    galleryColors: [{ gradient: "from-teal-400 to-primary", icon: Home, label: "Ev Temizliği" }],
    reviewList: [],
  },
  "Usta Yıkama": {
    id: 2, rating: 4.8, reviews: 128,
    location: "Beşiktaş, İstanbul", tags: ["Koltuk", "Halı", "Araç İçi"],
    verified: true, isPremium: true, badge: "acil", image: "company-2.png",
    phone: "0533 444 55 66",
    bio: "Buharlı yıkama teknolojisiyle koltuk, halı ve araç içi temizliğinde İstanbul'un lider firmasıyız.",
    founded: "2018", completedJobs: 650, certs: [],
    services: [{ name: "L Koltuk Yıkama", price: "600", unit: "/ set", scope: "" }],
    galleryColors: [{ gradient: "from-sky-400 to-blue-500", icon: Sofa, label: "Koltuk Yıkama" }],
    reviewList: [],
  },
  "Parlak Evler": {
    id: 3, rating: 4.7, reviews: 89,
    location: "Şişli, İstanbul", tags: ["Ev", "Ofis", "Aylık Abonelik"],
    verified: false, isPremium: true, badge: "en_iyi_fiyat", image: "company-3.png",
    phone: "0544 777 88 99",
    bio: "Bütçe dostu fiyatlarla standart altına düşmeden temizlik yapan genç ve dinamik ekibiz.",
    founded: "2021", completedJobs: 280, certs: [],
    services: [{ name: "2+1 Ev Temizliği", price: "1.100", unit: "/ ziyaret", scope: "" }],
    galleryColors: [{ gradient: "from-green-400 to-emerald-500", icon: Home, label: "Ev Temizliği" }],
    reviewList: [],
  },
  "Kristal Temizlik": {
    id: 4, rating: 4.8, reviews: 215,
    location: "Ataşehir, İstanbul", tags: ["Halı", "Yorgan", "Yatak Yıkama"],
    verified: true, isPremium: true, badge: "one_cikan", image: "company-4.png",
    phone: "0541 234 56 78",
    bio: "Halı, yatak ve yorgan yıkamada Anadolu yakasının güvenilir ismi.",
    founded: "2017", completedJobs: 890, certs: [],
    services: [
      { name: "Halı Yıkama", price: "120", unit: "/ m²", scope: "" },
      { name: "Yatak Yıkama", price: "750", unit: "/ adet", scope: "" },
    ],
    galleryColors: [{ gradient: "from-sky-400 to-cyan-500", icon: Globe, label: "Halı Yıkama" }],
    reviewList: [],
  },
  "Anadolu Yıkama": {
    id: 5, rating: 4.6, reviews: 163,
    location: "Pendik, İstanbul", tags: ["Koltuk", "Araç İçi", "Sandalye"],
    verified: true, isPremium: true, badge: "acil", image: "company-5.png",
    phone: "0542 876 54 32",
    bio: "Koltuk, araç koltuğu ve cafe-restoran sandalye yıkamada hızlı ve güvenilir hizmet.",
    founded: "2019", completedJobs: 540, certs: [],
    services: [
      { name: "L Koltuk Takımı", price: "600", unit: "/ set", scope: "" },
      { name: "Araç Koltuk", price: "400", unit: "/ araç", scope: "" },
    ],
    galleryColors: [{ gradient: "from-amber-400 to-orange-500", icon: Sofa, label: "Koltuk Yıkama" }],
    reviewList: [],
  },
  "Pırıl Temizlik": {
    id: 6, rating: 4.7, reviews: 97,
    location: "Maltepe, İstanbul", tags: ["İpek Halı", "Bambu", "Yün Halı"],
    verified: true, isPremium: true, badge: "en_iyi_fiyat", image: "company-6.png",
    phone: "0543 654 32 10",
    bio: "Değerli halılarınız için özel bakım uzmanıyız. İpek, bambu, yün ve kilim halı uzmanı.",
    founded: "2016", completedJobs: 620, certs: [],
    services: [
      { name: "İpek Halı", price: "300", unit: "/ m²", scope: "" },
      { name: "Bambu Halı", price: "300", unit: "/ m²", scope: "" },
    ],
    galleryColors: [{ gradient: "from-violet-400 to-purple-500", icon: Layers, label: "İpek & Bambu" }],
    reviewList: [],
  },
};

function buildCard(vendor: VendorEntry, idx: number): FirmaData {
  const staticData = STATIC_FIRM_DATA[vendor.name];
  if (staticData) {
    const prices = { ...defaultPrices, ...(vendor.prices ?? {}) };
    const scopes = { ...defaultScopes, ...(vendor.serviceScopes ?? {}) };
    return {
      id: staticData.id ?? 200 + idx,
      name: vendor.name,
      rating: staticData.rating ?? 4.5,
      reviews: staticData.reviews ?? 0,
      location: staticData.location ?? (vendor.regions?.[0] ? `${vendor.regions[0]}, İstanbul` : "İstanbul"),
      tags: staticData.tags ?? (vendor.regions?.slice(0, 3).length ? vendor.regions.slice(0, 3) : ["Ev Temizliği"]),
      verified: staticData.verified ?? false,
      isPremium: vendor.isSponsor ?? staticData.isPremium ?? false,
      badge: staticData.badge ?? null,
      image: staticData.image ?? "",
      phone: staticData.phone ?? "",
      bio: vendor.bio || staticData.bio || "Profesyonel temizlik hizmetleri.",
      founded: staticData.founded ?? new Date().getFullYear().toString(),
      completedJobs: staticData.completedJobs ?? 0,
      certs: staticData.certs ?? [],
      services: staticData.services ?? [
        { name: "2+1 Ev Temizliği", price: prices.ev2p1.toString(), unit: "/ ziyaret", scope: scopes.ev2p1 || "" },
      ],
      galleryColors: staticData.galleryColors ?? [
        { gradient: "from-teal-400 to-primary", icon: Home, label: "Ev Temizliği" },
      ],
      reviewList: staticData.reviewList ?? [],
    };
  }

  const p = loadFirmaProfile(vendor.name);
  const prices = { ...defaultPrices, ...p.prices, ...(vendor.prices && Object.keys(vendor.prices).length > 0 ? vendor.prices : {}) };
  const scopes = { ...defaultScopes, ...p.serviceScopes, ...(vendor.serviceScopes && Object.keys(vendor.serviceScopes).length > 0 ? vendor.serviceScopes : {}) };
  return {
    id: 200 + idx,
    name: vendor.name,
    rating: 4.5,
    reviews: 0,
    location: p.regions[0] ? `${p.regions[0]}, İstanbul` : (vendor.regions?.[0] ? `${vendor.regions[0]}, İstanbul` : "İstanbul"),
    tags: p.regions.slice(0, 3).length ? p.regions.slice(0, 3) : (vendor.regions?.slice(0, 3) ?? ["Ev Temizliği"]),
    verified: false,
    isPremium: vendor.isSponsor ?? p.isSponsor,
    isSubscribed: vendor.isSubscribed ?? p.isSubscribed,
    badge: null,
    image: "",
    phone: "",
    bio: p.bio || vendor.bio || "Profesyonel temizlik hizmetleri.",
    founded: new Date().getFullYear().toString(),
    completedJobs: 0,
    certs: [],
    services: [
      { name: "2+1 Ev Temizliği", price: prices.ev2p1.toString(), unit: "/ ziyaret", scope: scopes.ev2p1 || "" },
      { name: "L Koltuk Yıkama",  price: prices.koltukL.toString(), unit: "/ set", scope: scopes.koltukL || "" },
      { name: "Halı Yıkama",      price: prices.haliStandart.toString(), unit: "/ m²", scope: scopes.haliStandart || "" },
      { name: "Ofis Temizliği",   price: prices.ofis.toString(), unit: "/ gün", scope: scopes.ofis || "" },
    ],
    galleryColors: [
      { gradient: "from-teal-400 to-primary", icon: Home, label: "Ev Temizliği" },
      { gradient: "from-emerald-400 to-teal-500", icon: SprayCan, label: "Derin Temizlik" },
      { gradient: "from-sky-400 to-blue-500", icon: Sofa, label: "Koltuk Yıkama" },
    ],
    reviewList: [],
  };
}

type VendorStatusOverride = { isSponsor: boolean; isSubscribed: boolean; subscriptionPending: boolean; yayinaGirisTarihi: number | undefined };

export default function AllVendors() {
  useSEO({
    title: "Temizlik Firmaları — Onaylı Profesyoneller",
    description: "Bölgenizdeki en iyi ev temizliği, koltuk yıkama, halı yıkama ve araç koltuk yıkama firmalarını keşfedin. Fiyatları karşılaştırın, anında rezervasyon yapın.",
    canonical: "/firmalar",
  });
  const [, navigate] = useLocation();
  const { user, vendors, refreshVendors } = useApp();
  const { toast } = useToast();
  const [selected, setSelected] = useState<FirmaData | null>(null);
  const [query, setQuery] = useState("");
  const [vendorOverrides, setVendorOverrides] = useState<Record<string, VendorStatusOverride>>({});
  const [loadingActions, setLoadingActions] = useState<Record<string, "approve" | "extend">>({});

  const isAdmin = user?.email === ADMIN_EMAIL;

  const handleAdminRemove = (e: React.MouseEvent, firmaName: string) => {
    e.stopPropagation();
    apiAdminSetVisibilityByName(firmaName, true)
      .then(() => refreshVendors())
      .catch(() => void 0);
  };

  const handleApproveHavale = (e: React.MouseEvent, firmaName: string) => {
    e.stopPropagation();
    setLoadingActions(prev => ({ ...prev, [firmaName]: "approve" }));
    approveFirmaHavale(firmaName)
      .then(v => {
        setVendorOverrides(prev => ({ ...prev, [firmaName]: { isSponsor: v.isSponsor, isSubscribed: v.isSubscribed, subscriptionPending: v.subscriptionPending, yayinaGirisTarihi: v.yayinaGirisTarihi ?? undefined } }));
        toast({ title: "Havale onaylandı", description: `${firmaName} aboneliği aktifleştirildi.` });
      })
      .catch(() => {
        toast({ title: "Hata", description: "Havale onaylanırken bir sorun oluştu. Lütfen tekrar deneyin.", variant: "destructive" });
      })
      .finally(() => {
        setLoadingActions(prev => { const next = { ...prev }; delete next[firmaName]; return next; });
      });
  };

  const handleExtend = (e: React.MouseEvent, firmaName: string) => {
    e.stopPropagation();
    setLoadingActions(prev => ({ ...prev, [firmaName]: "extend" }));
    extendFirmaSubscription(firmaName)
      .then(v => {
        setVendorOverrides(prev => ({ ...prev, [firmaName]: { isSponsor: v.isSponsor, isSubscribed: v.isSubscribed, subscriptionPending: v.subscriptionPending, yayinaGirisTarihi: v.yayinaGirisTarihi ?? undefined } }));
        toast({ title: "Abonelik uzatıldı", description: `${firmaName} aboneliği 30 gün uzatıldı.` });
      })
      .catch(() => {
        toast({ title: "Hata", description: "Abonelik uzatılırken bir sorun oluştu. Lütfen tekrar deneyin.", variant: "destructive" });
      })
      .finally(() => {
        setLoadingActions(prev => { const next = { ...prev }; delete next[firmaName]; return next; });
      });
  };

  const tierScore = (vendor: VendorEntry): number => {
    const override = vendorOverrides[vendor.name];
    if (override) {
      if (override.isSponsor) return 3;
      if (override.isSubscribed) return 1;
      return 0;
    }
    const isSponsor = vendor.isSponsor ?? loadFirmaProfile(vendor.name).isSponsor;
    const isSubscribed = vendor.isSubscribed ?? loadFirmaProfile(vendor.name).isSubscribed;
    if (isSponsor) return 3;
    if (isSubscribed) return 1;
    return 0;
  };

  const allFirms = useMemo(() => {
    const list = vendors
      .filter(v => {
        /* Sponsor firmalar ana sayfadaki carousel'de gösterilir — buradan çıkar */
        const override = vendorOverrides[v.name];
        const effectiveSponsor = override ? override.isSponsor : (v.isSponsor ?? false);
        if (effectiveSponsor && !isAdmin) return false;

        if (override) {
          if (isSubExpired({ yayinaGirisTarihi: override.yayinaGirisTarihi, isSubscribed: override.isSubscribed }) && !isAdmin) return false;
        } else {
          const p = loadFirmaProfile(v.name);
          const effective = {
            yayinaGirisTarihi: v.yayinaGirisTarihi ?? p.yayinaGirisTarihi,
            isSubscribed: v.isSubscribed ?? p.isSubscribed,
          };
          if (isSubExpired(effective) && !isAdmin) return false;
        }
        return true;
      })
      .sort((a, b) => tierScore(b) - tierScore(a))
      .map((v, i) => {
        const card = buildCard(v, i);
        const override = vendorOverrides[v.name];
        if (override) card.isPremium = override.isSponsor;
        return card;
      });

    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.location.toLowerCase().includes(q) ||
      f.tags.some(t => t.toLowerCase().includes(q))
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendors, query, vendorOverrides]);

  return (
    <div className="min-h-screen bg-background">
      <FirmaProfilModal firma={selected} onClose={() => setSelected(null)} />

      {/* Header bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Ana Sayfa
          </button>
          <div className="flex-1 relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Firma adı veya bölge ara..."
              className="w-full pl-9 pr-4 py-2 text-sm border-2 border-border rounded-xl outline-none focus:border-primary transition-colors"
            />
          </div>
          <span className="text-xs text-muted-foreground hidden sm:block">
            {allFirms.length} firma
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Tüm Firmalar</h1>
          <p className="text-muted-foreground">Platformdaki tüm kayıtlı temizlik firmalarını görüntüleyin.</p>
        </div>

        {allFirms.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <Globe className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Sonuç bulunamadı</p>
            <p className="text-sm mt-1">Farklı bir arama terimi deneyin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allFirms.map((firma, idx) => {
              const vendor = vendors.find(v => v.name === firma.name);
              const score = vendor ? tierScore(vendor) : 0;
              const tierLabel = score === 3
                ? { label: "★ Sponsor", cls: "bg-amber-400 text-amber-900" }
                : score === 2
                ? { label: "✦ CRM Üye", cls: "bg-violet-100 text-violet-700" }
                : null;
              return (
                <motion.div
                  key={firma.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.4 }}
                  onClick={() => {
                    if (user?.type === "firma" && user.name === firma.name) navigate("/firma-dashboard");
                    else setSelected(firma);
                  }}
                  className={`bg-white rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden ${score === 3 ? "border-amber-200 hover:border-amber-300" : "border-border hover:border-primary/20"}`}
                >
                  {/* Top gradient strip */}
                  <div className={`h-20 bg-gradient-to-br ${firma.galleryColors[0].gradient} relative flex items-center justify-center`}>
                    {(() => { const Icon = firma.galleryColors[0].icon; return <Icon className="w-8 h-8 text-white/30" />; })()}
                    {tierLabel && (
                      <div className={`absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${tierLabel.cls}`}>
                        {tierLabel.label}
                      </div>
                    )}
                    {/* Admin controls */}
                    {isAdmin && (() => {
                      const lp = loadFirmaProfile(firma.name);
                      const override = vendorOverrides[firma.name];
                      const effective = override
                        ? { ...lp, ...override }
                        : { ...lp, isSponsor: vendor?.isSponsor ?? lp.isSponsor, isSubscribed: vendor?.isSubscribed ?? lp.isSubscribed };
                      const expired = isSubExpired(effective);
                      const havale = effective.subscriptionPending && !effective.isSubscribed;
                      return (
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {(score === 3) && (
                            <button onClick={e => handleAdminRemove(e, firma.name)}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/90 hover:bg-red-600 text-white text-[10px] font-bold transition-colors">
                              <EyeOff className="w-2.5 h-2.5" /> Yayından Kaldır
                            </button>
                          )}
                          {havale && (() => {
                            const isLoading = loadingActions[firma.name] === "approve";
                            return (
                              <button
                                onClick={e => handleApproveHavale(e, firma.name)}
                                disabled={isLoading}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600/90 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[10px] font-bold transition-colors">
                                {isLoading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <CheckCircle2 className="w-2.5 h-2.5" />}
                                {isLoading ? "Onaylanıyor…" : "Havale Onayla"}
                              </button>
                            );
                          })()}
                          {(effective.isSubscribed || expired) && !havale && (() => {
                            const isLoading = loadingActions[firma.name] === "extend";
                            return (
                              <button
                                onClick={e => handleExtend(e, firma.name)}
                                disabled={isLoading}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600/90 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[10px] font-bold transition-colors">
                                {isLoading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <CalendarClock className="w-2.5 h-2.5" />}
                                {isLoading ? "Uzatılıyor…" : "+30 Gün Uzat"}
                              </button>
                            );
                          })()}
                          {expired && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-700/90 text-white text-[10px] font-bold">
                              Pasif
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-foreground text-base">{firma.name}</h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <MapPin className="w-3 h-3" /> {firma.location}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 flex-shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {firma.rating.toFixed(1)}
                        {firma.reviews > 0 && <span className="text-muted-foreground font-normal">({firma.reviews})</span>}
                      </div>
                    </div>

                    {firma.bio && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{firma.bio}</p>
                    )}

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {firma.tags.map(tag => (
                        <span key={tag} className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <Button size="sm" className="w-full h-8 rounded-xl text-xs">
                      Profil Görüntüle
                    </Button>
                    <a
                      href={`/firma/${toSlug(firma.name)}`}
                      onClick={e => e.stopPropagation()}
                      className="block text-center text-[10px] text-muted-foreground hover:text-primary mt-2 underline-offset-2 hover:underline"
                    >
                      Tam sayfa profili aç →
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
