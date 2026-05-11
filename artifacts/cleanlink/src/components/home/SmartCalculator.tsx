import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, Sparkles, ChevronRight, MapPin, X, Search,
  ChevronLeft, Star, Home, Sofa, Layers, Car, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp, loadFirmaProfile, TR_REGIONS, SERVICE_META, type ServiceKey } from "@/context/AppContext";
import { BookingModal, BookingServiceItem } from "@/components/booking/BookingModal";
import { FirmaProfilModal, FirmaData } from "@/components/firma/FirmaProfilModal";
import { SprayCan } from "lucide-react";

/* ── Pilot firm routing table ── */
const SEED_ROUTING: { name: string; regions: string[]; tier: number }[] = [
  { name: "Cleanlink Temizlik",      regions: ["Beşiktaş","Şişli","Beyoğlu","Bağcılar","Küçükçekmece"],           tier: 3 },
  { name: "Elitplus+ Koltuk Yıkama", regions: ["Gaziosmanpaşa","Bağcılar","Eyüpsultan","Küçükçekmece","Fatih"],   tier: 3 },
];

function findBestFirma(ilce: string, vendors: { name: string; isPublished: boolean }[]): string | null {
  const dynamicCandidates = vendors
    .filter(v => v.isPublished && !SEED_ROUTING.some(s => s.name === v.name))
    .map(v => { const p = loadFirmaProfile(v.name); return { name: v.name, regions: p.regions, tier: p.isSponsor ? 3 : p.isSubscribed ? 2 : 1 }; });
  const all = [...SEED_ROUTING, ...dynamicCandidates];
  const inDistrict = ilce ? all.filter(c => c.regions.includes(ilce)) : all;
  const candidates = inDistrict.length > 0 ? inDistrict : all;
  const maxTier = Math.max(...candidates.map(c => c.tier));
  const topGroup = candidates.filter(c => c.tier === maxTier);
  return topGroup[Math.floor(Math.random() * topGroup.length)]?.name ?? null;
}

function findDistrictFirmas(ilce: string, vendors: { name: string; isPublished: boolean }[]): { name: string; tier: number }[] {
  const dynamicCandidates = vendors
    .filter(v => v.isPublished && !SEED_ROUTING.some(s => s.name === v.name))
    .map(v => { const p = loadFirmaProfile(v.name); return { name: v.name, regions: p.regions, tier: p.isSponsor ? 3 : p.isSubscribed ? 2 : 1 }; });
  const all = [...SEED_ROUTING, ...dynamicCandidates];
  const inDistrict = ilce ? all.filter(c => c.regions.includes(ilce)) : all;
  const pool = inDistrict.length > 0 ? inDistrict : all;
  return [...pool].sort((a, b) => b.tier - a.tier);
}

function buildFirmaData(name: string, idx: number): FirmaData {
  const p = loadFirmaProfile(name);
  return {
    id: 400 + idx,
    name,
    rating: 4.5,
    reviews: 0,
    location: p.regions[0] ? `${p.regions[0]}, İstanbul` : "İstanbul",
    tags: p.regions.slice(0, 3).length ? p.regions.slice(0, 3) : ["Temizlik"],
    verified: false,
    isPremium: p.isSponsor,
    badge: null,
    image: "",
    phone: "",
    bio: p.bio || "Profesyonel temizlik hizmetleri.",
    founded: new Date().getFullYear().toString(),
    completedJobs: 0,
    certs: [],
    services: [
      { name: "2+1 Ev Temizliği", price: p.prices.ev2p1.toString(), unit: "/ ziyaret", scope: p.serviceScopes?.ev2p1 || "" },
      { name: "L Koltuk Yıkama",  price: p.prices.koltukL.toString(), unit: "/ set",  scope: p.serviceScopes?.koltukL || "" },
      { name: "Halı Yıkama",      price: p.prices.haliStandart.toString(), unit: "/ m²", scope: p.serviceScopes?.haliStandart || "" },
    ],
    galleryColors: [
      { gradient: "from-teal-400 to-primary",     icon: Home,     label: "Ev Temizliği"  },
      { gradient: "from-sky-400 to-blue-500",     icon: Sofa,     label: "Koltuk Yıkama" },
      { gradient: "from-emerald-400 to-teal-500", icon: SprayCan, label: "Derin Temizlik" },
    ],
    reviewList: [],
  };
}

