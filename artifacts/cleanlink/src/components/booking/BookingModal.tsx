import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, CalendarDays, MapPin, ChevronDown, ChevronUp,
  CheckCircle2, Clock, PartyPopper, Phone, AlertCircle,
  Home, Sofa, Car, Layers, Moon, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp, TR_REGIONS, SERVICE_META, SERVICE_GROUPS } from "@/context/AppContext";
import { trackAdOrder, isAdSession } from "@/lib/adTracking";
import { trackGTMEvent, lockBodyScroll, unlockBodyScroll } from "@/lib/analytics";
import { apiValidateCoupon, type CouponValidation } from "@/lib/api";
import { TicketPercent } from "lucide-react";

const GROUP_ICONS: Record<string, React.ReactNode> = {
  "Ev Temizliği":    <Home    className="w-3.5 h-3.5" />,
  "Koltuk Yıkama":  <Sofa    className="w-3.5 h-3.5" />,
  "Araç Koltuk Yıkama":<Car className="w-3.5 h-3.5" />,
  "Halı Yıkama":    <Layers  className="w-3.5 h-3.5" />,
  "Yatak & Yorgan": <Moon    className="w-3.5 h-3.5" />,
};

/* Static label→group lookup (SERVICE_META is module-level constant) */
const LABEL_TO_GROUP: Record<string, string> = {};
for (const [, meta] of Object.entries(SERVICE_META)) LABEL_TO_GROUP[meta.label] = meta.group;

export interface BookingServiceItem {
  name: string;
  price: string;
  unit: string;
  scope: string;
}

interface Props {
  firma: { name: string; userId?: number; services: BookingServiceItem[] } | null;
  preselectedService?: string;
  preselectedQty?: number;
  onClose: () => void;
  onSuccessReview?: () => void;
}

const TIME_SLOTS = [
  { id: "09-12", label: "Sabah",       time: "09:00 – 12:00" },
  { id: "12-15", label: "Öğle",        time: "12:00 – 15:00" },
  { id: "15-18", label: "Öğle Sonrası",time: "15:00 – 18:00" },
  { id: "18-21", label: "Akşam",       time: "18:00 – 21:00" },
];

function todayStr() { return new Date().toISOString().split("T")[0]; }

function niceDateStr(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  const months = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
}

function randomId() { return `ORD-${String(Math.floor(Math.random() * 900) + 100)}`; }
function formatDate() {
  return new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
}

/* Returns the numeric price from a price string, 0 if empty/unavailable */
function parsePrice(priceStr: string): number {
  if (!priceStr || priceStr.trim() === "") return 0;
  return parseInt(priceStr.replace(/\D/g, ""), 10) || 0;
}

