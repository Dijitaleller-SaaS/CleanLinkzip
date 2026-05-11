import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Star, MapPin, ShieldCheck, Phone, ChevronLeft, ChevronRight,
  Award, Zap, Tag, Home, Sparkles, Clock, FileCheck, FileText, Calendar,
  CheckCircle2, AlertTriangle, ImagePlus, Send, Lock,
  ChevronDown, ChevronUp, Sofa, Car, Layers, Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp, loadFirmaProfile, getMusteriEmail, SERVICE_KEYS, SERVICE_META, SERVICE_GROUPS, type FirmaProfileData, type FirmaPrices, type ServiceScopes } from "@/context/AppContext";
import { BookingModal } from "@/components/booking/BookingModal";
import { trackAdCall, trackAdQuote } from "@/lib/adTracking";
import { trackGTMEvent, updateFirmaUrl, clearFirmaUrl, lockBodyScroll, unlockBodyScroll } from "@/lib/analytics";
import { apiGetReviews, apiSubmitReview, type ApiReview } from "@/lib/api";

/* WhatsApp icon (lucide doesn't have one) */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  );
}

function digitsOnly(s: string): string { return s.replace(/[^0-9]/g, ""); }
function toWhatsAppNumber(phone: string): string {
  const d = digitsOnly(phone);
  if (!d) return "";
  if (d.startsWith("90")) return d;
  if (d.startsWith("0")) return "90" + d.slice(1);
  if (d.length === 10) return "90" + d;
  return d;
}

/* ── types ─────────────────────────────────── */
export interface FirmaData {
  id: number;
  userId?: number;
  name: string;
  rating: number;
  reviews: number;
  location: string;
  tags: string[];
  verified: boolean;
  isPremium?: boolean;
  isSubscribed?: boolean;
  isSponsor?: boolean;
  badge: "one_cikan" | "acil" | "en_iyi_fiyat" | "pilot" | null;
  image: string;
  phone: string;
  whatsappPhone?: string;
  bio: string;
  founded: string;
  completedJobs: number;
  hasPati?: boolean;
  isNatureFriendly?: boolean;
  certs: CertItem[];
  services: ServiceItem[];
  galleryColors: GallerySlot[];
  reviewList: ReviewItem[];
}
export interface CertItem { label: string; icon: typeof ShieldCheck; color: string; bg: string; }
export interface ServiceItem { name: string; price: string; unit: string; scope: string; }
export interface GallerySlot { gradient: string; icon: typeof Home; label: string; }
export interface ReviewItem {
  name: string; initials: string; color: string;
  puan: number; yorum: string; tarih: string;
  hasPhoto?: boolean;
}

interface Props { firma: FirmaData | null; onClose: () => void; }

/* ── helpers ────────────────────────────────── */
const SVC_GROUP_ICONS: Record<string, React.FC<{ className?: string }>> = {
  "Ev Temizliği":    Home,
  "Koltuk Yıkama":  Sofa,
  "Araç Koltuk Yıkama": Car,
  "Halı Yıkama":    Layers,
  "Yatak & Yorgan": Moon,
};

/* Static label→group lookup built once at module level */
const FPM_LABEL_TO_GROUP: Record<string, string> = {};
for (const [, meta] of Object.entries(SERVICE_META)) FPM_LABEL_TO_GROUP[meta.label] = meta.group;

const BADGE_CONFIG = {
  one_cikan: { label: "Öne Çıkan", icon: Award, color: "bg-violet-100 text-violet-700 border-violet-200" },
  acil: { label: "Acil Hizmet", icon: Zap, color: "bg-orange-100 text-orange-700 border-orange-200" },
  en_iyi_fiyat: { label: "En İyi Fiyat", icon: Tag, color: "bg-green-100 text-green-700 border-green-200" },
  pilot: { label: "Pilot Firma", icon: Sparkles, color: "bg-teal-100 text-teal-700 border-teal-200" },
};

function Stars({ puan, onClick }: { puan: number; onClick?: (n: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i}
          onClick={() => onClick?.(i)}
          className={`${onClick ? "cursor-pointer hover:scale-110 transition-transform" : ""} w-4 h-4 ${i <= puan ? "fill-yellow-400 text-yellow-400" : "text-border"}`}
        />
      ))}
    </div>
  );
}

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap">
      <CheckCircle2 className="w-2.5 h-2.5" /> Doğrulanmış İşlem
    </span>
  );
}

