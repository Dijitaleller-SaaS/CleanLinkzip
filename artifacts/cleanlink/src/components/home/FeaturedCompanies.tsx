import { useState, useMemo, useEffect, useRef } from "react";
import {
  Star, ShieldCheck, MapPin, ChevronLeft, ChevronRight,
  Award, Zap, Tag, Home, Sofa, SprayCan, Wind, Layers, Sun, Lock, EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FirmaProfilModal, FirmaData } from "@/components/firma/FirmaProfilModal";
import { useApp, ADMIN_EMAIL, defaultFirmaProfile, defaultPrices, defaultScopes, type VendorEntry } from "@/context/AppContext";
import { apiAdminSetVisibilityByName } from "@/lib/api";
import { useLocation } from "wouter";
import { getFirmaSlugFromUrl, toSlug } from "@/lib/analytics";

const COMPANIES: FirmaData[] = [
  {
    id: 1,
    name: "Yıldız Temizlik",
    rating: 4.9,
    reviews: 342,
    location: "Kadıköy, İstanbul",
    tags: ["Ev", "Ofis", "İnşaat Sonrası"],
    verified: true,
    isPremium: true,
    badge: "one_cikan",
    image: "company-1.png",
    phone: "0532 111 22 33",
    bio: "2015 yılından bu yana İstanbul'un Anadolu yakasında profesyonel ev, ofis ve inşaat sonrası temizlik hizmeti sunuyoruz. ISO 9001 sertifikalı ekibimiz, çevre dostu temizlik ürünleri ve buharlı temizleme sistemleriyle yüzlerce aileye güvenilir hizmet verdi.",
    founded: "2015",
    completedJobs: 1200,
    certs: [
      { label: "Sigortalı Hizmet", icon: ShieldCheck, color: "bg-blue-100 text-blue-600", bg: "bg-blue-50 border-blue-100" },
      { label: "Hijyen Sertifikalı", icon: SprayCan, color: "bg-teal-100 text-teal-600", bg: "bg-teal-50 border-teal-100" },
      { label: "ISO 9001", icon: Award, color: "bg-violet-100 text-violet-600", bg: "bg-violet-50 border-violet-100" },
    ],
    services: [
      { name: "2+1 Ev Temizliği", price: "1.500", unit: "/ ziyaret", scope: "Tüm odalar, mutfak ve ocak, banyo dezenfeksiyonu, cam silme, yer yıkama ve süpürme dahil." },
      { name: "3+1 Ev Temizliği", price: "2.100", unit: "/ ziyaret", scope: "Üst paket: ek olarak balkon, dolap içleri ve fırın temizliği dahil." },
      { name: "Ofis Temizliği", price: "800", unit: "/ gün", scope: "50m²'ye kadar ofis, ortak alan ve tuvalet temizliği." },
    ],
    galleryColors: [
      { gradient: "from-teal-400 to-primary", icon: Home, label: "Ev Temizliği" },
      { gradient: "from-emerald-400 to-teal-500", icon: SprayCan, label: "Derin Temizlik" },
      { gradient: "from-cyan-400 to-sky-500", icon: Wind, label: "Havalandırma" },
      { gradient: "from-primary to-teal-700", icon: Layers, label: "Ofis Temizliği" },
    ],
    reviewList: [
      { name: "Zeynep A.", initials: "ZA", color: "from-violet-500 to-purple-600", puan: 5, yorum: "Harika ekip, zamanında geldiler ve her köşeyi özenerek temizlediler. Kesinlikle tavsiye ederim.", tarih: "28 Mar 2026", hasPhoto: true },
      { name: "Kerem B.", initials: "KB", color: "from-sky-500 to-blue-600", puan: 5, yorum: "Ofisimizi düzenli olarak yıkıyorlar. Fiyat-kalite dengesi mükemmel, personel çok nazik.", tarih: "22 Mar 2026" },
      { name: "Merve Ç.", initials: "MÇ", color: "from-rose-400 to-pink-500", puan: 4, yorum: "Genel olarak çok memnundum, sadece bir bölümü hafif atladılar ama uyarınca düzelttiler.", tarih: "15 Mar 2026", hasPhoto: true },
    ],
  },
  {
    id: 2,
    name: "Usta Yıkama",
    rating: 4.8,
    reviews: 128,
    location: "Beşiktaş, İstanbul",
    tags: ["Koltuk", "Halı", "Araç İçi"],
    verified: true,
    isPremium: true,
    badge: "acil",
    image: "company-2.png",
    phone: "0533 444 55 66",
    bio: "Buharlı yıkama teknolojisiyle koltuk, halı ve araç içi temizliğinde İstanbul'un lider firmasıyız. Aynı gün hizmet garantisi ve hızlı kuruma teknolojisiyle konforunuzu bozmadan temizlik yapıyoruz.",
    founded: "2018",
    completedJobs: 650,
    certs: [
      { label: "Sigortalı Hizmet", icon: ShieldCheck, color: "bg-blue-100 text-blue-600", bg: "bg-blue-50 border-blue-100" },
      { label: "Buharlı Yıkama", icon: Wind, color: "bg-sky-100 text-sky-600", bg: "bg-sky-50 border-sky-100" },
      { label: "Hızlı Kuruma", icon: Zap, color: "bg-amber-100 text-amber-600", bg: "bg-amber-50 border-amber-100" },
    ],
    services: [
      { name: "L Koltuk Yıkama", price: "600", unit: "/ set", scope: "Buharlı derin temizlik, leke çıkarma, koku giderme. Kolçaklar ve arka yüzey dahil." },
      { name: "Tekli Koltuk", price: "180", unit: "/ adet", scope: "Köşe koltuğu hariç standart yıkama." },
      { name: "Halı Yıkama", price: "60", unit: "/ m²", scope: "Endüstriyel makine, organik deterjan, kuru teslim garantisi." },
      { name: "Araç İçi Temizlik", price: "400", unit: "/ araç", scope: "Derin iç temizleme, koltuk ve tavan buharlı yıkama." },
    ],
    galleryColors: [
      { gradient: "from-sky-400 to-blue-500", icon: Sofa, label: "Koltuk Yıkama" },
      { gradient: "from-cyan-400 to-teal-500", icon: Wind, label: "Buhar Sistemi" },
      { gradient: "from-blue-400 to-indigo-500", icon: SprayCan, label: "Halı Yıkama" },
    ],
    reviewList: [
      { name: "Ali D.", initials: "AD", color: "from-amber-500 to-orange-500", puan: 5, yorum: "Aynı gün servis istedim, 3 saat içinde geldiler. Koltuklarım yepyeni gibi, koku da süper.", tarih: "27 Mar 2026" },
      { name: "Selin E.", initials: "SE", color: "from-teal-500 to-primary", puan: 5, yorum: "Fiyat açıkça belirtilmişti, sürpriz ek ücret çıkmadı. Bu çok önemli benim için.", tarih: "20 Mar 2026" },
    ],
  },
  {
    id: 3,
    name: "Parlak Evler",
    rating: 4.7,
    reviews: 89,
    location: "Şişli, İstanbul",
    tags: ["Ev", "Ofis", "Aylık Abonelik"],
    verified: false,
    isPremium: true,
    badge: "en_iyi_fiyat",
    image: "company-3.png",
    phone: "0544 777 88 99",
    bio: "Bütçe dostu fiyatlarla standart altına düşmeden temizlik yapan genç ve dinamik ekibiz. Aylık abonelik paketlerimizle düzenli müşterilerimize %20 indirim sunuyoruz.",
    founded: "2021",
    completedJobs: 280,
    certs: [
      { label: "Sigortalı Hizmet", icon: ShieldCheck, color: "bg-blue-100 text-blue-600", bg: "bg-blue-50 border-blue-100" },
      { label: "Çevre Dostu", icon: Sun, color: "bg-green-100 text-green-600", bg: "bg-green-50 border-green-100" },
    ],
    services: [
      { name: "2+1 Ev Temizliği", price: "1.100", unit: "/ ziyaret", scope: "Temel genel temizlik. Aylık abonelikte 880 TL." },
      { name: "Haftalık Abonelik", price: "3.200", unit: "/ ay (4 ziyaret)", scope: "Her hafta düzenli temizlik, %27 tasarruf." },
      { name: "Ofis (50m²)", price: "650", unit: "/ gün", scope: "Açık ofis, mutfak ve tuvalet dahil." },
    ],
    galleryColors: [
      { gradient: "from-green-400 to-emerald-500", icon: Home, label: "Ev Temizliği" },
      { gradient: "from-lime-400 to-green-500", icon: Sun, label: "Çevre Dostu" },
      { gradient: "from-teal-300 to-emerald-400", icon: SprayCan, label: "Organik Ürünler" },
    ],
    reviewList: [
      { name: "Osman K.", initials: "OK", color: "from-green-500 to-teal-600", puan: 5, yorum: "Fiyatı diğer firmalardan %30 ucuz ama kalitesi hiç düşük değil. Aylık aboneliğe geçtim.", tarih: "25 Mar 2026" },
      { name: "Ayşe M.", initials: "AM", color: "from-rose-400 to-pink-500", puan: 4, yorum: "İlk gelişte küçük bir gecikmesi vardı ama temizlik kalitesi çok iyiydi.", tarih: "18 Mar 2026" },
    ],
  },
  {
    id: 4,
    name: "Kristal Temizlik",
    rating: 4.8,
    reviews: 215,
    location: "Ataşehir, İstanbul",
    tags: ["Halı", "Yorgan", "Yatak Yıkama"],
    verified: true,
    isPremium: true,
    badge: "one_cikan",
    image: "company-4.png",
    phone: "0541 234 56 78",
    bio: "Halı, yatak ve yorgan yıkamada Anadolu yakasının güvenilir ismi. Endüstriyel makinelerimiz ve organik ürünlerimizle evinizin tekstillerini yeniler gibi teslim ediyoruz.",
    founded: "2017",
    completedJobs: 890,
    certs: [
      { label: "Sigortalı Hizmet", icon: ShieldCheck, color: "bg-blue-100 text-blue-600", bg: "bg-blue-50 border-blue-100" },
      { label: "Hijyen Sertifikalı", icon: SprayCan, color: "bg-teal-100 text-teal-600", bg: "bg-teal-50 border-teal-100" },
      { label: "ISO 9001", icon: Award, color: "bg-violet-100 text-violet-600", bg: "bg-violet-50 border-violet-100" },
    ],
    services: [
      { name: "Halı Yıkama (Standart)", price: "120", unit: "/ m²", scope: "Endüstriyel makine, organik deterjan, kuru teslim garantisi." },
      { name: "Shaggy Halı Yıkama", price: "150", unit: "/ m²", scope: "Uzun tüylü halılara özel şampuan, özenli kurutma." },
      { name: "Yatak Yıkama", price: "750", unit: "/ adet", scope: "Buharlı derin temizlik, allerjen giderme, hızlı kuruma." },
      { name: "Yorgan Yıkama (2 Kişilik)", price: "750", unit: "/ adet", scope: "Dolgu koruyucu yıkama, çift kişilik." },
    ],
    galleryColors: [
      { gradient: "from-sky-400 to-cyan-500", icon: Layers, label: "Halı Yıkama" },
      { gradient: "from-teal-400 to-emerald-500", icon: Wind, label: "Yatak & Yorgan" },
      { gradient: "from-cyan-400 to-blue-500", icon: SprayCan, label: "Organik Ürünler" },
    ],
    reviewList: [
      { name: "Hülya T.", initials: "HT", color: "from-sky-500 to-cyan-600", puan: 5, yorum: "Shaggy halımı tereddütsüz teslim ettim, geri geldiğinde yepyeni gibiydi. Harika iş!", tarih: "24 Mar 2026" },
      { name: "Cengiz A.", initials: "CA", color: "from-teal-500 to-emerald-600", puan: 5, yorum: "Yorgan yıkama için geldim, hem fiyat uygun hem de kalite çok yüksek.", tarih: "17 Mar 2026" },
    ],
  },
  {
    id: 5,
    name: "Anadolu Yıkama",
    rating: 4.6,
    reviews: 163,
    location: "Pendik, İstanbul",
    tags: ["Koltuk", "Araç İçi", "Sandalye"],
    verified: true,
    isPremium: true,
    badge: "acil",
    image: "company-5.png",
    phone: "0542 876 54 32",
    bio: "Koltuk, araç koltuğu ve cafe-restoran sandalye yıkamada hızlı ve güvenilir hizmet. Aynı gün servis seçeneği ve kuruma garantisi ile müşteri memnuniyetini ön planda tutuyoruz.",
    founded: "2019",
    completedJobs: 540,
    certs: [
      { label: "Sigortalı Hizmet", icon: ShieldCheck, color: "bg-blue-100 text-blue-600", bg: "bg-blue-50 border-blue-100" },
      { label: "Buharlı Yıkama", icon: Wind, color: "bg-sky-100 text-sky-600", bg: "bg-sky-50 border-sky-100" },
      { label: "Hızlı Kuruma", icon: Zap, color: "bg-amber-100 text-amber-600", bg: "bg-amber-50 border-amber-100" },
    ],
    services: [
      { name: "L Koltuk Takımı", price: "600", unit: "/ set", scope: "Buharlı derin temizlik, leke ve koku giderme." },
      { name: "Araç Koltuk Yıkama", price: "400", unit: "/ araç", scope: "Araç içi buharlı yıkama, koku giderme." },
      { name: "Tekli Koltuk", price: "180", unit: "/ adet", scope: "Tek kişilik koltuk yıkama, buharlı temizlik." },
      { name: "3'lü Koltuk", price: "450", unit: "/ adet", scope: "Kumaş veya deri, buharlı temizlik." },
    ],
    galleryColors: [
      { gradient: "from-amber-400 to-orange-500", icon: Sofa, label: "Koltuk Yıkama" },
      { gradient: "from-orange-400 to-rose-500", icon: Wind, label: "Araç İçi" },
      { gradient: "from-red-400 to-orange-400", icon: SprayCan, label: "Sandalye" },
    ],
    reviewList: [
      { name: "Burak S.", initials: "BS", color: "from-amber-500 to-orange-600", puan: 5, yorum: "Cafe sandalyelerimizi yıkattık, çok hızlı ve profesyonel hizmet. Kesinlikle tekrar çalışacağız.", tarih: "26 Mar 2026" },
      { name: "Yasemin K.", initials: "YK", color: "from-rose-400 to-pink-500", puan: 4, yorum: "Araç içi yıkama beklentimin üzerinde çıktı, koltuklar çok temiz.", tarih: "19 Mar 2026" },
    ],
  },
  {
    id: 6,
    name: "Pırıl Temizlik",
    rating: 4.7,
    reviews: 97,
    location: "Maltepe, İstanbul",
    tags: ["İpek Halı", "Bambu", "Yün Halı"],
    verified: true,
    isPremium: true,
    badge: "en_iyi_fiyat",
    image: "company-6.png",
    phone: "0543 654 32 10",
    bio: "Değerli halılarınız için özel bakım uzmanıyız. İpek, bambu, yün ve kilim halıları koruyucu yöntemlerle el yıkamasıyla teslim ediyoruz. Her halıya özel muamele, renk garantisi.",
    founded: "2016",
    completedJobs: 620,
    certs: [
      { label: "Sigortalı Hizmet", icon: ShieldCheck, color: "bg-blue-100 text-blue-600", bg: "bg-blue-50 border-blue-100" },
      { label: "Hijyen Sertifikalı", icon: SprayCan, color: "bg-teal-100 text-teal-600", bg: "bg-teal-50 border-teal-100" },
      { label: "Çevre Dostu", icon: Sun, color: "bg-green-100 text-green-600", bg: "bg-green-50 border-green-100" },
    ],
    services: [
      { name: "İpek Halı", price: "300", unit: "/ m²", scope: "El yıkama, özel ipek bakım ürünleri, şekil koruma garantisi." },
      { name: "Bambu Halı (Orijinal)", price: "300", unit: "/ m²", scope: "Bambu özelliklerine uygun özel prosedür, renk canlılaştırma." },
      { name: "Yün Halı", price: "200", unit: "/ m²", scope: "Nötr deterjan, düşük ısıda kurutma, renk koruma." },
      { name: "Kilim Yıkama", price: "150", unit: "/ m²", scope: "El yıkama, doğal kuruma, kilim şekil koruma." },
    ],
    galleryColors: [
      { gradient: "from-violet-400 to-purple-500", icon: Layers, label: "İpek Halı" },
      { gradient: "from-emerald-400 to-teal-500", icon: Sun, label: "Bambu Halı" },
      { gradient: "from-indigo-400 to-violet-500", icon: SprayCan, label: "Yün & Kilim" },
    ],
    reviewList: [
      { name: "Sevgi D.", initials: "SD", color: "from-violet-500 to-purple-600", puan: 5, yorum: "İpek halımı başka firmaya vermekten korkardım. Pırıl Temizlik çok özenli çalıştı, teşekkürler.", tarih: "25 Mar 2026" },
      { name: "Tarık M.", initials: "TM", color: "from-indigo-400 to-violet-500", puan: 5, yorum: "El dokuması kilimimiz çok değerliydi, renkleri hiç solmadı, harika sonuç.", tarih: "16 Mar 2026" },
    ],
  },
];