export function BookingModal({ firma, preselectedService, preselectedQty, onClose, onSuccessReview }: Props) {
  const { user, setShowAuthModal, setAuthMode, addOrder, setPendingBooking, pendingBooking } = useApp();

  /* ── Multi-select state ── */
  const [checkedNames, setCheckedNames] = useState<Set<string>>(new Set());
  const [sqmMap, setSqmMap]             = useState<Record<string, string>>({});

  /* ── Service group accordion ── */
  const servicesByGroup = useMemo(() => {
    const groups: Record<string, BookingServiceItem[]> = {};
    for (const svc of firma?.services ?? []) {
      const group = LABEL_TO_GROUP[svc.name] ?? "Diğer";
      if (!groups[group]) groups[group] = [];
      groups[group].push(svc);
    }
    return groups;
  }, [firma?.services]);

  /* Show all groups that have at least 1 service (active or passive);
     active = price > 0, passive = shown greyed-out but still visible */
  const orderedGroups = useMemo(() => {
    const order = [...SERVICE_GROUPS, "Diğer"] as string[];
    return order.filter(g => (servicesByGroup[g]?.length ?? 0) > 0);
  }, [servicesByGroup]);

  /* Groups start CLOSED; groups containing selected services auto-open */
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  /* Ref tracks the currently-open firma name so the persist effect always
     writes to the correct localStorage key even when the firma prop changes */
  const firmaNameRef = useRef<string | null>(null);

  /* Load persisted group state whenever a new firma is opened */
  useEffect(() => {
    if (!firma) return;
    firmaNameRef.current = firma.name;
    try {
      const saved = localStorage.getItem(`cleanlink_booking_groups_${firma.name}`);
      setExpandedGroups(saved ? new Set(JSON.parse(saved) as string[]) : new Set());
    } catch {
      setExpandedGroups(new Set());
    }
  }, [firma?.name]);

  /* Persist group state whenever it changes */
  useEffect(() => {
    const name = firmaNameRef.current;
    if (!name) return;
    try {
      localStorage.setItem(`cleanlink_booking_groups_${name}`, JSON.stringify([...expandedGroups]));
    } catch {
      /* ignore storage errors (e.g. private mode quota) */
    }
  }, [expandedGroups]);

  /* When selected services change (preselect/restore), open their groups */
  useEffect(() => {
    if (checkedNames.size === 0) return;
    setExpandedGroups(prev => {
      const next = new Set(prev);
      for (const name of checkedNames) next.add(LABEL_TO_GROUP[name] ?? "Diğer");
      return next;
    });
  }, [checkedNames]);

  function toggleGroup(group: string) {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group); else next.add(group);
      return next;
    });
  }

  const [openDateTime, setOpenDateTime] = useState(true);
  const [openAddress,  setOpenAddress]  = useState(false);

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [ilce,         setIlce]         = useState("");
  const [mahalle,      setMahalle]      = useState("");
  const [adres,        setAdres]        = useState("");
  const [telefon,      setTelefon]      = useState("");
  const [ecoOption,    setEcoOption]    = useState(false);

  /* ── Kupon ── */
  const [couponCode,   setCouponCode]   = useState("");
  const [couponData,   setCouponData]   = useState<CouponValidation | null>(null);
  const [couponErr,    setCouponErr]    = useState<string>("");
  const [couponLoading,setCouponLoading]= useState(false);

  async function handleApplyCoupon() {
    if (!couponCode.trim() || subtotal <= 0) return;
    setCouponLoading(true); setCouponErr("");
    try {
      const v = await apiValidateCoupon(couponCode.trim(), subtotal);
      setCouponData(v);
    } catch (err) {
      setCouponData(null);
      setCouponErr((err as Error).message ?? "Kupon doğrulanamadı");
    } finally { setCouponLoading(false); }
  }
  function handleRemoveCoupon() {
    setCouponData(null); setCouponCode(""); setCouponErr("");
  }
  const [step,         setStep]         = useState<"booking" | "success">("booking");

  /* Body scroll kilidi */
  useEffect(() => {
    if (!firma) return;
    lockBodyScroll();
    return () => { unlockBodyScroll(); };
  }, [firma?.name]);

  /* Auto-check preselected service veya form state'i geri yükle */
  useEffect(() => {
    if (!firma) return;
    // Giriş öncesi kaydedilen form durumu varsa geri yükle
    if (pendingBooking?.formState && pendingBooking.firma.name === firma.name) {
      const fs = pendingBooking.formState;
      setCheckedNames(new Set(fs.checkedNames));
      setSqmMap(fs.sqmMap);
      setSelectedDate(fs.selectedDate);
      setSelectedSlot(fs.selectedSlot);
      setIlce(fs.ilce);
      setMahalle(fs.mahalle);
      setAdres(fs.adres);
      setTelefon(fs.telefon);
      setEcoOption(fs.ecoOption);
      setPendingBooking(null);
      return;
    }
    // Önceden seçilmiş hizmet varsa işaretle
    const initial = new Set<string>();
    if (preselectedService) {
      const found = firma.services.find(s => s.name === preselectedService && parsePrice(s.price) > 0);
      if (found) {
        initial.add(found.name);
        if (found.unit.includes("m²") && preselectedQty) {
          setSqmMap({ [found.name]: String(preselectedQty) });
        }
      }
    }
    setCheckedNames(initial);
  }, [firma?.name]);

  if (!firma) return null;

  /* ── Toggle checkbox ── */
  function toggleSvc(name: string) {
    setCheckedNames(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  /* ── Price computation ── */
  const { base, breakdown } = useMemo(() => {
    let sum = 0;
    const lines: { name: string; amount: number; m2?: number }[] = [];
    for (const name of checkedNames) {
      const svc = firma.services.find(s => s.name === name);
      if (!svc) continue;
      const p = parsePrice(svc.price);
      if (svc.unit.includes("m²")) {
        const qty = parseInt(sqmMap[name] || "0") || 0;
        sum += p * qty;
        lines.push({ name, amount: p * qty, m2: qty });
      } else {
        sum += p;
        lines.push({ name, amount: p });
      }
    }
    return { base: sum, breakdown: lines };
  }, [checkedNames, sqmMap, firma.services]);

  const kdv         = Math.round(base * 0.18);
  const ecoFee      = ecoOption ? 75 : 0;
  const subtotal    = base + kdv + ecoFee;
  const discount    = couponData?.discountAmount ?? 0;
  const total       = Math.max(0, subtotal - discount);
  const fidanSayisi = total >= 5000 ? Math.floor(total / 5000) : 0;
  const mamaBirim   = ecoOption ? 50 : 0; // Pati seçeneği → 50 birim × 100gr mama (5000gr)
  const mamaBagisi  = ecoOption;

  /* ── Validation ── */
  const allM2Filled = [...checkedNames].every(name => {
    const svc = firma.services.find(s => s.name === name);
    if (!svc?.unit.includes("m²")) return true;
    return parseInt(sqmMap[name] || "0") > 0;
  });

  const canProceed =
    checkedNames.size > 0 &&
    allM2Filled &&
    !!selectedDate &&
    !!selectedSlot &&
    !!ilce.trim();

  const ctaLabel =
    checkedNames.size === 0
      ? "En az bir hizmet seçin"
      : !allM2Filled
      ? "m² Giriniz"
      : !selectedDate || !selectedSlot
      ? "Tarih & Saat Seçin"
      : !ilce.trim()
      ? "İlçe Bilgisi Girin"
      : "Randevuyu Onayla";

  /* ── Summary text for success screen (flat, stored in order.hizmet) ── */
  const hizmetSummary = [...checkedNames].map(name => {
    const svc = firma.services.find(s => s.name === name);
    if (!svc) return name;
    if (svc.unit.includes("m²")) {
      const q = parseInt(sqmMap[name] || "0") || 0;
      return q > 0 ? `${name} — ${q} m²` : name;
    }
    return name;
  }).join(" · ");

  /* ── Grouped services for success screen display ── */
  const selectedByGroup: Array<{ group: string; items: string[] }> = [];
  for (const group of [...SERVICE_GROUPS, "Diğer"] as string[]) {
    const items: string[] = [];
    for (const name of checkedNames) {
      if ((LABEL_TO_GROUP[name] ?? "Diğer") === group) {
        const svc = firma.services.find(s => s.name === name);
        if (svc?.unit.includes("m²")) {
          const q = parseInt(sqmMap[name] || "0") || 0;
          items.push(q > 0 ? `${name} — ${q} m²` : name);
        } else {
          items.push(name);
        }
      }
    }
    if (items.length) selectedByGroup.push({ group, items });
  }

  /* ── Confirm order ── */
  function handleConfirm() {
    if (!canProceed || !user) return;
    const orderId = randomId();
    addOrder({
      id: orderId,
      musteri: user.name,
      musteriEmail: user.email,
      firmaName: firma!.name,
      vendorUserId: firma!.userId,
      hizmet: hizmetSummary,
      toplam: total,
      durum: "beklemede",
      tarih: formatDate(),
      istenenTarih: niceDateStr(selectedDate),
      istenenSaatDilimi: selectedSlot,
      ilce: ilce.trim() || undefined,
      mahalle: mahalle.trim() || undefined,
      adres: adres.trim() || undefined,
      telefon: telefon.trim() || undefined,
      ecoOption,
      fidanSayisi: fidanSayisi > 0 ? fidanSayisi : undefined,
      mamaBirim: mamaBirim > 0 ? mamaBirim : undefined,
      couponCode: couponData?.code,
    });
    if (isAdSession()) trackAdOrder(orderId);
    trackGTMEvent("order", firma!.name, { order_id: orderId, total, services: [...checkedNames] });
    setStep("success");
  }

  function handleOpenAuth() {
    if (firma) {
      setPendingBooking({
        firma,
        formState: {
          checkedNames: [...checkedNames],
          sqmMap,
          selectedDate,
          selectedSlot,
          ilce,
          mahalle,
          adres,
          telefon,
          ecoOption,
        },
      });
    }
    onClose();
    setTimeout(() => { setAuthMode("musteri"); setShowAuthModal(true); }, 200);
  }

  return (
    <AnimatePresence>
      <motion.div
        key="bm-bd"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        key="bm-modal"
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="fixed inset-0 z-[91] flex items-end sm:items-center justify-center pointer-events-none"
      >
        <div
          className="bg-white w-full max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col pointer-events-auto overflow-hidden"
          style={{ maxHeight: "calc(100dvh - 16px)" }}
          onClick={e => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
            <div>
              <h3 className="font-bold text-foreground text-lg leading-tight">Hizmet Seçin</h3>
              <p className="text-sm text-muted-foreground">
                {firma.name}
                {checkedNames.size > 0 && (
                  <span className="ml-1.5 text-primary font-semibold">· {checkedNames.size} hizmet seçildi</span>
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-secondary hover:bg-border transition-colors flex items-center justify-center flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── Scrollable body ── */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">

              {/* ────── BOOKING STEP ────── */}
              {step === "booking" && (
                <motion.div key="booking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="px-5 py-4 space-y-3">

                    {/* ─ Services list — grouped by category ─ */}
                    {orderedGroups.map(group => {
                      const svcs         = servicesByGroup[group] ?? [];
                      const isExpanded   = expandedGroups.has(group);
                      const selectedInGrp = svcs.filter(s => checkedNames.has(s.name)).length;
                      const GroupIcon    = GROUP_ICONS[group];

                      return (
                        <div key={group} className={`border-2 rounded-2xl transition-colors ${isExpanded ? "border-primary/30" : "border-border"}`}>
                          {/* Accordion header */}
                          <button
                            type="button"
                            onClick={() => toggleGroup(group)}
                            className="w-full flex items-center justify-between px-4 py-3.5 text-left"
                          >
                            <div className="flex items-center gap-2">
                              <span className={isExpanded ? "text-primary" : "text-muted-foreground"}>
                                {GroupIcon}
                              </span>
                              <span className={`text-xs font-bold uppercase tracking-wider ${isExpanded ? "text-primary" : "text-foreground"}`}>
                                {group}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {selectedInGrp > 0 && (
                                <span className="text-[11px] text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-full">
                                  {selectedInGrp} seçildi
                                </span>
                              )}
                              {isExpanded
                                ? <ChevronUp   className="w-4 h-4 text-muted-foreground" />
                                : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              }
                            </div>
                          </button>

                          {/* Accordion content */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4 space-y-3">
                                  {svcs.map(svc => {
                                    const isChecked = checkedNames.has(svc.name);
                                    const isM2Svc   = svc.unit.includes("m²");
                                    const available = parsePrice(svc.price) > 0;

                                    return (
                                      <div key={svc.name}>
                                        <div
                                          title={!available ? "Bu firma bu hizmeti sunmuyor" : undefined}
                                          className={!available ? "cursor-not-allowed opacity-50" : ""}
                                        >
                                          <button
                                            type="button"
                                            disabled={!available}
                                            onClick={() => available && toggleSvc(svc.name)}
                                            className={`w-full border-2 rounded-2xl p-4 text-left transition-all disabled:pointer-events-none ${
                                              !available
                                                ? "border-border bg-secondary/40"
                                                : isChecked
                                                ? "border-primary bg-primary/5 shadow-sm"
                                                : "border-border hover:border-primary/30 hover:bg-gray-50"
                                            }`}
                                          >
                                            <div className="flex items-start gap-3">
                                              <div className={`w-4 h-4 rounded border-2 mt-0.5 flex-shrink-0 flex items-center justify-center transition-colors ${
                                                !available
                                                  ? "border-border bg-secondary"
                                                  : isChecked
                                                  ? "border-primary bg-primary"
                                                  : "border-border"
                                              }`}>
                                                {isChecked && <CheckCircle2 className="w-3 h-3 text-white" />}
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm text-foreground leading-snug">{svc.name}</p>
                                                {svc.scope && (
                                                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{svc.scope}</p>
                                                )}
                                                {!available && (
                                                  <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" /> Bu firma bu hizmeti sunmuyor
                                                  </p>
                                                )}
                                              </div>
                                              <div className="text-right flex-shrink-0 ml-2">
                                                {available ? (
                                                  user ? (
                                                    <>
                                                      <span className={`font-bold text-sm ${isChecked ? "text-primary" : "text-foreground"}`}>
                                                        {svc.price} TL
                                                      </span>
                                                      <p className="text-[11px] text-muted-foreground">{svc.unit}</p>
                                                    </>
                                                  ) : (
                                                    <span className="inline-flex flex-col items-end gap-0.5">
                                                      <Lock className="w-4 h-4 text-muted-foreground" />
                                                      <span className="text-[10px] text-muted-foreground leading-tight">Giriş yapın</span>
                                                    </span>
                                                  )
                                                ) : (
                                                  <span className="text-xs text-muted-foreground italic">—</span>
                                                )}
                                              </div>
                                            </div>
                                          </button>
                                        </div>

                                        {/* m² input — appears below each checked m² service */}
                                        <AnimatePresence>
                                          {isChecked && isM2Svc && (
                                            <motion.div
                                              initial={{ opacity: 0, height: 0 }}
                                              animate={{ opacity: 1, height: "auto" }}
                                              exit={{ opacity: 0, height: 0 }}
                                              className="overflow-hidden"
                                            >
                                              <div className="mt-2 mx-1 p-3 bg-primary/5 border-2 border-primary/20 rounded-2xl">
                                                <label className="text-xs font-semibold text-muted-foreground mb-2 block">
                                                  {svc.name} — kaç m²? <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                  <input
                                                    type="number"
                                                    min="1"
                                                    placeholder="0"
                                                    value={sqmMap[svc.name] || ""}
                                                    onChange={e => setSqmMap(prev => ({ ...prev, [svc.name]: e.target.value }))}
                                                    className="w-full bg-white border-2 border-border rounded-xl px-4 py-2.5 outline-none focus:border-primary text-foreground font-medium text-sm transition-colors"
                                                  />
                                                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">m²</span>
                                                </div>
                                                {parseInt(sqmMap[svc.name] || "0") > 0 && (
                                                  <p className="text-xs text-primary font-medium mt-1.5">
                                                    Tahmini: {(parsePrice(svc.price) * parseInt(sqmMap[svc.name])).toLocaleString("tr-TR")} TL (KDV hariç)
                                                  </p>
                                                )}
                                              </div>
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </div>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}

                    {/* ─ Tarih & Saat accordion ─ */}
                    <div className={`border-2 rounded-2xl transition-colors ${openDateTime ? "border-primary/40" : "border-border"}`}>
                      <button
                        onClick={() => setOpenDateTime(v => !v)}
                        className="w-full flex items-center justify-between px-4 py-3.5 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <CalendarDays className={`w-4 h-4 ${openDateTime ? "text-primary" : "text-muted-foreground"}`} />
                          <span className={`text-xs font-bold uppercase tracking-wider ${openDateTime ? "text-primary" : "text-foreground"}`}>
                            Tercih Ettiğiniz Tarih & Saat
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedDate && selectedSlot && (
                            <span className="text-[11px] text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">
                              {niceDateStr(selectedDate)} · {selectedSlot.split("–")[0].trim()}
                            </span>
                          )}
                          {openDateTime ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      </button>
                      <AnimatePresence>
                        {openDateTime && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 space-y-3">
                              <div>
                                <label className="text-xs text-muted-foreground mb-1.5 block">İstenen Tarih <span className="text-red-500">*</span></label>
                                <input
                                  type="date"
                                  value={selectedDate}
                                  min={todayStr()}
                                  onChange={e => setSelectedDate(e.target.value)}
                                  className="w-full border-2 border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors bg-white"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground mb-2 block">Saat Dilimi <span className="text-red-500">*</span></label>
                                <div className="grid grid-cols-2 gap-2">
                                  {TIME_SLOTS.map(slot => (
                                    <button
                                      key={slot.id}
                                      type="button"
                                      onClick={() => setSelectedSlot(slot.time)}
                                      className={`py-2.5 px-3 rounded-xl border-2 transition-all text-center ${selectedSlot === slot.time ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
                                    >
                                      <p className="text-xs font-bold">{slot.label}</p>
                                      <p className="text-[10px] mt-0.5">{slot.time}</p>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* ─ Adres & İletişim accordion ─ */}
                    <div className={`border-2 rounded-2xl transition-colors ${openAddress ? "border-primary/40" : "border-border"}`}>
                      <button
                        onClick={() => setOpenAddress(v => !v)}
                        className="w-full flex items-center justify-between px-4 py-3.5 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className={`w-4 h-4 ${openAddress ? "text-primary" : "text-muted-foreground"}`} />
                          <span className={`text-xs font-bold uppercase tracking-wider ${openAddress ? "text-primary" : "text-foreground"}`}>
                            Adres & İletişim
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {ilce && (
                            <span className="text-[11px] text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">{ilce}</span>
                          )}
                          {openAddress ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      </button>
                      <AnimatePresence>
                        {openAddress && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 space-y-3">
                              <p className="text-[11px] text-muted-foreground leading-relaxed bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                🔒 Açık adresiniz (no/daire) yalnızca randevu kesinleştikten sonra firmaya iletilir.
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-xs text-muted-foreground mb-1 block">İlçe <span className="text-red-500">*</span></label>
                                  <select
                                    value={ilce}
                                    onChange={e => setIlce(e.target.value)}
                                    className="w-full border-2 border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors bg-white"
                                  >
                                    <option value="">Seçiniz</option>
                                    {TR_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <label className="text-xs text-muted-foreground mb-1 block">Mahalle</label>
                                  <input
                                    type="text"
                                    value={mahalle}
                                    onChange={e => setMahalle(e.target.value)}
                                    placeholder="Ör: Moda"
                                    className="w-full border-2 border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary transition-colors bg-white"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1 block">
                                  Açık Adres (No/Daire)
                                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">🔒 Kilitli</span>
                                </label>
                                <input
                                  type="text"
                                  value={adres}
                                  onChange={e => setAdres(e.target.value)}
                                  placeholder="Ör: Moda Cad. No:12 D:5"
                                  className="w-full border-2 border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary transition-colors bg-white"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5 block">
                                  <Phone className="w-3 h-3" /> Telefon Numaranız
                                </label>
                                <input
                                  type="tel"
                                  value={telefon}
                                  onChange={e => setTelefon(e.target.value)}
                                  placeholder="05xx xxx xx xx"
                                  className="w-full border-2 border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary transition-colors bg-white"
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* ─ Pati Seçeneği ─ */}
                    <button
                      type="button"
                      onClick={() => setEcoOption(v => !v)}
                      className={`w-full flex items-start gap-3 p-3.5 rounded-2xl border-2 text-left transition-all ${ecoOption ? "border-amber-500 bg-amber-50" : "border-border hover:border-amber-300 hover:bg-amber-50/30"}`}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-colors ${ecoOption ? "border-amber-500 bg-amber-500" : "border-border"}`}>
                        {ecoOption && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                          🐾 Pati Seçeneği <span className="text-amber-600 font-bold">+75 TL</span>
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                          Adınıza 50 birim × 100gr mama (5 kg) barınak hayvanlarına bağışlansın.
                        </p>
                      </div>
                    </button>
                  </div>

                  {/* ── Footer: price summary + CTA ── */}
                  <div className="px-5 py-4 border-t border-border bg-white flex-shrink-0 space-y-3">
                    {/* Price breakdown — only visible to logged-in users */}
                    {user && base > 0 && (
                      <div className="space-y-1.5 text-xs px-0.5">
                        {breakdown.map(line => (
                          <div key={line.name} className="flex justify-between text-muted-foreground">
                            <span className="truncate mr-2">
                              {line.name}{line.m2 && line.m2 > 0 ? ` (${line.m2} m²)` : ""}
                            </span>
                            <span className="font-medium text-foreground flex-shrink-0">
                              {line.amount.toLocaleString("tr-TR")} TL
                            </span>
                          </div>
                        ))}
                        <div className="flex justify-between text-muted-foreground">
                          <span>KDV (%18)</span>
                          <span className="font-medium text-foreground">{kdv.toLocaleString("tr-TR")} TL</span>
                        </div>
                        {ecoOption && (
                          <div className="flex justify-between text-amber-600">
                            <span>Pati Seçeneği (50 birim × 100gr mama)</span>
                            <span className="font-medium">+75 TL</span>
                          </div>
                        )}
                        {couponData && (
                          <div className="flex justify-between text-emerald-700">
                            <span className="inline-flex items-center gap-1">
                              <TicketPercent className="w-3 h-3" /> Kupon ({couponData.code})
                            </span>
                            <span className="font-medium">−{discount.toLocaleString("tr-TR")} TL</span>
                          </div>
                        )}
                        <div className="h-px bg-border" />

                        {/* Kupon UI */}
                        {!couponData ? (
                          <div className="flex gap-1.5 mt-1">
                            <input
                              type="text"
                              value={couponCode}
                              onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponErr(""); }}
                              placeholder="İndirim kodu"
                              className="flex-1 px-2.5 py-1.5 text-xs border border-border rounded-lg uppercase font-mono"
                              maxLength={40}
                            />
                            <button
                              type="button"
                              onClick={handleApplyCoupon}
                              disabled={!couponCode.trim() || couponLoading || subtotal <= 0}
                              className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg disabled:opacity-50 hover:bg-emerald-700"
                            >
                              {couponLoading ? "..." : "Uygula"}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={handleRemoveCoupon}
                            className="text-[11px] text-muted-foreground hover:text-red-600 mt-1 inline-flex items-center gap-1"
                          >
                            ✕ Kuponu kaldır
                          </button>
                        )}
                        {couponErr && (
                          <p className="text-[11px] text-red-600">{couponErr}</p>
                        )}

                        <div className="flex justify-between font-bold text-sm">
                          <span className="text-foreground">Toplam ({checkedNames.size} hizmet)</span>
                          <span className="text-primary">{total.toLocaleString("tr-TR")} TL</span>
                        </div>
                        {fidanSayisi > 0 && (
                          <div className="flex justify-between text-green-700 font-semibold bg-green-50 rounded-lg px-2.5 py-1.5">
                            <span className="flex items-center gap-1">🌳 Bağışlanacak Fidan</span>
                            <span>{fidanSayisi} adet</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Fiyat kilidi — giriş yapmamış kullanıcı, hizmet seçmiş */}
                    {!user && checkedNames.size > 0 && (
                      <div className="flex items-center gap-2.5 bg-secondary/60 border border-border rounded-xl px-3 py-2.5">
                        <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <p className="text-xs text-muted-foreground leading-snug">
                          {checkedNames.size} hizmet seçildi · <span className="font-semibold text-foreground">Fiyatları görmek ve randevu almak için giriş yapın</span>
                        </p>
                      </div>
                    )}

                    {/* Validation hints */}
                    {checkedNames.size > 0 && (!selectedDate || !selectedSlot) ? (
                      <p className="text-xs text-amber-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Lütfen tarih ve saat dilimi seçin.
                      </p>
                    ) : checkedNames.size > 0 && !ilce.trim() ? (
                      <p className="text-xs text-amber-600 flex items-center gap-1 cursor-pointer" onClick={() => setOpenAddress(true)}>
                        <MapPin className="w-3 h-3" /> Lütfen adres bölümünden ilçe seçin.
                      </p>
                    ) : null}

                    {/* CTA */}
                    {user?.type === "musteri" ? (
                      <Button
                        onClick={handleConfirm}
                        disabled={!canProceed}
                        className="w-full h-12 rounded-xl font-bold text-sm gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {ctaLabel}
                      </Button>
                    ) : (
                      <Button onClick={handleOpenAuth} className="w-full h-12 rounded-xl font-bold text-sm gap-2 shadow-lg shadow-primary/20">
                        Giriş Yap / Üye Ol
                      </Button>
                    )}
                    <p className="text-center text-xs text-muted-foreground">
                      Pilot dönem · Hizmet sonunda firmaya ödeme · İptal garantisi
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ────── SUCCESS STEP ────── */}
              {step === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center gap-5 px-8 py-10 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center shadow-2xl shadow-primary/30 flex-shrink-0"
                  >
                    <PartyPopper className="w-9 h-9 text-white" />
                  </motion.div>
                  <div className="w-full">
                    <h3 className="text-2xl font-bold text-foreground mb-2">Randevunuz Oluşturuldu!</h3>
                    <p className="text-muted-foreground leading-relaxed text-sm mb-4">
                      Rezervasyonunuz <strong>{firma.name}</strong>'e iletildi.
                      Firma onayladığında bildirim alacaksınız.
                    </p>
                    {/* Grouped services summary */}
                    <div className="space-y-2 text-left">
                      {selectedByGroup.map(({ group, items }) => (
                        <div key={group} className="bg-secondary/60 rounded-xl px-4 py-3 border border-border">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                            <span className="text-primary">{GROUP_ICONS[group]}</span>
                            {group}
                          </p>
                          <ul className="space-y-1">
                            {items.map(item => (
                              <li key={item} className="text-xs font-medium text-foreground flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                  {fidanSayisi > 0 && (
                    <div className="w-full bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
                      <span className="text-3xl flex-shrink-0">🌳</span>
                      <div className="text-left">
                        <p className="text-sm font-bold text-green-800">Tebrikler! {fidanSayisi} fidan bağışlandı.</p>
                        <p className="text-xs text-green-700 mt-0.5 leading-relaxed">
                          Siparişiniz adına {fidanSayisi} fidan doğaya kazandırılacak.
                        </p>
                      </div>
                    </div>
                  )}
                  {mamaBagisi && (
                    <div className="w-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                      <span className="text-3xl flex-shrink-0">🐾</span>
                      <div className="text-left">
                        <p className="text-sm font-bold text-amber-800">Mama bağışınız iletildi!</p>
                        <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                          Adınıza 50 birim × 100gr mama (5 kg) barınak hayvanlarına bağışlanacak.
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 w-full">
                    <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">
                      Kapat
                    </Button>
                    {onSuccessReview && (
                      <Button onClick={() => { onClose(); onSuccessReview(); }} className="flex-1 rounded-xl gap-1">
                        Yorum Yap
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