const HALI_STD_PRICE = 120;

/* ── Sub-service → AppContext SERVICE_KEY mapping ── */
const SUB_TO_KEY: Record<string, ServiceKey> = {
  "ev-gunluk":   "ev1p1",
  "ev-derin":    "ev2p1",
  "ev-tasima":   "ev3p1",
  "ofis":        "ofis",
  "k-3lu":    "koltuk3lu",
  "k-2li":    "koltuk2li",
  "k-tekli":  "koltukTekli",
  "k-2p1":    "koltuk2p1",
  "k-takim":  "koltukTakim",
  "k-l":      "koltukL",
  "k-lstd":   "koltukLStd",
  "k-berjer": "berjer",
  "k-minder": "minderliTakim",
  "k-cekyat": "cekyat",
  "k-puf":    "sandalye",
  "hali-std":    "haliStandart",
  "hali-yun":    "haliYun",
  "yatak":       "yatak",
  "battaniye":   "battaniye",
  "arac-binek":  "aracKoltuk",
  "arac-suv":    "aracKoltuk",
  "arac-ticari": "aracKoltuk",
};

/* ── Service categories & sub-services ── */
interface SubService { id: string; name: string; scope: string; hasM2?: boolean; }
interface Category {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  border: string;
  bg: string;
  subs: SubService[];
}

const CATEGORIES: Category[] = [
  {
    id: "ev", label: "Ev Temizliği", icon: Home,
    color: "text-teal-600", border: "border-primary", bg: "bg-primary/5",
    subs: [
      { id: "ev-gunluk",  name: "Günlük / Haftalık Temizlik", scope: "Standart genel temizlik, tüm odalar." },
      { id: "ev-derin",   name: "Derin Temizlik",             scope: "Fırın, mutfak, tüm yüzeyler dahil." },
      { id: "ev-tasima",  name: "Taşınma Temizliği",          scope: "Taşınma öncesi veya sonrası." },
      { id: "ofis",       name: "Ofis Temizliği",             scope: "İşyeri, mağaza, ofis alanı." },
    ],
  },
  {
    id: "koltuk", label: "Koltuk Yıkama", icon: Sofa,
    color: "text-violet-600", border: "border-violet-500", bg: "bg-violet-50",
    subs: [
      { id: "k-3lu",    name: "Üçlü Koltuk Yıkama",             scope: "3 kişilik koltuk takımı buharlı yıkama." },
      { id: "k-2li",    name: "İkili Koltuk Yıkama",             scope: "2 kişilik koltuk buharlı yıkama." },
      { id: "k-tekli",  name: "Tekli Koltuk Yıkama",             scope: "Tek kişilik koltuk yıkama." },
      { id: "k-2p1",    name: "2+1 Koltuk Yıkama",               scope: "2+1 koltuk seti komple buharlı yıkama." },
      { id: "k-takim",  name: "Koltuk Takımı Yıkama",             scope: "Standart koltuk takımı derin temizlik." },
      { id: "k-l",      name: "L Koltuk / Köşe Takımı Yıkama",   scope: "L ve köşe koltuk derinlemesine temizlik." },
      { id: "k-lstd",   name: "Standart L Koltuk Yıkama",         scope: "Standart ölçü L koltuk buharlı yıkama." },
      { id: "k-berjer", name: "Berjer Yıkama",                    scope: "Berjer koltuk derin temizlik." },
      { id: "k-minder", name: "Minderli Koltuk Takımı Yıkama",    scope: "Minder ve oturma birimi buharlı yıkama." },
      { id: "k-cekyat", name: "Çekyat / Kanepe Yıkama",           scope: "Çekyat ve kanepe derin yıkama." },
      { id: "k-puf",    name: "Puf ve Sandalye Yıkama",            scope: "Cafe, restoran ve ev sandalyeleri." },
    ],
  },
  {
    id: "hali", label: "Halı Yıkama", icon: Layers,
    color: "text-amber-600", border: "border-amber-500", bg: "bg-amber-50",
    subs: [
      { id: "hali-std",   name: "Makine Halısı",       scope: "Makine yıkama, kuru teslim.", hasM2: true },
      { id: "hali-yun",   name: "Yün / İpek Halı",     scope: "El işleme, özel bakım." },
      { id: "yatak",      name: "Yatak Yıkama",         scope: "Çift veya tek kişilik yatak." },
      { id: "battaniye",  name: "Battaniye / Yorgan",   scope: "Endüstriyel yıkama." },
    ],
  },
  {
    id: "arac", label: "Araç Koltuk Yıkama", icon: Car,
    color: "text-green-600", border: "border-green-500", bg: "bg-green-50",
    subs: [
      { id: "arac-binek",  name: "Binek Araç",              scope: "Sedan / Hatchback iç temizlik." },
      { id: "arac-suv",    name: "SUV / Minivan",            scope: "Büyük araç iç detay." },
      { id: "arac-ticari", name: "Ticari Araç / Minibüs",   scope: "Ticari araç koltuğu." },
    ],
  },
];