const BADGE_CARD = {
  one_cikan: { label: "⭐ Öne Çıkan", style: "bg-violet-100 text-violet-700 border-violet-200" },
  acil: { label: "⚡ Acil Hizmet", style: "bg-orange-100 text-orange-700 border-orange-200" },
  en_iyi_fiyat: { label: "💰 En İyi Fiyat", style: "bg-green-100 text-green-700 border-green-200" },
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
    location: regions[0] ? `${regions[0]}, İstanbul` : "İstanbul",
    tags: regions.slice(0, 3).length ? regions.slice(0, 3) : ["Ev Temizliği"],
    verified: true,
    isPremium: v.isSponsor ?? false,
    isSubscribed: v.isSubscribed ?? false,
    isSponsor: v.isSponsor ?? false,
    badge: null,
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

  /* Dynamic sponsor firms from context vendors (not already in static COMPANIES) */
  const dynamicSponsors = useMemo(() =>
    vendors
      .filter(v => v.isPublished && !COMPANY_NAMES.has(v.name))
      .filter(v => v.isSponsor ?? false)
      .map((v, i) => buildFirmaData(v, i))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  , [vendors]);

  /* Real sponsors (DB) fill first slots; seed/demo firms fill remainder 1:1 */
  const carouselFirms = useMemo(() => {
    const realFirms = dynamicSponsors;
    const seedSlots = Math.max(0, 6 - realFirms.length);
    const seedFirms = COMPANIES.filter(c => c.isPremium).slice(0, seedSlots);
    const base = [...realFirms, ...seedFirms];
    if (base.length === 0) return base;
    const padded = [...base];
    while (padded.length < 6) padded.push(...base);
    return padded.slice(0, Math.max(base.length, 6));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dynamicSponsors, user?.name]);

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
                    ? <img src={firstGalleryImg} alt={company.name} className="absolute inset-0 w-full h-full object-cover" />
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
                      {/* Doğa Dostu İşletme rozeti */}
                      {(company.completedJobs ?? 0) >= NATURE_FRIENDLY_THRESHOLD && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 text-[10px] font-bold mt-0.5 w-fit">
                          🌳 Doğa Dostu İşletme
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