function formatDate() {
  return new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
}

/* ── component ──────────────────────────────── */
export function FirmaProfilModal({ firma, onClose }: Props) {
  const { user, setShowAuthModal, setAuthMode, firmaProfile, myOrders, vendors } = useApp();

  const isOwnFirma = user?.type === "firma" && user.name === firma?.name;
  const vendorEntry = vendors.find(v => v.name === firma?.name);

  /* Real gallery images (base64 JPEGs) uploaded from vendor dashboard */
  const rawGalleryUrls: string[] = vendorEntry?.galleryUrls ?? [];

  /* Documents / certs uploaded from vendor dashboard */
  type DocItem = { name: string; fileType: "pdf" | "image"; url: string };
  const rawCertDocs: DocItem[] = (vendorEntry?.certUrls ?? []).flatMap(s => {
    try { return [JSON.parse(s) as DocItem]; } catch { return []; }
  });

  /* Use actual API prices (0 if unset) for API-sourced vendors;
     fall back to own firma context or legacy loadFirmaProfile only as last resort */
  const resolvedProfile: FirmaProfileData = isOwnFirma
    ? firmaProfile
    : vendorEntry
      ? {
          bio:          vendorEntry.bio          ?? "",
          phone:        "",
          whatsappPhone:"",
          regions:      vendorEntry.regions      ?? [],
          isSponsor:    vendorEntry.isSponsor    ?? false,
          isSubscribed: vendorEntry.isSubscribed ?? false,
          prices:        SERVICE_KEYS.reduce((acc, k) => ({ ...acc, [k]: vendorEntry.prices?.[k]        ?? 0  }), {} as FirmaPrices),
          serviceScopes: SERVICE_KEYS.reduce((acc, k) => ({ ...acc, [k]: vendorEntry.serviceScopes?.[k] ?? "" }), {} as ServiceScopes),
        }
      : loadFirmaProfile(firma?.name ?? "");

  const liveBio = (isOwnFirma && firmaProfile.bio) ? firmaProfile.bio : (vendorEntry?.bio || firma?.bio) ?? "";
  const liveRegions = resolvedProfile.regions.length > 0 ? resolvedProfile.regions : (firma ? [] : []);

  /* Tüm hizmetleri göster; fiyat 0 ise "Belirtilmemiş" yaz */
  const liveServices: ServiceItem[] = firma
    ? SERVICE_KEYS
        .filter(k => {
          const inScope = resolvedProfile.serviceScopes[k];
          const hasPrice = resolvedProfile.prices[k] > 0;
          /* En az fiyat VEYA kapsam varsa göster; ikisi de yoksa gizle */
          return hasPrice || Boolean(inScope);
        })
        .map(k => ({
          name:  SERVICE_META[k].label,
          price: resolvedProfile.prices[k] > 0
            ? resolvedProfile.prices[k].toLocaleString("tr-TR")
            : "",
          unit:  resolvedProfile.prices[k] > 0
            ? SERVICE_META[k].unit.replace("TL / ", "/ ")
            : "",
          scope: resolvedProfile.serviceScopes[k] || "",
        }))
    : [];
  /* API canlı servisler önce, yoksa statik listeye düş ama 0-fiyatlı girdileri filtrele */
  const displayServices: ServiceItem[] = liveServices.length > 0
    ? liveServices
    : (firma?.services ?? []).filter(s => s.price && s.price !== "0");

  /* ── Service group accordion ── */
  const svcByGroup: Record<string, typeof displayServices> = {};
  for (const svc of displayServices) {
    const g = FPM_LABEL_TO_GROUP[svc.name] ?? "Diğer";
    if (!svcByGroup[g]) svcByGroup[g] = [];
    svcByGroup[g].push(svc);
  }
  const orderedSvcGroups = [...SERVICE_GROUPS, "Diğer"].filter(g => svcByGroup[g]?.length > 0);

  /* All groups collapsed by default; reset when firma changes */
  const [expandedSvcGroups, setExpandedSvcGroups] = useState<Set<string>>(
    () => new Set<string>()
  );

  useEffect(() => {
    setExpandedSvcGroups(new Set<string>());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firma?.name]);

  function toggleSvcGroup(group: string) {
    setExpandedSvcGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group); else next.add(group);
      return next;
    });
  }

  const [galleryIdx, setGalleryIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<"genel" | "yorumlar">("genel");
  const [showCallWarning, setShowCallWarning] = useState(false);
  const [showBooking, setShowBooking] = useState(false);

  /* review form */
  const [apiReviews, setApiReviews] = useState<ApiReview[]>([]);
  const [reviewStats, setReviewStats] = useState<{ count: number; average: number } | null>(null);
  const [reviewPuan, setReviewPuan] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewPhotoUrl, setReviewPhotoUrl] = useState<string | null>(null);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  const userId = user ? (user.email || getMusteriEmail(user.name) || user.name) : null;

  /* Fetch reviews from API when firma opens */
  useEffect(() => {
    if (!firma?.name) return;
    let cancelled = false;
    apiGetReviews(firma.userId ?? 0)
      .then(res => {
        if (cancelled) return;
        setApiReviews(res.reviews);
        setReviewStats(res.stats);
        if (user && user.type === "musteri") {
          setAlreadyReviewed(res.reviews.some(r => r.customerName === user.name));
        }
      })
      .catch(() => { /* silent */ });
    return () => { cancelled = true; };
  }, [firma?.name, user?.name, user?.type]);

  useEffect(() => {
    if (!firma) return;
    updateFirmaUrl(firma.name);
    lockBodyScroll();
    return () => {
      clearFirmaUrl();
      unlockBodyScroll();
    };
  }, [firma?.name]);

  if (!firma) return null;
  const badge = firma.badge ? BADGE_CONFIG[firma.badge] : null;
  /* Unified gallery: real photos first, gradient slots as fallback */
  type GallerySlide =
    | { kind: "img";  url: string; label: string }
    | { kind: "grad"; gradient: string; icon: typeof ShieldCheck; label: string };
  const gallery: GallerySlide[] = rawGalleryUrls.length > 0
    ? rawGalleryUrls.map((url, i) => ({ kind: "img" as const, url, label: `Fotoğraf ${i + 1}` }))
    : firma.galleryColors.map(g => ({ kind: "grad" as const, gradient: g.gradient, icon: g.icon, label: g.label }));

  /* Convert API reviews to display format */
  const COLORS = ["from-primary to-teal-600", "from-violet-500 to-purple-600", "from-amber-500 to-orange-600", "from-rose-500 to-pink-600", "from-blue-500 to-cyan-600"];
  const allReviews: ReviewItem[] = apiReviews.map((r, i) => ({
    name: r.customerName,
    initials: r.customerName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
    color: COLORS[i % COLORS.length] ?? "from-primary to-teal-600",
    puan: r.puan,
    yorum: r.yorum,
    tarih: new Date(r.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" }),
    hasPhoto: r.hasPhoto,
  }));

  /* Use real review stats when available, fallback to firma defaults */
  const displayRating = reviewStats && reviewStats.count > 0 ? reviewStats.average : firma.rating;
  const displayReviewCount = reviewStats ? reviewStats.count : firma.reviews;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setReviewPhotoUrl(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleReviewSubmit = async () => {
    if (alreadyReviewed || submittingReview) return;
    if (reviewPuan === 0) { setReviewError("Lütfen bir puan seçin."); return; }
    if (reviewText.trim().length < 10) { setReviewError("Yorum en az 10 karakter olmalıdır."); return; }
    if (!firma) return;
    setReviewError("");
    setSubmittingReview(true);
    try {
      if (!firma.userId) throw new Error("Firma kimliği bulunamadı");
      const review = await apiSubmitReview({
        vendorId: firma.userId,
        puan: reviewPuan,
        yorum: reviewText.trim(),
        hasPhoto: !!reviewPhotoUrl,
      });
      setApiReviews(prev => [review, ...prev]);
      setReviewStats(prev => {
        const oldCount = prev?.count ?? 0;
        const oldAvg = prev?.average ?? 0;
        const newCount = oldCount + 1;
        const newAvg = (oldAvg * oldCount + review.puan) / newCount;
        return { count: newCount, average: Math.round(newAvg * 10) / 10 };
      });
      setAlreadyReviewed(true);
      setReviewSubmitted(true);
      setReviewText(""); setReviewPuan(0); setReviewPhotoUrl(null);
      setTimeout(() => setReviewSubmitted(false), 3000);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : "Yorum kaydedilemedi");
    } finally {
      setSubmittingReview(false);
    }
  };

  const hasCompletedOrder = user?.type === "musteri" && myOrders.some(
    o => o.firmaName?.trim().toLowerCase() === firma?.name.trim().toLowerCase()
      && o.durum === "tamamlandi"
  );
  const canReview = hasCompletedOrder;

  /* Compute review section content before JSX to avoid Babel ternary depth limits */
  let reviewSectionContent: React.ReactNode = null;
  if (!user) {
    reviewSectionContent = (
      <div className="bg-secondary/50 rounded-2xl p-5 flex flex-col items-center gap-3 text-center border border-border">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-foreground text-sm mb-1">Yorum yapabilmek için giriş yapın</p>
          <p className="text-xs text-muted-foreground">Hizmet almış müşteriler değerlendirme bırakabilir.</p>
        </div>
        <Button size="sm" className="rounded-xl px-6" onClick={() => { onClose(); setTimeout(() => { setAuthMode("musteri"); setShowAuthModal(true); }, 200); }}>
          Giriş Yap / Üye Ol
        </Button>
      </div>
    );
  } else if (user.type === "musteri" && !canReview) {
    reviewSectionContent = (
      <div className="bg-secondary/50 rounded-2xl p-5 flex flex-col items-center gap-3 text-center border border-border">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-foreground text-sm mb-1">Yorum yazabilmek için hizmet alın</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Bu firmadan tamamlanmış bir siparişiniz olduğunda değerlendirme bırakabilirsiniz.
          </p>
        </div>
        <Button size="sm" className="rounded-xl px-6" onClick={() => setShowBooking(true)}>
          Randevu Al
        </Button>
      </div>
    );
  } else if (canReview && reviewSubmitted) {
    reviewSectionContent = (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center gap-3">
        <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
        <div>
          <p className="font-semibold text-green-800 text-sm">Yorumunuz eklendi!</p>
          <p className="text-xs text-green-600 mt-0.5">Değerlendirmeniz için teşekkürler.</p>
        </div>
      </motion.div>
    );
  } else if (canReview && alreadyReviewed) {
    reviewSectionContent = (
      <div className="bg-secondary/50 rounded-2xl p-5 flex flex-col items-center gap-3 text-center border border-border">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <p className="font-semibold text-foreground text-sm mb-1">Yorumunuzu zaten bıraktınız</p>
          <p className="text-xs text-muted-foreground">Bu firma için daha önce bir değerlendirme yaptınız.</p>
        </div>
      </div>
    );
  } else if (canReview) {
    reviewSectionContent = (
      <div className="border border-border rounded-2xl p-4 space-y-4 bg-secondary/20">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Puanınız</p>
          <Stars puan={reviewPuan} onClick={setReviewPuan} />
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Yorumunuz</p>
          <textarea rows={3} value={reviewText} onChange={e => setReviewText(e.target.value)}
            placeholder="Hizmet deneyiminizi paylaşın... (en az 10 karakter)"
            className="w-full border-2 border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors resize-none bg-white" />
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Fotoğraf Ekle</p>
          <input ref={photoRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          {reviewPhotoUrl ? (
            <div className="relative w-24 h-24">
              <img src={reviewPhotoUrl} alt="Yorum fotoğrafı" className="w-24 h-24 rounded-xl object-cover border border-border" />
              <button onClick={() => setReviewPhotoUrl(null)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center">
                <X className="w-3 h-3" />
              </button>
              <div className="mt-1.5 inline-flex items-center gap-1 text-xs text-green-700 font-medium">
                <CheckCircle2 className="w-3 h-3" /> Doğrulanmış İşlem rozeti alacaksınız
              </div>
            </div>
          ) : (
            <button onClick={() => photoRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
              <ImagePlus className="w-4 h-4" />
              Fotoğraf ekle
              <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md font-medium ml-1">+Rozet</span>
            </button>
          )}
        </div>
        {reviewError && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> {reviewError}
          </p>
        )}
        <Button onClick={handleReviewSubmit} disabled={submittingReview} className="w-full rounded-xl gap-2" size="sm">
          <Send className="w-4 h-4" /> {submittingReview ? "Gönderiliyor..." : "Yorumu Gönder"}
        </Button>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {firma && (
          <>
            {/* backdrop */}
            <motion.div key="fp-bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* modal */}
            <motion.div key="fp-mod"
              initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              className="fixed inset-0 z-[71] flex items-end sm:items-center justify-center pointer-events-none"
            >
              <div className="bg-white w-full max-w-2xl sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[95vh] flex flex-col pointer-events-auto overflow-hidden relative">

                {/* ─── Gallery ─── */}
                <div className="relative h-52 flex-shrink-0 overflow-hidden bg-secondary">
                  <AnimatePresence mode="wait">
                    <motion.div key={galleryIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className={`absolute inset-0 flex flex-col items-center justify-center gap-2 overflow-hidden ${
                        gallery[galleryIdx].kind === "grad"
                          ? `bg-gradient-to-br ${(gallery[galleryIdx] as { gradient: string }).gradient}`
                          : "bg-gray-900"
                      }`}>
                      {gallery[galleryIdx].kind === "img" ? (
                        <img
                          src={(gallery[galleryIdx] as { url: string }).url}
                          alt={gallery[galleryIdx].label}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <>
                          {(() => { const I = (gallery[galleryIdx] as { icon: typeof ShieldCheck }).icon; return <I className="w-16 h-16 text-white/40" />; })()}
                          <p className="text-white/50 text-sm font-medium">{gallery[galleryIdx].label}</p>
                        </>
                      )}
                    </motion.div>
                  </AnimatePresence>
                  {gallery.length > 1 && <>
                    <button onClick={() => setGalleryIdx(i => (i - 1 + gallery.length) % gallery.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={() => setGalleryIdx(i => (i + 1) % gallery.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {gallery.map((_, i) => (
                      <button key={i} onClick={() => setGalleryIdx(i)}
                        className={`h-1.5 rounded-full transition-all ${i === galleryIdx ? "bg-white w-4" : "bg-white/50 w-1.5"}`} />
                    ))}
                  </div>
                  <button onClick={onClose}
                    className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                  {badge && (
                    <div className={`absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${badge.color}`}>
                      {(() => { const I = badge.icon; return <I className="w-3.5 h-3.5" />; })()}
                      {badge.label}
                    </div>
                  )}
                  <div className="absolute bottom-3 right-4 bg-black/40 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                    {galleryIdx + 1}/{gallery.length}
                  </div>
                </div>

                {/* ─── Scrollable body ─── */}
                <div className="flex-1 overflow-y-auto">

                  {/* Firm identity */}
                  <div className="px-6 pt-5 pb-4 border-b border-border">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-xl font-bold text-foreground">{firma.name}</h2>
                          {firma.verified && (
                            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full text-xs font-bold">
                              <ShieldCheck className="w-3 h-3" /> Onaylı Firma
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{firma.location}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{firma.founded} yılından beri</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end flex-shrink-0">
                        <div className="flex items-center gap-1.5 bg-yellow-50 px-3 py-1.5 rounded-xl">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-bold text-foreground text-sm">{displayRating}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{displayReviewCount} yorum</p>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                      {[
                        { label: "Tamamlanan İş", value: firma.completedJobs + "+" },
                        { label: "Memnuniyet", value: "%98" },
                        { label: "Ortalama Yanıt", value: "2 saat" },
                      ].map(s => (
                        <div key={s.label} className="flex-1 bg-secondary/60 rounded-xl px-3 py-2.5 text-center">
                          <p className="font-bold text-foreground text-sm">{s.value}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b border-border px-6">
                    {(["genel", "yorumlar"] as const).map(t => (
                      <button key={t} onClick={() => setActiveTab(t)}
                        className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                        {t === "genel" ? "Genel Bilgi" : `Değerlendirmeler (${allReviews.length})`}
                      </button>
                    ))}
                  </div>

                  {/* ─── Genel tab ─── */}
                  {activeTab === "genel" && (
                    <div className="px-6 py-5 space-y-6">
                      <p className="text-sm text-muted-foreground leading-relaxed">{liveBio}</p>
                      {liveRegions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {liveRegions.map(r => (
                            <span key={r} className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                              <MapPin className="w-2.5 h-2.5" />{r}
                            </span>
                          ))}
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
                          <FileCheck className="w-4 h-4 text-primary" /> Sertifikalar & Belgeler
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {firma.certs.map(c => {
                            const Icon = c.icon;
                            return (
                              <div key={c.label} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border ${c.bg}`}>
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${c.color}`}>
                                  <Icon className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-xs font-semibold text-foreground leading-tight">{c.label}</span>
                              </div>
                            );
                          })}
                          {rawCertDocs.map((doc, i) => (
                            <a
                              key={i}
                              href={doc.url}
                              download={doc.name}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border bg-blue-50 border-blue-200 hover:bg-blue-100 transition-colors"
                            >
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-100 text-blue-600">
                                {doc.fileType === "pdf"
                                  ? <FileText className="w-3.5 h-3.5" />
                                  : <FileCheck className="w-3.5 h-3.5" />}
                              </div>
                              <span className="text-xs font-semibold text-foreground leading-tight truncate">{doc.name}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-primary" /> Hizmetler & Fiyatlar
                        </h3>
                        {!user ? (
                          /* ── Giriş yapmamış kullanıcılar için fiyat gizleme ── */
                          <div className="border-2 border-dashed border-border rounded-2xl p-6 flex flex-col items-center gap-3 text-center bg-secondary/30">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <Lock className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground text-sm mb-1">Fiyatları görmek için üye olun</p>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                Ücretsiz üyelik ile tüm fiyatları görün ve hemen randevu alın.
                              </p>
                            </div>
                            {displayServices.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {displayServices.length} hizmet mevcut
                              </p>
                            )}
                            <Button
                              size="sm"
                              className="rounded-xl px-6 mt-1"
                              onClick={() => { onClose(); setTimeout(() => { setAuthMode("musteri"); setShowAuthModal(true); }, 200); }}
                            >
                              <Lock className="w-3.5 h-3.5 mr-1.5" />
                              Giriş Yap / Üye Ol
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {orderedSvcGroups.map(group => {
                              const svcs       = svcByGroup[group] ?? [];
                              const isOpen     = expandedSvcGroups.has(group);
                              const GroupIcon  = SVC_GROUP_ICONS[group] ?? Sparkles;

                              return (
                                <div key={group} className={`border-2 rounded-2xl transition-colors ${isOpen ? "border-primary/30" : "border-border"}`}>
                                  <button
                                    type="button"
                                    onClick={() => toggleSvcGroup(group)}
                                    className="w-full flex items-center justify-between px-4 py-3 text-left"
                                  >
                                    <div className="flex items-center gap-2">
                                      <GroupIcon className={`w-3.5 h-3.5 ${isOpen ? "text-primary" : "text-muted-foreground"}`} />
                                      <span className={`text-xs font-bold uppercase tracking-wider ${isOpen ? "text-primary" : "text-foreground"}`}>
                                        {group}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground bg-secondary rounded-full px-1.5 py-0.5">
                                        {svcs.length}
                                      </span>
                                    </div>
                                    {isOpen
                                      ? <ChevronUp   className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                      : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                    }
                                  </button>
                                  <AnimatePresence>
                                    {isOpen && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="px-4 pb-4 space-y-2">
                                          {svcs.map(svc => (
                                            <div key={svc.name} className="border border-border rounded-xl p-3.5 hover:border-primary/30 transition-colors">
                                              <div className="flex items-start justify-between gap-2 mb-1">
                                                <p className="font-semibold text-foreground text-sm">{svc.name}</p>
                                                <div className="text-right flex-shrink-0">
                                                  {svc.price ? (
                                                    <>
                                                      <span className="font-bold text-primary">{svc.price} TL</span>
                                                      <span className="text-xs text-muted-foreground ml-1">{svc.unit}</span>
                                                    </>
                                                  ) : (
                                                    <span className="text-xs text-muted-foreground italic">Fiyat belirtilmemiş</span>
                                                  )}
                                                </div>
                                              </div>
                                              {svc.scope && <p className="text-xs text-muted-foreground leading-relaxed">{svc.scope}</p>}
                                            </div>
                                          ))}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ─── Yorumlar tab ─── */}
                  {activeTab === "yorumlar" && (
                    <div className="px-6 py-5 space-y-4">
                      {allReviews.map((rev, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                          className="bg-white border border-border rounded-2xl p-4 shadow-sm">
                          <div className="flex items-start gap-3">
                            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${rev.color} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                              {rev.initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <p className="text-sm font-semibold text-foreground">{rev.name}</p>
                                <Stars puan={rev.puan} />
                                {rev.hasPhoto && <VerifiedBadge />}
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">{rev.tarih}</p>
                              <p className="text-sm text-muted-foreground leading-relaxed">{rev.yorum}</p>
                              {rev.hasPhoto && (
                                <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-2.5 py-1 rounded-lg">
                                  <ImagePlus className="w-3 h-3" /> Fotoğraflı İnceleme
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      <div className="h-px bg-border" />
                      <div>
                        <h3 className="text-sm font-bold text-foreground mb-1">Müşteri Değerlendirmesi</h3>
                        <p className="text-xs text-muted-foreground mb-4">Yalnızca hizmeti tamamlanan üyeler yorum yapabilir.</p>
                        {reviewSectionContent}
                      </div>
                    </div>
                  )}
                </div>

                {/* ─── Sticky CTA ─── */}
                <div className="px-6 py-4 border-t border-border bg-white flex-shrink-0">
                  <div className="flex gap-3">
                    {/* Telefon + WhatsApp: yalnızca abone veya sponsor firmalar için göster */}
                    {(firma.isPremium || firma.isSubscribed || firma.isSponsor) && (
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="flex gap-2">
                          <a
                            href={firma.phone ? `tel:${digitsOnly(firma.phone)}` : undefined}
                            onClick={() => {
                              setShowCallWarning(v => !v);
                              trackAdCall();
                              trackGTMEvent("call", firma.name);
                            }}
                            className="flex-1 h-12 rounded-xl border-2 border-primary text-primary font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors"
                          >
                            <Phone className="w-4 h-4" /> Ara
                          </a>
                          {(() => {
                            const waSource = firma.whatsappPhone || firma.phone;
                            const wa = waSource ? toWhatsAppNumber(waSource) : "";
                            return wa ? (
                            <a
                              href={`https://wa.me/${wa}?text=${encodeURIComponent(`Merhaba, ${firma.name} hakkında bilgi almak istiyorum.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => trackGTMEvent("whatsapp", firma.name)}
                              className="h-12 px-4 rounded-xl bg-[#25D366] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#1ebe5a] transition-colors shadow-md shadow-green-600/20"
                              aria-label="WhatsApp ile iletişime geç"
                            >
                              <WhatsAppIcon className="w-5 h-5" />
                            </a>
                            ) : null;
                          })()}
                        </div>
                        <AnimatePresence>
                          {showCallWarning && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                              className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5 mt-1.5 flex items-start gap-1 leading-tight overflow-hidden"
                            >
                              <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                              Pilot dönemde ödeme hizmet sonunda doğrudan firmaya yapılır.
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                    {/* end of phone + whatsapp wrapper */}
                    <Button
                      onClick={() => {
                        setShowBooking(true);
                        trackAdQuote();
                        trackGTMEvent("quote", firma.name);
                      }}
                      className="flex-1 h-12 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      Randevu Al / Ödeme Yap
                    </Button>
                  </div>
                  <p className="text-center text-xs text-muted-foreground mt-2.5">
                    <strong className="text-foreground">Pilot dönemde ödeme hizmet sonunda firmaya yapılır</strong> — taksit altyapımız çok yakında sizinle.
                  </p>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* BookingModal — renders above firma modal */}
      {showBooking && (
        <BookingModal
          firma={{ name: firma.name, services: displayServices }}
          onClose={() => setShowBooking(false)}
          onSuccessReview={() => { setShowBooking(false); setActiveTab("yorumlar"); }}
        />
      )}
    </>
  );
}