function CheckBox({ checked }: { checked: boolean }) {
  return checked
    ? <div className="w-5 h-5 bg-primary rounded-md flex items-center justify-center flex-shrink-0 border-2 border-primary"><Check className="w-3 h-3 text-white" /></div>
    : <div className="w-5 h-5 bg-white rounded-md border-2 border-border flex-shrink-0" />;
}

export function SmartCalculator() {
  const { vendors, user, pendingBooking, setPendingBooking } = useApp();
  const [, navigate] = useLocation();

  /* Service selection */
  const [selectedSubs, setSelectedSubs] = useState<Set<string>>(new Set());
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [haliM2, setHaliM2] = useState<string>("");
  const parsedHaliM2 = parseInt(haliM2) || 0;
  const haliTotal = parsedHaliM2 * HALI_STD_PRICE;

  /* District picker */
  const [showDistrictPicker, setShowDistrictPicker] = useState(false);
  const [pickerStep, setPickerStep] = useState<"district" | "firms">("district");
  const [selectedIlce, setSelectedIlce] = useState("");
  const [districtFirmas, setDistrictFirmas] = useState<{ name: string; tier: number }[]>([]);

  /* Booking & profile modal */
  const [bookingFirma, setBookingFirma] = useState<{ name: string; services: BookingServiceItem[] } | null>(null);
  const [previewFirma, setPreviewFirma] = useState<FirmaData | null>(null);

  const prevUser = useRef<typeof user>(user);

  const totalSelected = selectedSubs.size;

  /* ── Restore pending booking after login ── */
  useEffect(() => {
    const wasLoggedOut = !prevUser.current && !!user && user.type === "musteri";
    prevUser.current = user;
    if (wasLoggedOut && pendingBooking) {
      setBookingFirma(pendingBooking.firma);
      // pendingBooking'i burada temizleme — BookingModal form state'i geri yükleyince temizler
    }
  }, [user]);

  function toggleSub(id: string) {
    setSelectedSubs(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleCat(id: string) {
    setExpandedCats(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function buildServicesForFirma(firmaName: string): BookingServiceItem[] {
    const profile = loadFirmaProfile(firmaName);
    return CATEGORIES.flatMap(cat =>
      cat.subs
        .filter(s => selectedSubs.has(s.id))
        .map(s => {
          const key = SUB_TO_KEY[s.id];
          const rawPrice = key ? (profile.prices[key] ?? 0) : 0;
          const liveScope = key ? (profile.serviceScopes[key] || s.scope) : s.scope;

          if (s.id === "hali-std") {
            const pricePerM2 = rawPrice > 0 ? rawPrice : HALI_STD_PRICE;
            const total = parsedHaliM2 * pricePerM2;
            return {
              name: s.name,
              price: parsedHaliM2 > 0 ? String(total) : "",
              unit: parsedHaliM2 > 0 ? `${parsedHaliM2} m²` : "/ m²",
              scope: liveScope,
            };
          }

          if (rawPrice > 0 && key) {
            return {
              name: s.name,
              price: String(rawPrice),
              unit: SERVICE_META[key].unit.replace("TL / ", "/ "),
              scope: liveScope,
            };
          }
          return { name: s.name, price: "", unit: "", scope: liveScope };
        })
    );
  }

  function handleReservation() {
    if (totalSelected === 0) return;
    setPickerStep("district");
    setShowDistrictPicker(true);
  }

  function handleDistrictClick(ilce: string) {
    setSelectedIlce(ilce);
    setDistrictFirmas(findDistrictFirmas(ilce, vendors));
    setPickerStep("firms");
  }

  function handleFirmaSelect(firmaName: string) {
    setShowDistrictPicker(false);
    setPickerStep("district");
    setBookingFirma({ name: firmaName, services: buildServicesForFirma(firmaName) });
  }

  function handleAutoSelect(ilce: string) {
    setShowDistrictPicker(false);
    setPickerStep("district");
    const bestName = findBestFirma(ilce, vendors);
    if (!bestName) return;
    setBookingFirma({ name: bestName, services: buildServicesForFirma(bestName) });
  }

  function closePicker() {
    setShowDistrictPicker(false);
    setPickerStep("district");
  }

  return (
    <>
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl shadow-primary/5 border border-border/50 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-secondary rounded-full blur-3xl opacity-50 pointer-events-none" />

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-2xl font-display font-bold text-foreground">Hizmet Seçin</h3>
            <p className="text-sm text-muted-foreground">İstediğiniz kategorileri açın, hizmet seçin.</p>
          </div>
        </div>

        {/* ── Category accordion ── */}
        <div className="space-y-3 mb-6">
          {CATEGORIES.map(cat => {
            const isOpen = expandedCats.has(cat.id);
            const catSelected = cat.subs.filter(s => selectedSubs.has(s.id)).length;
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                className={`rounded-2xl border-2 transition-all duration-200 overflow-hidden ${
                  catSelected > 0 ? `${cat.border} ${cat.bg}` : "border-border bg-white"
                }`}
              >
                <button
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                  onClick={() => toggleCat(cat.id)}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    catSelected > 0 ? cat.bg + " border " + cat.border : "bg-secondary"
                  }`}>
                    <Icon className={`w-4 h-4 ${catSelected > 0 ? cat.color : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold ${catSelected > 0 ? "text-foreground" : "text-foreground"}`}>{cat.label}</p>
                    {catSelected > 0 && (
                      <p className={`text-xs font-medium ${cat.color}`}>{catSelected} hizmet seçildi</p>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 border-t border-border/50 pt-3">
                        <div className="space-y-2">
                          {cat.subs.map(sub => {
                            const checked = selectedSubs.has(sub.id);
                            return (
                              <div key={sub.id} className="space-y-2">
                                <button
                                  onClick={() => {
                                    toggleSub(sub.id);
                                    if (sub.id === "hali-std" && checked) setHaliM2("");
                                  }}
                                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                                    checked
                                      ? `${cat.border} ${cat.bg}`
                                      : "border-border hover:border-border/60 hover:bg-gray-50"
                                  }`}
                                >
                                  <CheckBox checked={checked} />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-foreground">{sub.name}</p>
                                    <p className="text-xs text-muted-foreground">{sub.scope}</p>
                                  </div>
                                  {sub.hasM2 && (
                                    <span className="text-xs font-semibold text-amber-600 whitespace-nowrap">
                                      {HALI_STD_PRICE} TL / m²
                                    </span>
                                  )}
                                </button>

                                {sub.hasM2 && checked && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="ml-8 bg-amber-50 border-2 border-amber-300 rounded-xl p-3">
                                      <p className="text-xs font-medium text-amber-700 mb-2">Kaç m² halınız var?</p>
                                      <div className="flex items-center gap-3">
                                        <div className="relative flex-1">
                                          <input
                                            type="number" min="1" placeholder="0"
                                            value={haliM2}
                                            onClick={e => e.stopPropagation()}
                                            onChange={e => setHaliM2(e.target.value)}
                                            className="w-full bg-white border-2 border-amber-200 rounded-lg px-3 py-2 text-sm font-medium text-foreground outline-none focus:border-amber-500 transition-colors"
                                          />
                                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">m²</span>
                                        </div>
                                        {parsedHaliM2 > 0 && (
                                          <div className="text-right flex-shrink-0">
                                            <p className="text-lg font-bold text-amber-700">{haliTotal.toLocaleString("tr-TR")} TL</p>
                                            <p className="text-[10px] text-amber-600">{parsedHaliM2} m² × {HALI_STD_PRICE} TL</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* ── Bottom action ── */}
        <div className="bg-gray-50 rounded-2xl p-5 border border-border">
          <AnimatePresence>
            {totalSelected > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                className="overflow-hidden mb-4"
              >
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {CATEGORIES.filter(cat => cat.subs.some(s => selectedSubs.has(s.id))).map(cat => {
                    const cnt = cat.subs.filter(s => selectedSubs.has(s.id)).length;
                    return (
                      <span key={cat.id} className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${cat.bg} ${cat.color} border ${cat.border}`}>
                        {cat.label} · {cnt}
                      </span>
                    );
                  })}
                </div>
                {selectedSubs.has("hali-std") && parsedHaliM2 > 0 && (
                  <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-2">
                    <span className="text-xs font-medium text-amber-700">🧹 Makine Halısı tahmini</span>
                    <span className="text-sm font-bold text-amber-700">{haliTotal.toLocaleString("tr-TR")} TL</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {selectedSubs.has("hali-std") && parsedHaliM2 === 0
                    ? "Makine halısı seçildi — m² girerek fiyat hesaplayın veya devam edin."
                    : "Diğer hizmetler için firma teklifini rezervasyon sırasında alacaksınız."}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            className="w-full h-14 rounded-xl text-lg font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
            disabled={totalSelected === 0}
            onClick={handleReservation}
          >
            {totalSelected === 0 ? "Hizmet Seçiniz" : `Devam Et — ${totalSelected} Hizmet`}
            {totalSelected > 0 && <ChevronRight className="w-5 h-5 ml-1" />}
          </Button>

          <button
            onClick={() => navigate("/firmalar")}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors pt-2"
          >
            <Search className="w-3 h-3" />
            Firmayı kendiniz seçmek ister misiniz? Tüm firmaları karşılaştırın →
          </button>
        </div>
      </div>

      {/* ── District Picker Overlay ── */}
      <AnimatePresence>
        {showDistrictPicker && (
          <>
            <motion.div
              key="dp-bd"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
              onClick={closePicker}
            />
            <motion.div
              key="dp-modal"
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="fixed inset-0 z-[71] flex items-end sm:items-center justify-center pointer-events-none"
            >
              <div
                className="bg-white w-full max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl pointer-events-auto overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <AnimatePresence mode="wait">
                  {/* ── Step 1: District ── */}
                  {pickerStep === "district" && (
                    <motion.div key="step-district"
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.18 }}
                    >
                      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                        <div>
                          <h3 className="font-bold text-foreground text-lg">Bölgenizi Seçin</h3>
                          <p className="text-sm text-muted-foreground">Size uygun firmaları listeleyelim</p>
                        </div>
                        <button onClick={closePicker}
                          className="w-8 h-8 rounded-full bg-secondary hover:bg-border transition-colors flex items-center justify-center">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="px-5 py-4">
                        <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
                          İlçenizi seçin — o bölgedeki firmaları göstereceğiz.
                        </p>
                        <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                          {TR_REGIONS.map(r => (
                            <button key={r} onClick={() => handleDistrictClick(r)}
                              className="py-2 px-3 text-xs font-semibold rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 text-foreground transition-all text-center">
                              {r}
                            </button>
                          ))}
                        </div>
                        <button onClick={() => handleDistrictClick("")}
                          className="w-full mt-3 py-2.5 px-4 text-sm font-medium rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-all">
                          İlçemi bilmiyorum — Tüm firmaları göster
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* ── Step 2: Firms ── */}
                  {pickerStep === "firms" && (
                    <motion.div key="step-firms"
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.18 }}
                    >
                      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                        <button onClick={() => setPickerStep("district")}
                          className="w-8 h-8 rounded-full bg-secondary hover:bg-border transition-colors flex items-center justify-center flex-shrink-0">
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-foreground text-lg truncate">
                            {selectedIlce || "Tüm Bölgeler"} Firmaları
                          </h3>
                          <p className="text-sm text-muted-foreground">{districtFirmas.length} firma hizmet veriyor</p>
                        </div>
                        <button onClick={closePicker}
                          className="w-8 h-8 rounded-full bg-secondary hover:bg-border transition-colors flex items-center justify-center">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="px-5 py-4">
                        {districtFirmas.length === 0 && (
                          <div className="py-8 text-center space-y-3">
                            <p className="text-4xl">📍</p>
                            <p className="text-base font-semibold text-foreground">Bu bölgede henüz hizmet yok</p>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              Pilot hizmet bölgemiz büyüyor.<br />Yakında burada da hizmet vereceğiz.
                            </p>
                            <button
                              onClick={() => setPickerStep("district")}
                              className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                            >
                              <ChevronLeft className="w-4 h-4" /> Başka bölge seç
                            </button>
                          </div>
                        )}
                        <div className="space-y-2 max-h-72 overflow-y-auto">
                          {districtFirmas.map((f, idx) => {
                            const tierLabel = f.tier === 3
                              ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-amber-900">★ Sponsor</span>
                              : f.tier === 2
                              ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">✦ CRM Üye</span>
                              : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">Standart</span>;
                            const profile = loadFirmaProfile(f.name);
                            return (
                              <div key={f.name}
                                className="flex items-center gap-3 p-3 rounded-xl border-2 border-border hover:border-primary/30 transition-all group">
                                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <Star className="w-4 h-4 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm text-foreground truncate">{f.name}</p>
                                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    {tierLabel}
                                    <span className="text-[10px] text-muted-foreground">• 4.5 ★</span>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1 items-end flex-shrink-0">
                                  <button
                                    onClick={() => handleFirmaSelect(f.name)}
                                    className="text-xs font-bold text-white bg-primary px-2.5 py-1 rounded-lg hover:bg-primary/90 transition-colors"
                                  >
                                    Seç →
                                  </button>
                                  <button
                                    onClick={() => { closePicker(); setPreviewFirma(buildFirmaData(f.name, idx)); }}
                                    className="text-[10px] font-medium text-primary hover:underline"
                                  >
                                    Profiline git
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <button onClick={() => handleAutoSelect(selectedIlce)}
                          className="w-full mt-3 py-2.5 px-4 text-sm font-medium rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-all">
                          Sistem otomatik seçsin — en uygun firma
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── BookingModal ── */}
      {bookingFirma && (
        <BookingModal
          firma={bookingFirma}
          preselectedService={bookingFirma.services[0]?.name}
          onClose={() => setBookingFirma(null)}
        />
      )}

      {/* ── Firma Profile Preview ── */}
      {previewFirma && (
        <FirmaProfilModal firma={previewFirma} onClose={() => setPreviewFirma(null)} />
      )}
    </>
  );
}
