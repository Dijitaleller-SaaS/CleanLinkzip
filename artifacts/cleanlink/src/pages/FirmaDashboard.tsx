import { useState, useRef, useCallback, useEffect } from "react";

import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Settings, ShoppingBag, TrendingUp,
  LogOut, Sparkles, Check, ChevronRight, BadgeCheck, Clock, CheckCircle2,
  Star, Upload, X, FileText, Image as ImageIcon, MessageSquare, User as UserIcon,
  Plus, Shield, Megaphone, Rocket, ArrowRight, MapPin, Crown, Phone, Lock, AlertTriangle,
  Globe, Bell, ChevronDown, Home, ExternalLink, Download, Mail, Paperclip, CalendarClock, Package, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp, Order, SERVICE_KEYS, SERVICE_META, SERVICE_GROUPS, ServiceKey, FirmaPrices, ServiceScopes, getMusteriEmail, ADMIN_EMAIL, approveFirmaHavale, extendFirmaSubscription, isSubExpired, SUB_DURATION_MS } from "@/context/AppContext";
import { apiSubmitHavale, apiGetMyVendorProfile, apiUpdateVendorProfile, apiNotifyDekont, apiPaytrStatus, apiPaytrInit } from "@/lib/api";
import { loadAdConversions, filterByPeriod, trackAdCall, exportAdConversionsJson, type AdConversionsData } from "@/lib/adTracking";

type Tab = "panel" | "siparisler" | "yorumlar" | "fiyatlar" | "profil" | "reklam";

/* ─────────── constants ─────────── */

const FIRMA_LABEL_TO_GROUP: Record<string, string> = {};
for (const [, meta] of Object.entries(SERVICE_META)) FIRMA_LABEL_TO_GROUP[meta.label] = meta.group;

const FIRMA_GROUP_ORDER = [...SERVICE_GROUPS, "Diğer"] as string[];

const STATUS_MAP: Record<Order["durum"], { label: string; color: string; icon: typeof Clock }> = {
  beklemede:    { label: "Beklemede",      color: "bg-yellow-100 text-yellow-700", icon: Clock },
  onayBekliyor: { label: "Onay Bekliyor",  color: "bg-blue-100 text-blue-700",    icon: BadgeCheck },
  onaylandi:    { label: "Onaylandı",      color: "bg-teal-100 text-teal-700",    icon: BadgeCheck },
  kesinlesti:   { label: "Kesinleşti",     color: "bg-green-100 text-green-700",  icon: CheckCircle2 },
  tamamlandi:   { label: "Tamamlandı",     color: "bg-gray-100 text-gray-600",    icon: CheckCircle2 },
  reddedildi:   { label: "Reddedildi",     color: "bg-red-100 text-red-600",      icon: X },
  zamanAsimi:   { label: "Zaman Aşımı",   color: "bg-orange-100 text-orange-700", icon: Clock },
};

const TR_REGIONS = [
  "Beşiktaş","Şişli","Kadıköy","Üsküdar","Bakırköy",
  "Beyoğlu","Sarıyer","Ataşehir","Maltepe","Pendik",
  "Bağcılar","Bahçelievler","Gaziosmanpaşa","Küçükçekmece","Avcılar",
  "Fatih","Zeytinburnu","Eyüpsultan","Kartal","Tuzla",
];

const MOCK_REVIEWS = [
  {
    id: 1, musteri: "Zeynep A.", initials: "ZA", color: "from-violet-500 to-purple-600",
    puan: 5, tarih: "28 Mar 2026",
    yorum: "Harika bir hizmet aldık! Ekip çok profesyoneldi, evimiz pırıl pırıl oldu. Zamanında geldiler ve her köşeyi özenerek temizlediler. Kesinlikle tekrar tercih edeceğiz.",
    hizmet: "2+1 Ev Temizliği",
  },
  {
    id: 2, musteri: "Kerem B.", initials: "KB", color: "from-sky-500 to-blue-600",
    puan: 5, tarih: "25 Mar 2026",
    yorum: "Koltuk yıkama sonrası sanki sıfır koltuk aldım. Buharlı yıkama gerçekten işe yarıyor. Koku da çok güzel, deterjan kalıntısı yok. Teşekkürler!",
    hizmet: "L Koltuk Yıkama",
  },
  {
    id: 3, musteri: "Merve Ç.", initials: "MÇ", color: "from-rose-400 to-pink-600",
    puan: 4, tarih: "22 Mar 2026",
    yorum: "Halılar çok temiz geldi, renkleri de açıldı. Sadece bir halıyı biraz geç getirdiler ama sorun değil, kalite mükemmeldi. Tavsiye ederim.",
    hizmet: "Halı Yıkama",
  },
  {
    id: 4, musteri: "Osman D.", initials: "OD", color: "from-amber-500 to-orange-600",
    puan: 5, tarih: "19 Mar 2026",
    yorum: "İlk kez bu firmayı denedim, çok memnun kaldım. Fiyat-performans dengesi mükemmel. Personel güler yüzlü, dakik ve dikkatli çalışıyorlar.",
    hizmet: "2+1 Ev + L Koltuk",
  },
  {
    id: 5, musteri: "Selin E.", initials: "SE", color: "from-teal-500 to-primary",
    puan: 5, tarih: "15 Mar 2026",
    yorum: "CleanLink üzerinden bulduğuma çok sevindim. Fiyat şeffaflığı ve randevu kolaylığı süper. Hizmet kalitesi de beklentilerimin çok üzerindeydi.",
    hizmet: "Halı Yıkama",
  },
];

const MAX_GALLERY = 6;

interface DocItem { name: string; fileType: "pdf" | "image"; url: string; size: string; }

/* ─────────── helpers ─────────── */

function HizmetGrouped({ hizmet }: { hizmet: string }) {
  const items = hizmet.split(" · ").map(s => s.trim()).filter(Boolean);
  const grouped: Array<{ group: string; items: string[] }> = [];
  for (const group of FIRMA_GROUP_ORDER) {
    const groupItems = items.filter(item => {
      const label = item.split(" — ")[0];
      return (FIRMA_LABEL_TO_GROUP[label] ?? "Diğer") === group;
    });
    if (groupItems.length) grouped.push({ group, items: groupItems });
  }
  if (grouped.length <= 1) {
    return <span className="text-sm text-muted-foreground">{hizmet}</span>;
  }
  return (
    <div className="space-y-1.5">
      {grouped.map(({ group, items: gItems }) => (
        <div key={group}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary/70 mb-0.5">{group}</p>
          <ul className="space-y-0.5">
            {gItems.map(item => (
              <li key={item} className="text-xs text-foreground flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-primary/50 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function StarRow({ puan }: { puan: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`w-4 h-4 ${i <= puan ? "fill-yellow-400 text-yellow-400" : "text-border"}`} />
      ))}
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function buildNotifyMailto(order: Order, firmaName: string, firmaContact: string): string {
  const email = order.musteriEmail || getMusteriEmail(order.musteri);
  if (!email) return "";
  const subject = encodeURIComponent(`[CleanLink] Randevunuz Onaylandı — ${firmaName}`);
  const tarih = order.istenenTarih ?? order.tarih;
  const saat = order.visitTime ?? order.istenenSaatDilimi ?? "";
  const contactLine = firmaContact || `${firmaName} · CleanLink platformu üzerinden ulaşabilirsiniz`;
  const body = encodeURIComponent(
    `Sayın ${order.musteri},\n\n` +
    `Randevunuz onaylandı. Detaylar aşağıdadır:\n\n` +
    `Firma: ${firmaName}\n` +
    `Hizmet: ${order.hizmet}\n` +
    `Tarih: ${tarih}\n` +
    (saat ? `Saat: ${saat}\n` : "") +
    `Tutar: ${order.toplam.toLocaleString("tr-TR")} TL\n` +
    `Referans No: ${order.id}\n\n` +
    `Firma İletişim: ${contactLine}\n\n` +
    `İyi günler dileriz,\nCleanLink Ekibi`
  );
  return `mailto:${email}?subject=${subject}&body=${body}`;
}

/* ─────────── sub-tabs ─────────── */

function PanelTab({ user, orders, pendingCount, totalRevenue, setTab, onReopenDekont, onAdminApprove, onAdminExtend, onRenewRequest }: {
  user: { name: string; email?: string } | null; orders: Order[]; pendingCount: number; totalRevenue: number;
  setTab: (t: Tab) => void;
  onReopenDekont?: () => void;
  onAdminApprove?: () => void;
  onAdminExtend?: () => void;
  onRenewRequest?: () => Promise<void>;
}) {
  const { firmaProfile } = useApp();
  const onayBekleyenCount = orders.filter(o => o.durum === "onayBekliyor").length;
  const [renewState, setRenewState] = useState<"idle" | "loading" | "done" | "error">("idle");

  const handleRenewClick = async () => {
    if (renewState === "loading" || renewState === "done") return;
    setRenewState("loading");
    try {
      await onRenewRequest?.();
      setRenewState("done");
    } catch {
      setRenewState("error");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <h1 className="text-2xl font-bold text-foreground mb-6">
        Hoş Geldiniz, <span className="text-primary">{user?.name}</span> 👋
      </h1>

      {/* Havale bekliyor banner */}
      {firmaProfile.subscriptionPending && !firmaProfile.isSubscribed && !firmaProfile.isSponsor && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6"
        >
          <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-amber-800 text-sm">Hesap Doğrulanıyor</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Havale bildiriminiz alındı. Admin onayı bekleniyor (1-2 iş günü).
            </p>
            {firmaProfile.havaleRefCode && (
              <p className="text-xs text-amber-600 mt-1.5 font-mono font-semibold">
                Referans: {firmaProfile.havaleRefCode}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5 flex-shrink-0">
            {user?.email === ADMIN_EMAIL && onAdminApprove && (
              <button
                onClick={onAdminApprove}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl px-3 py-1.5 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Havaleyi Onayla
              </button>
            )}
            <button
              onClick={onReopenDekont}
              className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 border border-amber-200 rounded-xl px-3 py-1.5 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              Yeniden E-posta Gönder
            </button>
          </div>
        </motion.div>
      )}

      {/* Abonelik süresi dolmuş banner */}
      {!firmaProfile.isSubscribed && !firmaProfile.isSponsor && !firmaProfile.subscriptionPending && isSubExpired(firmaProfile) && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 mb-6"
        >
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-red-800 text-sm">Aboneliğiniz Sona Erdi</p>
            <p className="text-xs text-red-700 mt-0.5">
              30 günlük abonelik süreniz doldu. Profiliniz aramalardan gizlendi. Yenileme yapın.
            </p>
          </div>
          {user?.email === ADMIN_EMAIL && onAdminExtend ? (
            <button
              onClick={onAdminExtend}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl px-3 py-1.5 flex-shrink-0 transition-colors"
            >
              <CalendarClock className="w-3.5 h-3.5" />
              +30 Gün Uzat
            </button>
          ) : renewState === "done" ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 flex-shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Talep Gönderildi
            </span>
          ) : renewState === "error" ? (
            <button
              onClick={handleRenewClick}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl px-3 py-1.5 flex-shrink-0 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Tekrar Dene
            </button>
          ) : (
            <button
              onClick={handleRenewClick}
              disabled={renewState === "loading"}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl px-3 py-1.5 flex-shrink-0 transition-colors"
            >
              <Bell className="w-3.5 h-3.5" />
              {renewState === "loading" ? "Gönderiliyor…" : "Yenileme Talebi Gönder"}
            </button>
          )}
        </motion.div>
      )}

      {/* Abonelik kalan gün uyarısı */}
      {(firmaProfile.isSubscribed || firmaProfile.isSponsor) && firmaProfile.yayinaGirisTarihi && !isSubExpired(firmaProfile) && (() => {
        const daysLeft = Math.ceil((firmaProfile.yayinaGirisTarihi! + SUB_DURATION_MS - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysLeft > 15) return null;
        const isCritical = daysLeft <= 5;
        return (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-3 rounded-2xl px-5 py-4 mb-6 ${
              isCritical
                ? "bg-red-50 border border-red-200"
                : "bg-yellow-50 border border-yellow-200"
            }`}
          >
            <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isCritical ? "text-red-500" : "text-yellow-500"}`} />
            <div className="flex-1 min-w-0">
              <p className={`font-bold text-sm ${isCritical ? "text-red-800" : "text-yellow-800"}`}>
                Aboneliğiniz {daysLeft} gün sonra sona eriyor
              </p>
              <p className={`text-xs mt-0.5 ${isCritical ? "text-red-700" : "text-yellow-700"}`}>
                {isCritical
                  ? "Aboneliğiniz çok yakında sona erecek. Kesintisiz hizmet için hemen yenileyin."
                  : "Abonelik süreniz dolmadan önce yenilemeyi unutmayın."}
              </p>
            </div>
            {renewState === "done" ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 flex-shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Talep Gönderildi
              </span>
            ) : renewState === "error" ? (
              <button
                onClick={handleRenewClick}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl px-3 py-1.5 flex-shrink-0 transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Tekrar Dene
              </button>
            ) : (
              <button
                onClick={handleRenewClick}
                disabled={renewState === "loading"}
                className={`flex items-center gap-1.5 text-xs font-bold text-white rounded-xl px-3 py-1.5 flex-shrink-0 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                  isCritical ? "bg-red-600 hover:bg-red-700" : "bg-yellow-500 hover:bg-yellow-600"
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                {renewState === "loading" ? "Gönderiliyor…" : "Yenileme Talebi Gönder"}
              </button>
            )}
          </motion.div>
        );
      })()}

      {/* isSponsor durum banner */}
      {firmaProfile.isSponsor ? (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5 mb-6"
        >
          <Crown className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-amber-800 text-sm">VIP Vitrin Paketi Aktif</p>
            <p className="text-xs text-amber-600">Ana sayfada ★ VIP rozeti ile görünüyorsunuz.</p>
          </div>
          <button onClick={() => setTab("reklam")} className="text-xs font-semibold text-amber-700 hover:underline flex-shrink-0">
            Detaylar →
          </button>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-2xl px-5 py-3.5 mb-6 cursor-pointer hover:bg-primary/10 transition-colors"
          onClick={() => setTab("reklam")}
        >
          <Megaphone className="w-5 h-5 text-primary flex-shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-primary text-sm">Ana Sayfada Öne Çıkın</p>
            <p className="text-xs text-muted-foreground">5.000 TL/Ay — VIP Vitrin Paketi ile daha fazla müşteriye ulaşın.</p>
          </div>
          <span className="text-xs font-semibold text-primary flex-shrink-0">Reklamı Başlat →</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {[
          { label: "Toplam Sipariş", value: orders.length, icon: ShoppingBag, color: "from-primary to-teal-600" },
          { label: "Bekleyen Sipariş", value: pendingCount, icon: Clock, color: "from-amber-400 to-orange-500" },
          { label: "Tamamlanan Ciro", value: `${totalRevenue.toLocaleString("tr-TR")} TL`, icon: TrendingUp, color: "from-violet-500 to-purple-600" },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-2xl border border-border p-6 shadow-sm flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Onay bekleyen sipariş uyarısı */}
      {onayBekleyenCount > 0 && (
        <motion.button
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          onClick={() => setTab("siparisler")}
          className="w-full flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 mb-4 hover:bg-blue-100 transition-colors text-left"
        >
          <BadgeCheck className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-blue-800 text-sm">{onayBekleyenCount} sipariş müşteri onayı bekliyor</p>
            <p className="text-xs text-blue-600">Ziyaret saati önerildi — müşteri yanıt vermedi.</p>
          </div>
          <ChevronRight className="w-4 h-4 text-blue-500" />
        </motion.button>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {([
          { tab: "siparisler" as Tab, icon: ShoppingBag, title: "Siparişleri Görüntüle", sub: `${pendingCount} beklemede · ${onayBekleyenCount} onay bekliyor` },
          { tab: "yorumlar" as Tab, icon: MessageSquare, title: "Müşteri Yorumları", sub: "5 yorum, 4.8 ort." },
          { tab: "fiyatlar" as Tab, icon: Settings, title: "Fiyat & Kapsam", sub: "Halı, koltuk, ev temizliği" },
          { tab: "profil" as Tab, icon: UserIcon, title: "Profil & Belgeler", sub: "Bio, bölgeler, galeri" },
          { tab: "reklam" as Tab, icon: Megaphone, title: "Reklam & Görünürlük", sub: firmaProfile.isSponsor ? "★ VIP Aktif" : "5.000 TL/Ay — Vitrin Paketi" },
        ]).map(({ tab, icon: Icon, title, sub }) => (
          <button key={tab} data-tab={tab} onClick={() => setTab(tab)}
            className={`flex items-center justify-between bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group ${
              tab === "reklam" && firmaProfile.isSponsor
                ? "border-amber-200 hover:border-amber-300"
                : "border-border hover:border-primary/30"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                tab === "reklam" && firmaProfile.isSponsor ? "bg-amber-100" : "bg-primary/10"
              }`}>
                <Icon className={`w-5 h-5 ${tab === "reklam" && firmaProfile.isSponsor ? "text-amber-600" : "text-primary"}`} />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">{title}</p>
                <p className={`text-sm ${tab === "reklam" && firmaProfile.isSponsor ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>{sub}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function OrdersTab({ orders }: { orders: Order[] }) {
  const { user, setOrderVisitTime, approveOrderTime, firmaProfile, unlockOrder, orderQuotaUsed, orderQuotaTotal, orderIsPaid } = useApp();
  const [timeInputs, setTimeInputs] = useState<Record<string, string>>({});
  const [showCounterOffer, setShowCounterOffer] = useState<Record<string, boolean>>({});
  const [unlocking, setUnlocking] = useState<string | null>(null);

  const handleProposeTime = (orderId: string) => {
    const t = timeInputs[orderId]?.trim();
    if (!t) return;
    setOrderVisitTime(orderId, t);
    setTimeInputs(prev => ({ ...prev, [orderId]: "" }));
    setShowCounterOffer(prev => ({ ...prev, [orderId]: false }));
  };

  const toggleCounterOffer = (orderId: string) =>
    setShowCounterOffer(prev => ({ ...prev, [orderId]: !prev[orderId] }));

  const handleUnlock = async (orderId: string) => {
    setUnlocking(orderId);
    try { await unlockOrder(orderId); }
    catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Kilit açılamadı";
      alert(msg);
    }
    finally { setUnlocking(null); }
  };

  /** CRM erişimi: yalnızca abone firmalar için */
  const hasCrmAccess = firmaProfile.isSubscribed || firmaProfile.isSponsor;

  /** RBAC: ücretsiz firma için iletişim bilgisi kilitli mi? */
  const isContactRbacLocked = (order: Order) =>
    !orderIsPaid && !order.isContactUnlocked;

  /** Address privacy: full address only visible when kesinlesti or tamamlandi */
  const isAddressLocked = (order: Order) =>
    order.durum !== "kesinlesti" && order.durum !== "tamamlandi";

  /** Ara butonu: yalnızca kesinlesti durumunda aktif */
  const canCall = (order: Order) => order.durum === "kesinlesti" || order.durum === "tamamlandi";

  /** Firma saati önerebileceği durumlar */
  const canPropose = (order: Order) =>
    order.durum === "beklemede" || order.durum === "zamanAsimi";

  const zamanAsimiCount = orders.filter(o => o.durum === "zamanAsimi").length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <h2 className="text-2xl font-bold text-foreground mb-4">Siparişler</h2>

      {/* Zaman aşımı uyarısı */}
      {zamanAsimiCount > 0 && (
        <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-2xl px-5 py-4 mb-5">
          <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-orange-800 text-sm">
              {zamanAsimiCount} sipariş zaman aşımına uğradı
            </p>
            <p className="text-xs text-orange-600 mt-0.5">
              Müşteri 2 saat içinde onaylamamış. Yeni bir ziyaret saati önerin.
            </p>
          </div>
        </div>
      )}

      {/* Ücretsiz üye kota banner */}
      {!orderIsPaid && (
        <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 mb-5">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-800">Bu ayki müşteri iletişim bilgisi görme hakkınız: {orderQuotaTotal - orderQuotaUsed}/{orderQuotaTotal}</p>
              <p className="text-xs text-amber-700 mt-0.5">
                {orderQuotaUsed >= orderQuotaTotal
                  ? "Kotanız doldu. Tüm müşterilere ulaşmak için CRM paketine geçin."
                  : "Ücretsiz planda ayda 1 siparişin telefon ve adres bilgisini görebilirsiniz."}
              </p>
            </div>
          </div>
          <button
            onClick={() => { const el = document.querySelector('[data-tab="reklam"]') as HTMLElement; el?.click(); }}
            className="shrink-0 text-xs font-bold text-amber-800 border border-amber-400 bg-amber-100 hover:bg-amber-200 rounded-lg px-3 py-1.5 transition-colors"
          >
            CRM'e Geç →
          </button>
        </div>
      )}

      {/* Adres gizlilik notu */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-xl px-4 py-2.5 mb-5 border border-border">
        <Lock className="w-3.5 h-3.5 text-primary flex-shrink-0" />
        <span>
          <strong className="text-foreground">Adres Güvenliği:</strong> Müşterinin tam adresi (No / Daire) ve iletişim butonu yalnızca randevu kesinleştikten sonra görünür.
        </span>
      </div>

      {orders.length === 0 && (
        <div className="bg-white rounded-2xl border border-border p-10 text-center text-muted-foreground shadow-sm">
          Henüz sipariş yok.
        </div>
      )}
      {orders.length > 0 && (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">No</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Müşteri</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Hizmet</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Adres</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tutar</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[190px]">Durum / Randevu</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Tarih</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ara</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map(order => {
                  const s = STATUS_MAP[order.durum] ?? STATUS_MAP.beklemede;
                  const StatusIcon = s.icon;
                  const locked = isAddressLocked(order);
                  const callable = canCall(order);
                  const firmaName = user?.name ?? "";
                  const firmaContact = user?.email ? `E-posta: ${user.email}` : firmaName;
                  const canNotify = order.durum === "onaylandi" || order.durum === "kesinlesti";
                  const notifyMailto = canNotify ? buildNotifyMailto(order, firmaName, firmaContact) : "";
                  return (
                    <tr key={order.id} className={`hover:bg-secondary/30 transition-colors ${order.durum === "zamanAsimi" ? "bg-orange-50/50" : ""}`}>
                      <td className="px-5 py-4 text-xs font-mono font-medium text-muted-foreground">{order.id}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-foreground">{order.musteri}</td>
                      <td className="px-5 py-4 hidden md:table-cell"><HizmetGrouped hizmet={order.hizmet} /></td>

                      {/* Adres gizlilik kolonu */}
                      <td className="px-5 py-4 hidden lg:table-cell">
                        {isContactRbacLocked(order) ? (
                          /* RBAC kilitli — ücretsiz üye, henüz açılmadı */
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Lock className="w-3 h-3 text-amber-500 flex-shrink-0" />
                              <span className="select-none blur-sm font-medium">••• Mahalle, İlçe</span>
                            </div>
                            <p className="text-[10px] text-amber-700 font-semibold">Yalnızca Elite/CRM Üyeler Görebilir</p>
                            {orderQuotaUsed < orderQuotaTotal ? (
                              <button
                                onClick={() => handleUnlock(order.id)}
                                disabled={unlocking === order.id}
                                className="text-[11px] font-bold text-primary hover:text-primary/80 underline underline-offset-2 transition-colors disabled:opacity-50"
                              >
                                {unlocking === order.id ? "Açılıyor…" : "Kilidi Aç (hakkınız var)"}
                              </button>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">Aylık kotanız doldu</span>
                            )}
                          </div>
                        ) : locked ? (
                          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <Lock className="w-3 h-3 text-border mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-medium">{order.ilce ?? "—"}</span>
                              {order.mahalle && <span className="text-muted-foreground"> / {order.mahalle}</span>}
                              <p className="text-[10px] text-border mt-0.5">Açık adres kilitli</p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs">
                            <p className="font-semibold text-foreground">{order.adres}</p>
                            <p className="text-muted-foreground">{order.ilce}{order.mahalle ? ` / ${order.mahalle}` : ""}</p>
                            <p className="text-[10px] text-green-600 font-medium mt-0.5 flex items-center gap-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Adres kilidi açıldı
                            </p>
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm font-bold text-foreground">{order.toplam.toLocaleString("tr-TR")} TL</td>

                      <td className="px-5 py-4 min-w-[220px]">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.color}`}>
                          <StatusIcon className="w-3 h-3" />{s.label}
                        </span>

                        {/* Müşterinin istenen tarih/saat dilimi */}
                        {order.istenenTarih && order.istenenSaatDilimi && (
                          <div className="mt-1.5 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">{order.istenenTarih}</span>
                            {" · "}{order.istenenSaatDilimi}
                          </div>
                        )}

                        {/* CRM Aksiyonlar — yalnızca abone firmalar */}
                        {!hasCrmAccess && canPropose(order) && (
                          <p className="text-[10px] text-orange-600 mt-1.5 font-medium">
                            CRM için 999 TL paket gerekli.
                          </p>
                        )}

                        {hasCrmAccess && (
                          <>
                            {/* ── beklemede ── */}
                            {order.durum === "beklemede" && (
                              <div className="mt-2 space-y-1.5">
                                {/* Müşteri yeni saat istedi bildirimi */}
                                {order.musteriYeniSaatIstedi && (
                                  <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-lg px-2 py-1.5">
                                    <Bell className="w-3 h-3 text-orange-500 flex-shrink-0" />
                                    <p className="text-[11px] text-orange-700 font-semibold">
                                      Müşteri yeni saat istiyor!
                                    </p>
                                    <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                                  </div>
                                )}
                                {/* Müşteri saatini onayla — yalnızca musteriYeniSaatIstedi değilse */}
                                {!order.musteriYeniSaatIstedi && (
                                  <button
                                    onClick={() => approveOrderTime(order.id)}
                                    className="flex items-center gap-1 text-xs bg-green-600 text-white px-2.5 py-1.5 rounded-lg font-semibold hover:bg-green-700 transition-colors w-full justify-center"
                                  >
                                    <CheckCircle2 className="w-3 h-3" /> Müşteri Saatini Onayla
                                  </button>
                                )}
                                <button
                                  onClick={() => toggleCounterOffer(order.id)}
                                  className="text-[11px] text-primary underline-offset-2 hover:underline w-full text-center"
                                >
                                  {showCounterOffer[order.id] ? "İptal"
                                    : order.musteriYeniSaatIstedi ? "Yeni Saat Aralığı Öner"
                                    : "Farklı Saat Öner"}
                                </button>
                                {showCounterOffer[order.id] && (
                                  <div className="space-y-1">
                                    <p className="text-[10px] text-muted-foreground">Örn: 10:00 - 12:00</p>
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="text"
                                        value={timeInputs[order.id] ?? ""}
                                        onChange={e => setTimeInputs(prev => ({ ...prev, [order.id]: e.target.value }))}
                                        placeholder="10:00 - 12:00"
                                        className="border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-primary flex-1"
                                      />
                                      <button
                                        onClick={() => handleProposeTime(order.id)}
                                        className="text-xs bg-primary text-white px-2.5 py-1.5 rounded-lg font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap"
                                      >
                                        Öner
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* ── zamanAsimi — yeni saat öner ── */}
                            {order.durum === "zamanAsimi" && (
                              <div className="mt-2 space-y-1">
                                <p className="text-xs text-orange-600 font-medium">
                                  Önceki: {order.visitTime} — Yeni aralık önerin:
                                </p>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      value={timeInputs[order.id] ?? ""}
                                      onChange={e => setTimeInputs(prev => ({ ...prev, [order.id]: e.target.value }))}
                                      placeholder="10:00 - 12:00"
                                      className="border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-primary flex-1"
                                    />
                                    <button
                                      onClick={() => handleProposeTime(order.id)}
                                      className="text-xs bg-primary text-white px-2.5 py-1.5 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                                    >
                                      Güncelle
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* ── onayBekliyor — bekleme mesajı ── */}
                            {order.durum === "onayBekliyor" && order.visitTime && (
                              <p className="text-xs text-blue-600 mt-1.5 font-medium">
                                Önerilen: {order.visitTime} — müşteri onayı bekleniyor
                              </p>
                            )}

                            {/* kesinlesti — onaylı saat */}
                            {order.durum === "kesinlesti" && order.visitTime && (
                              <p className="text-xs text-green-600 mt-1.5 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> {order.visitTime} Kesinleşti
                              </p>
                            )}

                            {/* Müşteriyi E-posta ile Bildir — onaylandi / kesinlesti */}
                            {canNotify && notifyMailto && (
                              <a
                                href={notifyMailto}
                                onClick={e => e.stopPropagation()}
                                className="inline-flex items-center gap-1 mt-2 text-[11px] bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 px-2 py-1 rounded-lg font-semibold transition-colors"
                              >
                                <Mail className="w-3 h-3 flex-shrink-0" /> Müşteriyi E-posta ile Bildir
                              </a>
                            )}
                            {canNotify && !notifyMailto && (
                              <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                                <Mail className="w-3 h-3" /> E-posta adresi kayıtlı değil
                              </p>
                            )}
                          </>
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-muted-foreground hidden sm:table-cell">{order.tarih}</td>

                      {/* Ara butonu — sadece kesinlesti/tamamlandi ve RBAC kilidi yoksa */}
                      <td className="px-5 py-4">
                        {isContactRbacLocked(order) ? (
                          /* RBAC kilitli — dönüşüm tetikleyici */
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                              <Lock className="w-2.5 h-2.5" /> Kilitli
                            </span>
                            <button
                              onClick={() => { const el = document.querySelector('[data-tab="reklam"]') as HTMLElement; el?.click(); }}
                              className="block text-[10px] font-bold text-primary hover:underline"
                            >
                              CRM'e Geç
                            </button>
                          </div>
                        ) : callable ? (
                          <a
                            href={order.telefon ? `tel:${order.telefon.replace(/\s/g, "")}` : "#"}
                            className="inline-flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
                          >
                            <Phone className="w-3 h-3" /> Ara
                          </a>
                        ) : (
                          <span
                            title="Randevu kesinleşince aktif olur"
                            className="inline-flex items-center gap-1.5 bg-secondary text-muted-foreground text-xs font-bold px-3 py-1.5 rounded-lg cursor-not-allowed"
                          >
                            <Lock className="w-3 h-3" /> Ara
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function ReviewsTab() {
  const avg = (MOCK_REVIEWS.reduce((s, r) => s + r.puan, 0) / MOCK_REVIEWS.length).toFixed(1);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Müşteri Yorumları</h2>
          <p className="text-muted-foreground mt-1">Simüle edilmiş müşteri geri bildirimleri</p>
        </div>
        {/* Summary card */}
        <div className="bg-white border border-border rounded-2xl px-6 py-4 flex items-center gap-4 shadow-sm">
          <div className="text-center">
            <p className="text-4xl font-bold text-foreground">{avg}</p>
            <StarRow puan={5} />
            <p className="text-xs text-muted-foreground mt-1">{MOCK_REVIEWS.length} yorum</p>
          </div>
          <div className="h-14 w-px bg-border" />
          <div className="space-y-1">
            {[5, 4, 3].map(s => {
              const count = MOCK_REVIEWS.filter(r => r.puan === s).length;
              return (
                <div key={s} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-3">{s}</span>
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <div className="w-20 h-1.5 rounded-full bg-border overflow-hidden">
                    <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${(count / MOCK_REVIEWS.length) * 100}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {MOCK_REVIEWS.map((rev, i) => (
          <motion.div
            key={rev.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-white rounded-2xl border border-border p-5 shadow-sm hover:border-primary/20 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${rev.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md`}>
                {rev.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <p className="font-semibold text-foreground">{rev.musteri}</p>
                  <StarRow puan={rev.puan} />
                  <span className="text-xs text-muted-foreground">{rev.tarih}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-2">{rev.yorum}</p>
                <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">{rev.hizmet}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

const GROUP_COLORS: Record<string, string> = {
  "Ev Temizliği":       "bg-teal-50 border-teal-200 text-teal-700",
  "Koltuk Yıkama":      "bg-sky-50 border-sky-200 text-sky-700",
  "Araç Koltuk Yıkama": "bg-amber-50 border-amber-200 text-amber-700",
  "Halı Yıkama":        "bg-violet-50 border-violet-200 text-violet-700",
  "Yatak & Yorgan":     "bg-emerald-50 border-emerald-200 text-emerald-700",
};

const FREE_GROUP_LIMIT = 2;

function PricesTab() {
  const { firmaPrices, setFirmaPrices, serviceScopes, setServiceScopes, firmaProfile } = useApp();
  const [draftPrices, setDraftPrices] = useState<FirmaPrices>({ ...firmaPrices });
  const [draftScopes, setDraftScopes] = useState<ServiceScopes>({ ...serviceScopes });
  const [saved, setSaved] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(SERVICE_GROUPS.map((g, i) => [g, i === 0]))
  );

  const isFree = !firmaProfile.isSubscribed && !firmaProfile.isSponsor;

  const handleSave = () => {
    setFirmaPrices(draftPrices);
    setServiceScopes(draftScopes);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const toggleGroup = (g: string) =>
    setOpenGroups(prev => ({ ...prev, [g]: !prev[g] }));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <h2 className="text-2xl font-bold text-foreground mb-2">Fiyat & Hizmet Kapsamı</h2>
      <p className="text-muted-foreground mb-6">Fiyatlar ve hizmet kapsamı müşterilere firma kartınızda gösterilir.</p>

      {isFree && (
        <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 mb-6">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-800">Ücretsiz planda en fazla {FREE_GROUP_LIMIT} hizmet grubu aktif edilebilir.</p>
              <p className="text-xs text-amber-700 mt-0.5">Tüm gruplara erişmek için CRM paketine geçin.</p>
            </div>
          </div>
          <button
            onClick={() => { const el = document.querySelector('[data-tab="reklam"]') as HTMLElement; el?.click(); }}
            className="shrink-0 text-xs font-bold text-amber-800 border border-amber-400 bg-amber-100 hover:bg-amber-200 rounded-lg px-3 py-1.5 transition-colors"
          >
            CRM'e Geç →
          </button>
        </div>
      )}

      <div className="space-y-4 max-w-2xl">
        {SERVICE_GROUPS.map((group, groupIdx) => {
          const keys = SERVICE_KEYS.filter(k => SERVICE_META[k].group === group);
          const isOpen = !!openGroups[group];
          const colorClass = GROUP_COLORS[group] ?? "bg-gray-50 border-gray-200 text-gray-700";
          const isGroupLocked = isFree && groupIdx >= FREE_GROUP_LIMIT;

          return (
            <div key={group} className="rounded-2xl border border-border shadow-sm overflow-hidden relative">
              {/* Group header — click to expand/collapse */}
              <button
                type="button"
                onClick={() => !isGroupLocked && toggleGroup(group)}
                className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors ${isGroupLocked ? "cursor-not-allowed opacity-60" : "hover:bg-gray-50"}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${colorClass}`}>
                    {group}
                  </span>
                  <span className="text-sm text-muted-foreground">{keys.length} hizmet</span>
                  {isGroupLocked && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      <Lock className="w-2.5 h-2.5" /> CRM'e Geç
                    </span>
                  )}
                </div>
                {isGroupLocked
                  ? <Lock className="w-4 h-4 text-amber-400" />
                  : <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                }
              </button>

              {/* Services in group */}
              <AnimatePresence initial={false}>
                {isOpen && !isGroupLocked && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="divide-y divide-border border-t border-border">
                      {keys.map((key: ServiceKey) => {
                        const meta = SERVICE_META[key];
                        return (
                          <div key={key} className="px-5 py-4 bg-white">
                            <label className="block text-sm font-semibold text-foreground mb-0.5">{meta.label}</label>
                            <p className="text-xs text-muted-foreground mb-3">{meta.desc}</p>

                            <div className="flex items-center border-2 border-border rounded-xl overflow-hidden focus-within:border-primary transition-colors mb-3">
                              <input
                                type="number" min="0"
                                value={draftPrices[key]}
                                onChange={e => setDraftPrices(p => ({ ...p, [key]: Number(e.target.value) }))}
                                className="flex-1 px-4 py-2.5 outline-none text-foreground font-bold text-base bg-transparent"
                              />
                              <span className="px-4 py-2.5 bg-secondary text-muted-foreground text-sm font-medium border-l border-border whitespace-nowrap">
                                {meta.unit}
                              </span>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                                Hizmet Kapsamı
                              </label>
                              <textarea
                                rows={2}
                                value={draftScopes[key]}
                                onChange={e => setDraftScopes(s => ({ ...s, [key]: e.target.value }))}
                                placeholder={meta.placeholder}
                                className="w-full border-2 border-border rounded-xl px-4 py-2.5 outline-none focus:border-primary transition-colors text-sm text-foreground leading-relaxed resize-none placeholder:text-muted-foreground/50"
                              />
                            </div>
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

        <Button onClick={handleSave} className="w-full h-12 rounded-xl font-bold gap-2 shadow-lg shadow-primary/20">
          {saved ? <><Check className="w-5 h-5" /> Kaydedildi!</> : "Fiyat & Kapsamı Güncelle"}
        </Button>
      </div>
    </motion.div>
  );
}

function ProfilTab() {
  const { firmaProfile, updateFirmaProfile, isVendorPublished, publishVendorProfile } = useApp();
  const [draftBio, setDraftBio] = useState(firmaProfile.bio);
  const [bioSaved, setBioSaved] = useState(false);

  const isPaid = firmaProfile.isSubscribed || firmaProfile.isSponsor;
  const [draftPhone, setDraftPhone] = useState(firmaProfile.phone || "");
  const [draftWhatsapp, setDraftWhatsapp] = useState(firmaProfile.whatsappPhone || "");
  const [contactSaved, setContactSaved] = useState(false);
  const [contactError, setContactError] = useState("");

  const [draftCity, setDraftCity] = useState(firmaProfile.city || "İstanbul");
  const [draftDistrict, setDraftDistrict] = useState(firmaProfile.district || "");
  const [addressSaved, setAddressSaved] = useState(false);
  const [addressError, setAddressError] = useState("");

  useEffect(() => {
    setDraftCity(firmaProfile.city || "İstanbul");
    setDraftDistrict(firmaProfile.district || "");
  }, [firmaProfile.city, firmaProfile.district]);

  const saveAddress = async () => {
    setAddressError("");
    try {
      await apiUpdateVendorProfile({ city: draftCity, district: draftDistrict });
      updateFirmaProfile({ city: draftCity, district: draftDistrict });
      setAddressSaved(true);
      setTimeout(() => setAddressSaved(false), 2000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Kaydedilemedi";
      setAddressError(msg);
    }
  };

  useEffect(() => {
    setDraftPhone(firmaProfile.phone || "");
    setDraftWhatsapp(firmaProfile.whatsappPhone || "");
  }, [firmaProfile.phone, firmaProfile.whatsappPhone]);

  const saveContact = async () => {
    setContactError("");
    try {
      await apiUpdateVendorProfile({ phone: draftPhone, whatsappPhone: draftWhatsapp });
      updateFirmaProfile({ phone: draftPhone, whatsappPhone: draftWhatsapp });
      setContactSaved(true);
      setTimeout(() => setContactSaved(false), 2000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Kaydedilemedi";
      setContactError(msg);
    }
  };

  const saveBio = () => {
    updateFirmaProfile({ bio: draftBio });
    setBioSaved(true);
    setTimeout(() => setBioSaved(false), 2000);
  };

  const toggleRegion = (region: string) => {
    const current = firmaProfile.regions;
    if (current.includes(region)) {
      updateFirmaProfile({ regions: current.filter(r => r !== region) });
    } else if (current.length < 5) {
      updateFirmaProfile({ regions: [...current, region] });
    }
  };

  const [gallery, setGallery] = useState<string[]>([]);
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [docSaved, setDocSaved] = useState(false);
  const [gallerySaving, setGallerySaving] = useState(false);
  const [docsSaving, setDocsSaving] = useState(false);
  const galleryRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);

  /* Load gallery + certs from DB on mount */
  useEffect(() => {
    apiGetMyVendorProfile().then(profile => {
      if (profile.galleryUrls?.length) setGallery(profile.galleryUrls);
      if (profile.certUrls?.length) {
        const parsed: DocItem[] = profile.certUrls.flatMap(s => {
          try { return [JSON.parse(s) as DocItem]; } catch { return []; }
        });
        setDocs(parsed);
      }
    }).catch(() => {});
  }, []);

  /* Compress image file to JPEG base64 (max 1000px, 70% quality) */
  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const blobUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(blobUrl);
        const MAX = 1000;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
          else { width = Math.round(width * MAX / height); height = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = reject;
      img.src = blobUrl;
    });

  const handleGalleryAdd = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    const remaining = MAX_GALLERY - gallery.length;
    const toAdd = files.slice(0, remaining);
    if (!toAdd.length) return;
    setGallerySaving(true);
    try {
      const compressed = await Promise.all(toAdd.map(compressImage));
      const newGallery = [...gallery, ...compressed];
      setGallery(newGallery);
      await apiUpdateVendorProfile({ galleryUrls: newGallery });
    } catch { /* silently ignore */ }
    finally { setGallerySaving(false); }
  }, [gallery]);

  const removeGallery = async (idx: number) => {
    const newGallery = gallery.filter((_, i) => i !== idx);
    setGallery(newGallery);
    setGallerySaving(true);
    try { await apiUpdateVendorProfile({ galleryUrls: newGallery }); }
    catch { /* silently ignore */ }
    finally { setGallerySaving(false); }
  };

  /* Read file as base64 data URL */
  const readAsBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleDocAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setDocsSaving(true);
    try {
      const newItems: DocItem[] = await Promise.all(files.map(async f => {
        const isPdf = f.type === "application/pdf";
        const url = await readAsBase64(f);
        return { name: f.name, fileType: isPdf ? "pdf" as const : "image" as const, url, size: formatBytes(f.size) };
      }));
      const newDocs = [...docs, ...newItems];
      setDocs(newDocs);
      await apiUpdateVendorProfile({ certUrls: newDocs.map(d => JSON.stringify(d)) });
    } catch { /* silently ignore */ }
    finally { setDocsSaving(false); }
  };

  const removeDoc = async (idx: number) => {
    const newDocs = docs.filter((_, i) => i !== idx);
    setDocs(newDocs);
    setDocsSaving(true);
    try { await apiUpdateVendorProfile({ certUrls: newDocs.map(d => JSON.stringify(d)) }); }
    catch { /* silently ignore */ }
    finally { setDocsSaving(false); }
  };

  const subStartMs  = firmaProfile.yayinaGirisTarihi ?? null;
  const subEndMs    = subStartMs ? subStartMs + SUB_DURATION_MS : null;
  const fmtDate     = (ms: number) => new Date(ms).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-1">Profil Detayları</h2>
        <p className="text-muted-foreground">Galeri ve belgeler müşterilere firma profilinizde gösterilir.</p>
      </div>

      {/* ── Abonelik Özeti ── */}
      {isPaid && subStartMs && (
        <div className={`rounded-2xl border p-5 shadow-sm ${firmaProfile.isSponsor ? "bg-amber-50 border-amber-200" : "bg-violet-50 border-violet-200"}`}>
          <div className="flex items-center gap-2 mb-3">
            {firmaProfile.isSponsor
              ? <Crown className="w-4 h-4 text-amber-600" />
              : <CheckCircle2 className="w-4 h-4 text-violet-600" />}
            <h3 className={`font-bold text-sm ${firmaProfile.isSponsor ? "text-amber-800" : "text-violet-800"}`}>
              {firmaProfile.isSponsor ? "Elite Üyelik" : "Standart Üyelik (CRM)"}
            </h3>
            <span className={`ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full ${firmaProfile.isSponsor ? "bg-amber-200 text-amber-800" : "bg-violet-200 text-violet-800"}`}>
              Aktif
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-xl p-3 ${firmaProfile.isSponsor ? "bg-amber-100/60" : "bg-violet-100/60"}`}>
              <p className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${firmaProfile.isSponsor ? "text-amber-700" : "text-violet-700"}`}>Kayıt Tarihi</p>
              <p className={`text-sm font-bold ${firmaProfile.isSponsor ? "text-amber-900" : "text-violet-900"}`}>{fmtDate(subStartMs)}</p>
            </div>
            <div className={`rounded-xl p-3 ${firmaProfile.isSponsor ? "bg-amber-100/60" : "bg-violet-100/60"}`}>
              <p className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${firmaProfile.isSponsor ? "text-amber-700" : "text-violet-700"}`}>Bitiş Tarihi</p>
              <p className={`text-sm font-bold ${firmaProfile.isSponsor ? "text-amber-900" : "text-violet-900"}`}>{subEndMs ? fmtDate(subEndMs) : "—"}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Yayın Durumu ── */}
      {(() => {
        const isPending = !!(firmaProfile.subscriptionPending && !firmaProfile.isSubscribed && !firmaProfile.isSponsor);
        const bgClass = isVendorPublished ? "bg-green-50 border-green-200" : isPending ? "bg-blue-50 border-blue-200" : "bg-white border-border";
        return (
          <div className={`rounded-2xl border p-5 shadow-sm flex items-center justify-between gap-4 ${bgClass}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isVendorPublished ? "bg-green-100" : isPending ? "bg-blue-100" : "bg-muted"}`}>
                <Globe className={`w-5 h-5 ${isVendorPublished ? "text-green-600" : isPending ? "text-blue-600" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">
                  {isVendorPublished ? "Profiliniz Yayında" : isPending ? "Admin Onayı Bekleniyor" : "Profiliniz Yayında Değil"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isVendorPublished
                    ? "Müşteriler 'Tüm Firmalar' listesinde sizi görebilir."
                    : isPending
                    ? "Talebiniz alındı. Admin onayının ardından profiliniz yayına girecek."
                    : "Yayın talebi göndererek 'Tüm Firmalar' listesinde görünün."}
                </p>
              </div>
            </div>
            {isVendorPublished ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-100 border border-green-200 rounded-xl px-3 py-1.5 flex-shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" /> Yayında
              </span>
            ) : isPending ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-100 border border-blue-200 rounded-xl px-3 py-1.5 flex-shrink-0">
                <Clock className="w-3.5 h-3.5" /> Onay Bekleniyor
              </span>
            ) : (
              <Button
                onClick={publishVendorProfile}
                className="h-9 rounded-xl text-sm gap-2 flex-shrink-0"
              >
                <Globe className="w-4 h-4" /> Yayın Talebi Gönder
              </Button>
            )}
          </div>
        );
      })()}

      {/* ── Bio ── */}
      <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
        <h3 className="font-semibold text-foreground mb-1">Firma Açıklaması</h3>
        <p className="text-xs text-muted-foreground mb-3">Müşterilerin firma kartında göreceği kısa tanıtım metni.</p>
        <textarea
          rows={3}
          value={draftBio}
          onChange={e => setDraftBio(e.target.value)}
          placeholder="Ekibinizi, uzmanlık alanlarınızı ve farklılığınızı anlatın..."
          className="w-full border-2 border-border rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors text-sm text-foreground leading-relaxed resize-none placeholder:text-muted-foreground/50 mb-3"
        />
        <Button onClick={saveBio} variant={bioSaved ? "outline" : "default"} className="h-9 rounded-xl text-sm gap-2">
          {bioSaved ? <><Check className="w-4 h-4" /> Kaydedildi!</> : "Açıklamayı Kaydet"}
        </Button>
      </div>

      {/* ── İletişim Bilgileri (Phone + WhatsApp) ── */}
      <div className={`relative bg-white rounded-2xl border p-6 shadow-sm ${isPaid ? "border-border" : "border-amber-200"}`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">İletişim Bilgileri</h3>
          </div>
          {!isPaid && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-200">
              <Lock className="w-3 h-3" /> Standart / Elite
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          {isPaid
            ? "Müşteriler firma profilinizden sizi telefon ve WhatsApp üzerinden arayabilir."
            : "Telefon ve WhatsApp düzenlemesi yalnızca Standart/Elite üyeliklere açıktır. Üyeliğinizi yükselterek müşterilerin sizi doğrudan aramasını sağlayın."}
        </p>
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Telefon</label>
            <input
              type="tel"
              inputMode="tel"
              value={draftPhone}
              onChange={e => setDraftPhone(e.target.value)}
              disabled={!isPaid}
              placeholder="0532 123 45 67"
              className="w-full border-2 border-border rounded-xl px-3 py-2.5 outline-none focus:border-primary transition text-sm disabled:bg-muted/40 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">WhatsApp (opsiyonel)</label>
            <input
              type="tel"
              inputMode="tel"
              value={draftWhatsapp}
              onChange={e => setDraftWhatsapp(e.target.value)}
              disabled={!isPaid}
              placeholder="Boş bırakılırsa telefon numarası kullanılır"
              className="w-full border-2 border-border rounded-xl px-3 py-2.5 outline-none focus:border-primary transition text-sm disabled:bg-muted/40 disabled:cursor-not-allowed"
            />
          </div>
        </div>
        {contactError && (
          <p className="text-xs text-red-600 mb-2">{contactError}</p>
        )}
        <Button
          onClick={saveContact}
          disabled={!isPaid}
          variant={contactSaved ? "outline" : "default"}
          className="h-9 rounded-xl text-sm gap-2"
        >
          {contactSaved ? <><Check className="w-4 h-4" /> Kaydedildi!</> : "İletişimi Kaydet"}
        </Button>
      </div>

      {/* ── Service Regions ── */}
      <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">Hizmet Bölgeleri</h3>
          </div>
          <span className="text-xs text-muted-foreground">{firmaProfile.regions.length}/5 seçili</span>
        </div>
        <p className="text-xs text-muted-foreground mb-4">En fazla 5 bölge seçin. Bu bilgi firma kartınızda görünür.</p>
        <div className="flex flex-wrap gap-2">
          {TR_REGIONS.map(r => {
            const selected = firmaProfile.regions.includes(r);
            const maxed = !selected && firmaProfile.regions.length >= 5;
            return (
              <button
                key={r}
                disabled={maxed}
                onClick={() => toggleRegion(r)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  selected
                    ? "bg-primary text-white border-primary shadow-sm"
                    : maxed
                    ? "border-border text-muted-foreground/40 cursor-not-allowed"
                    : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                }`}
              >
                {r}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Firma Adresi ── */}
      <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Firma Adresi</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Şehir ve ilçe bilgisi firma kartınızda "İstanbul / Şişli" formatında gösterilir.</p>
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Şehir</label>
            <input
              type="text"
              value={draftCity}
              onChange={e => setDraftCity(e.target.value)}
              placeholder="İstanbul"
              className="w-full border-2 border-border rounded-xl px-3 py-2.5 outline-none focus:border-primary transition text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">İlçe</label>
            <select
              value={draftDistrict}
              onChange={e => setDraftDistrict(e.target.value)}
              className="w-full border-2 border-border rounded-xl px-3 py-2.5 outline-none focus:border-primary transition text-sm bg-white"
            >
              <option value="">İlçe Seçin</option>
              {TR_REGIONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
        {draftCity && draftDistrict && (
          <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Kartta gösterilecek: <span className="font-medium text-foreground">{draftCity} / {draftDistrict}</span>
          </p>
        )}
        {addressError && <p className="text-xs text-red-600 mb-2">{addressError}</p>}
        <Button onClick={saveAddress} variant={addressSaved ? "outline" : "default"} className="h-9 rounded-xl text-sm gap-2">
          {addressSaved ? <><Check className="w-4 h-4" /> Kaydedildi!</> : "Adresi Kaydet"}
        </Button>
      </div>

      {/* ── Media Gallery ── */}
      <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <ImageIcon className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Medya Galerisi</h3>
          <span className="ml-auto text-xs text-muted-foreground">{gallery.length}/{MAX_GALLERY} fotoğraf</span>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Dükkan, ekip ve işlem fotoğrafları yükleyin. (Maks. {MAX_GALLERY} adet)</p>

        <div className="grid grid-cols-3 gap-3">
          {gallery.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-border group">
              <img src={url} alt={`Galeri ${i + 1}`} className="w-full h-full object-cover" loading="lazy" decoding="async" />
              <button
                onClick={() => removeGallery(i)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {gallery.length < MAX_GALLERY && (
            <button
              onClick={() => galleryRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-primary transition-all group"
            >
              <div className="w-8 h-8 rounded-full bg-secondary group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium">Ekle</span>
            </button>
          )}
        </div>

        <input ref={galleryRef} type="file" accept="image/*" multiple onChange={handleGalleryAdd} className="hidden" />

        {gallery.length === 0 && (
          <button
            onClick={() => galleryRef.current?.click()}
            className="mt-3 w-full border-2 border-dashed border-border rounded-xl py-8 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
          >
            <Upload className="w-7 h-7" />
            <span className="text-sm font-medium">Fotoğraf yüklemek için tıklayın</span>
            <span className="text-xs">JPG, PNG, WEBP — Maks. 6 adet</span>
          </button>
        )}
        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full inline-block ${gallerySaving ? "bg-blue-400 animate-pulse" : "bg-green-400"}`} />
          {gallerySaving ? "Kaydediliyor…" : "Görseller veritabanına kaydedilir."}
        </p>
      </div>

      {/* ── Documents ── */}
      <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Sertifikalar ve Belgeler</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Hijyen belgesi, sigorta poliçesi veya iş lisansı yükleyin. (PDF veya görsel)</p>

        {/* Upload area */}
        <button
          onClick={() => docRef.current?.click()}
          className="w-full border-2 border-dashed border-border rounded-xl py-6 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all mb-4"
        >
          <Upload className="w-6 h-6" />
          <span className="text-sm font-medium">Belge yüklemek için tıklayın</span>
          <span className="text-xs">PDF, JPG, PNG</span>
        </button>
        <input ref={docRef} type="file" accept="application/pdf,image/*" multiple onChange={handleDocAdd} className="hidden" />

        {/* Doc list */}
        <AnimatePresence>
          {docs.map((doc, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-3 p-3 rounded-xl border border-border mb-2 last:mb-0 bg-secondary/30"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${doc.fileType === "pdf" ? "bg-red-100 text-red-500" : "bg-blue-100 text-blue-500"}`}>
                {doc.fileType === "pdf" ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                <p className="text-xs text-muted-foreground">{doc.size} · {doc.fileType.toUpperCase()}</p>
              </div>
              <a href={doc.url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-primary hover:underline font-medium px-2">
                Görüntüle
              </a>
              <button onClick={() => removeDoc(i)} className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-lg hover:bg-destructive/5">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {docs.length === 0 && (
          <p className="text-xs text-center text-muted-foreground py-2">Henüz belge yüklenmedi.</p>
        )}
        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full inline-block ${docsSaving ? "bg-blue-400 animate-pulse" : "bg-green-400"}`} />
          {docsSaving ? "Kaydediliyor…" : "Belgeler veritabanına kaydedilir."}
        </p>
      </div>
    </motion.div>
  );
}

/* ── Payment Modal ── */
type PackageType = "standart" | "elite";

interface PaymentModalProps {
  onHavalePending?: (refCode: string, pkg: PackageType) => void;
  pkg: PackageType | null;
  userName: string;
  onClose: () => void;
  onConfirm?: (pkg: PackageType) => void;
  initialStep?: "choose" | "havale_detail" | "pending";
  initialRefCode?: string;
}

const PACKAGE_INFO = {
  standart: { label: "Standart Paket", price: "999 TL / Ay", color: "from-primary to-teal-600" },
  elite:    { label: "Elite Vitrin Paketi", price: "5.000 TL / Ay", color: "from-amber-500 to-orange-500" },
};

const HAVALE_IBAN = "TR43 0003 2000 0000 0073 6044 93";
const HAVALE_BANK = "TEB Bankası";
const HAVALE_ALICI = "Serkan Çelebi";

function PaymentModal({ pkg, userName, onClose, onConfirm, onHavalePending, initialStep, initialRefCode }: PaymentModalProps) {
  const [method, setMethod] = useState<"paytr" | "havale">(initialStep === "pending" ? "havale" : "paytr");
  const [step, setStep] = useState<"choose" | "havale_detail" | "pending">(initialStep ?? "choose");
  const [referenceNote, setReferenceNote] = useState(() => initialRefCode ?? `CL-${userName.slice(0,4).toUpperCase()}-${Date.now().toString().slice(-6)}`);

  const [dekontTarih, setDekontTarih] = useState("");
  const [dekontBanka, setDekontBanka] = useState("");
  const [dekontDosya, setDekontDosya] = useState<File | null>(null);
  const dekontDosyaRef = useRef<HTMLInputElement>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  /* PayTR availability */
  const [paytrEnabled, setPaytrEnabled] = useState<boolean | null>(null);
  const [paytrLoading, setPaytrLoading] = useState(false);
  const [paytrError, setPaytrError] = useState<string | null>(null);
  useEffect(() => {
    apiPaytrStatus().then(s => setPaytrEnabled(s.enabled)).catch(() => setPaytrEnabled(false));
  }, []);

  if (!pkg) return null;
  const info = PACKAGE_INFO[pkg];

  const handlePayTR = async () => {
    if (!pkg) return;
    setPaytrLoading(true); setPaytrError(null);
    try {
      const r = await apiPaytrInit(pkg);
      window.open(r.iframeUrl, "_blank", "noopener");
      setStep("pending");
    } catch (err) {
      setPaytrError((err as Error).message ?? "PayTR başlatılamadı, lütfen Havale yöntemini seçin.");
    } finally { setPaytrLoading(false); }
  };

  const handleHavaleSend = () => {
    setStep("pending");
    if (pkg) onHavalePending?.(referenceNote, pkg);
  };

  const handleDekontEmail = async () => {
    setSending(true);
    setSendError(null);
    try {
      let dosyaBase64: string | undefined;
      if (dekontDosya) {
        dosyaBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(dekontDosya);
        });
      }
      await apiNotifyDekont({
        firmaAdi:   userName,
        paket:      pkg,
        refCode:    referenceNote,
        tarih:      dekontTarih,
        banka:      dekontBanka,
        dosyaAdi:   dekontDosya?.name,
        dosyaBase64,
      });
      setSent(true);
    } catch (err) {
      setSendError((err as Error).message ?? "E-posta gönderilemedi");
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div key="pay-bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
        onClick={onClose}>
        <motion.div
          key="pay-modal"
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          onClick={e => e.stopPropagation()}
          className="bg-white w-full max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className={`bg-gradient-to-br ${info.color} px-6 py-5 relative overflow-hidden`}>
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-xl" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-0.5">Ödeme</p>
                <h3 className="text-white text-xl font-bold">{info.label}</h3>
                <p className="text-white/80 text-sm mt-0.5">{info.price}</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="px-6 py-5">
            {step === "choose" && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-foreground mb-3">Ödeme Yöntemini Seçin</p>

                {/* PayTR option */}
                <button
                  onClick={() => paytrEnabled !== false && setMethod("paytr")}
                  disabled={paytrEnabled === false}
                  className={`w-full border-2 rounded-2xl p-4 text-left transition-all ${
                    paytrEnabled === false
                      ? "border-border opacity-50 cursor-not-allowed"
                      : method === "paytr" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${method === "paytr" ? "border-primary" : "border-border"}`}>
                      {method === "paytr" && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-foreground">💳 Kredi Kartı ile Öde (PayTR)</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {paytrEnabled === null ? "Hazırlanıyor..." :
                         paytrEnabled === false ? "PayTR henüz aktif değil — Havale kullanın" :
                         "Güvenli ödeme · Anında aktivasyon · Tek/3 taksit"}
                      </p>
                    </div>
                  </div>
                </button>

                {/* Havale option */}
                <button
                  onClick={() => setMethod("havale")}
                  className={`w-full border-2 rounded-2xl p-4 text-left transition-all ${method === "havale" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${method === "havale" ? "border-primary" : "border-border"}`}>
                      {method === "havale" && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-foreground">🏦 Havale / EFT ile Öde</p>
                      <p className="text-xs text-muted-foreground mt-0.5">1-2 iş günü doğrulama</p>
                    </div>
                  </div>
                </button>

                <Button
                  onClick={method === "paytr" ? handlePayTR : () => setStep("havale_detail")}
                  disabled={method === "paytr" && (paytrLoading || paytrEnabled !== true)}
                  className="w-full h-12 rounded-xl font-bold mt-2">
                  {method === "paytr"
                    ? (paytrLoading ? "Yönlendiriliyor..." : "PayTR ile Ödemeye Git →")
                    : "Havale Detaylarını Gör →"}
                </Button>
                {paytrError && (
                  <p className="text-xs text-red-600 mt-1">{paytrError}</p>
                )}
              </div>
            )}

            {step === "havale_detail" && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-foreground">Havale / EFT Bilgileri</p>
                <div className="bg-secondary rounded-2xl p-4 space-y-3 text-sm">
                  {[
                    ["Banka", HAVALE_BANK],
                    ["Alıcı", HAVALE_ALICI],
                    ["IBAN", HAVALE_IBAN],
                    ["Açıklama (Zorunlu)", referenceNote],
                    ["Tutar", info.price],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-start justify-between gap-2">
                      <span className="text-muted-foreground text-xs whitespace-nowrap">{label}</span>
                      <span className="font-semibold text-foreground text-xs text-right break-all">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                  ⚠️ Açıklama kısmına mutlaka <strong>{referenceNote}</strong> referans kodunu yazın. Ödeme sonrası 1-2 iş günü içinde hesabınız aktif edilir.
                </div>
                <Button onClick={handleHavaleSend} className="w-full h-12 rounded-xl font-bold">
                  Havalemi Yaptım, Aktivasyonu Bekle
                </Button>
                <button onClick={() => setStep("choose")} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
                  ← Geri
                </button>
              </div>
            )}

            {step === "pending" && (
              <div className="space-y-4 py-2">
                {/* Header */}
                <div className="flex flex-col items-center text-center gap-2 py-2">
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7 text-green-500" />
                  </div>
                  <div>
                    <p className="font-bold text-base text-foreground">
                      {method === "paytr" ? "Ödeme Tamamlandı!" : "Havale Bekleniyor"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {method === "paytr"
                        ? "PayTR ödemesi tamamlandı. Hesabınız aktif ediliyor."
                        : "Aşağıdaki formu doldurun ve e-posta ile bize bildirin."}
                    </p>
                  </div>
                </div>

                {/* Dekont form — only for havale */}
                {method === "havale" && (
                  <div className="bg-secondary/50 border border-border rounded-2xl p-4 space-y-3">
                    <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      Dekont Bildirimi
                    </p>

                    {/* Firma Adı — otomatik */}
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                        Firma Adı
                      </label>
                      <input
                        type="text"
                        value={userName}
                        readOnly
                        className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-secondary/60 text-muted-foreground cursor-default"
                      />
                    </div>

                    {/* Tarih */}
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                        İşlem Tarihi
                      </label>
                      <input
                        type="text"
                        placeholder="gg/aa/yyyy"
                        value={dekontTarih}
                        onChange={e => setDekontTarih(e.target.value)}
                        className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary transition-colors bg-white"
                      />
                    </div>

                    {/* Banka */}
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                        Gönderilen Banka
                      </label>
                      <input
                        type="text"
                        placeholder="Garanti BBVA, İş Bankası…"
                        value={dekontBanka}
                        onChange={e => setDekontBanka(e.target.value)}
                        className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary transition-colors bg-white"
                      />
                    </div>

                    {/* Referans kodu */}
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                        Açıklamaya Yazdığınız Referans
                      </label>
                      <input
                        type="text"
                        value={referenceNote}
                        onChange={e => setReferenceNote(e.target.value)}
                        className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary transition-colors bg-white font-mono"
                      />
                    </div>

                    {/* Dekont dosyası */}
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                        Dekont Fotoğrafı <span className="normal-case font-normal">(opsiyonel)</span>
                      </label>
                      <input
                        ref={dekontDosyaRef}
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={e => setDekontDosya(e.target.files?.[0] ?? null)}
                      />
                      {dekontDosya ? (
                        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700">
                          <Paperclip className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate flex-1">{dekontDosya.name}</span>
                          <button onClick={() => setDekontDosya(null)} className="text-green-500 hover:text-red-500 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => dekontDosyaRef.current?.click()}
                          onPaste={e => {
                            const file = e.clipboardData.files[0];
                            if (file) setDekontDosya(file);
                          }}
                          className="flex items-center gap-2 px-3 py-2 border-2 border-dashed border-border rounded-xl text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors w-full"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          Dosya seç veya yapıştır (JPG, PNG, PDF)
                        </button>
                      )}
                    </div>

                    {/* E-posta gönder butonu */}
                    {sent ? (
                      <div className="flex items-center gap-2 justify-center text-green-600 text-sm font-semibold py-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Bildiriminiz admin'e iletildi!
                      </div>
                    ) : (
                      <>
                        <Button
                          onClick={handleDekontEmail}
                          disabled={sending}
                          className="w-full h-10 rounded-xl gap-2 text-sm"
                        >
                          {sending
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Gönderiliyor…</>
                            : <><Mail className="w-4 h-4" /> E-posta ile Bildir</>}
                        </Button>
                        {sendError && (
                          <p className="text-[11px] text-red-500 text-center">{sendError}</p>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Admin approval note */}
                <p className="text-[11px] text-center text-muted-foreground">
                  {method === "havale"
                    ? "✅ Havale bildiriminiz alındı. Admin onayı bekleniyor (1-2 iş günü)."
                    : "✅ Ödeme alındıktan sonra hesabınız aktif edilecektir."}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─────────── Ad Stats Hook ─────────── */
type Period = "week" | "month";

function useAdStats(period: Period) {
  const { orders } = useApp();
  const [data, setData] = useState<AdConversionsData>(() => loadAdConversions());
  useEffect(() => {
    const handler = () => setData(loadAdConversions());
    window.addEventListener("ad_conversions_updated", handler);
    return () => window.removeEventListener("ad_conversions_updated", handler);
  }, []);
  const completedOrders = orders.filter(o => o.durum === "tamamlandi");
  return {
    calls:    filterByPeriod(data.calls, period).length,
    quotes:   orders.length,
    adOrders: completedOrders.length,
    rawCalls: data.calls.length,
    rawQuotes: orders.length,
    rawAdOrders: completedOrders.length,
  };
}

/* ─────────── ReklamTab ─────────── */
function ReklamTab({ onOpenPayment }: { onOpenPayment: (pkg: PackageType) => void }) {
  const { firmaProfile, user } = useApp();
  const [period, setPeriod] = useState<Period>("month");
  const stats = useAdStats(period);

  /* ── Bütçe sabitleri ── */
  const CALL_COST  = 20;  // Telefon tıklaması başına ₺
  const QUOTE_COST = 50;  // Teklif talebi başına ₺

  const isActive   = firmaProfile.isSubscribed || firmaProfile.isSponsor;
  /* Başlangıç bütçesi = paket ücretinin %60'ı (Elite: 3000×0.6=1800, Standart: 999×0.6≈599) */
  const budget     = firmaProfile.isSponsor ? 1800 : firmaProfile.isSubscribed ? 599 : 0;
  const displayStats = { calls: stats.calls, quotes: stats.quotes, adOrders: stats.adOrders };
  const spent      = Math.min(stats.rawCalls * CALL_COST + stats.rawQuotes * QUOTE_COST, budget);
  const remaining  = budget - spent;
  const spentPct   = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  const isPaused   = isActive && remaining <= 0;

  const infoCards = [
    {
      icon: MessageSquare,
      color: "bg-blue-50 text-blue-600",
      title: "CRM Altyapısı",
      desc: "Sipariş ve randevu yönetimi, müşteri iletişimi ve durum takibi tek panelden.",
    },
    {
      icon: Megaphone,
      color: "bg-amber-50 text-amber-600",
      title: "Google Ads Havuzu",
      desc: "Vitrin paket ücretinin %60'ı ortak reklam havuzuna aktarılır. Yönetim ücreti: 0 ₺.",
    },
    {
      icon: TrendingUp,
      color: "bg-green-50 text-green-600",
      title: "Canlı Raporlama",
      desc: "Telefon tıklaması, teklif alımı ve reklam kaynaklı siparişler anlık takip edilir.",
    },
  ];

  const counters = [
    { label: "Telefon Tıklaması", value: displayStats.calls,    icon: Phone,       color: "text-blue-600",  bg: "bg-blue-50" },
    { label: "Alınan Teklifler",  value: displayStats.quotes,   icon: FileText,    color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Reklam Siparişi",   value: displayStats.adOrders, icon: ShoppingBag, color: "text-green-600",  bg: "bg-green-50" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-2xl space-y-6">
      {/* Header + kampanya rozeti */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1">Reklam & Görünürlük</h2>
          <p className="text-muted-foreground text-sm">Müşteri akışını yönetin, reklam performansını takip edin.</p>
        </div>
        {firmaProfile.isSponsor ? (
          <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-xs font-bold">
            <Crown className="w-3 h-3" /> Elite Aktif
          </div>
        ) : firmaProfile.isSubscribed ? (
          <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 border border-green-200 text-green-700 text-xs font-bold">
            <CheckCircle2 className="w-3 h-3" /> Standart Aktif
          </div>
        ) : null}
      </div>

      {/* 3 Tanıtım Kartı */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {infoCards.map(({ icon: Icon, color, title, desc }) => (
          <div key={title} className="bg-white rounded-2xl border border-border p-4 shadow-sm space-y-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color} bg-opacity-80`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="font-semibold text-sm text-foreground">{title}</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* Canlı İstatistik Paneli */}
      <div className="bg-white rounded-2xl border-2 border-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <p className="font-bold text-sm text-foreground">Canlı İstatistikler</p>
            </div>
          <div className="flex items-center gap-2">
            {isActive && (
              <>
                <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
                  {(["week", "month"] as Period[]).map(p => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                        period === p ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {p === "week" ? "Bu Hafta" : "Bu Ay"}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => exportAdConversionsJson(user?.name ?? "Firma", budget > 0 ? {
                    toplamHavuz: budget,
                    harcananButce: spent,
                    kalanBakiye: remaining,
                    kullanimYuzdesi: spentPct,
                  } : undefined)}
                  title="JSON olarak dışa aktar"
                  className="w-7 h-7 rounded-lg bg-secondary hover:bg-border flex items-center justify-center transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </>
            )}
          </div>
        </div>

        {isActive ? (
          <div className="p-5 space-y-4">
            {/* 3 sayaç */}
            <div className="grid grid-cols-3 gap-3">
              {counters.map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className={`rounded-xl p-3.5 ${bg} flex flex-col gap-1`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                  <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
                  <p className="text-[10px] text-muted-foreground font-medium leading-tight">{label}</p>
                </div>
              ))}
            </div>
            {/* Havuz bakiyesi progress bar */}
            {isPaused && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-red-700">Reklamlarınız Duraklatıldı</p>
                  <p className="text-[11px] text-red-600 mt-0.5 leading-relaxed">
                    Reklam havuzu tükendi. Yeni paket alarak yeniden aktif edin.
                  </p>
                </div>
              </div>
            )}
            <div className={`rounded-xl border p-4 space-y-2.5 ${isPaused ? "border-red-200 bg-red-50/30" : "border-border"}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Globe className={`w-3.5 h-3.5 ${isPaused ? "text-red-500" : "text-primary"}`} />
                  <p className="text-xs font-semibold text-foreground">Reklam Havuzu Bakiyesi</p>
                </div>
                <p className={`text-xs font-bold ${isPaused ? "text-red-600" : spentPct >= 80 ? "text-orange-600" : "text-primary"}`}>
                  {spent.toLocaleString("tr-TR")} / {budget.toLocaleString("tr-TR")} ₺
                </p>
              </div>
              <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${spentPct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`h-full rounded-full ${
                    isPaused || spentPct >= 100
                      ? "bg-red-500"
                      : spentPct >= 80
                      ? "bg-gradient-to-r from-orange-400 to-red-400"
                      : "bg-gradient-to-r from-primary to-teal-500"
                  }`}
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground">
                  {budget > 0
                    ? `%${spentPct} kullanıldı · Kalan: ${remaining.toLocaleString("tr-TR")} ₺`
                    : "Paket aktifleştirildikten sonra havuz görünür."}
                </p>
                {budget > 0 && (
                  <p className="text-[10px] text-muted-foreground">
                    📞 {CALL_COST}₺/arama · 📋 {QUOTE_COST}₺/teklif
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="px-5 py-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-3">
              <Lock className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="font-semibold text-sm text-foreground">İstatistikler kilitli</p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Standart veya Elite paketi aktifleştirerek canlı raporlama paneline erişin.
            </p>
          </div>
        )}
      </div>

      {/* ── 500 TL Standart Paket ── */}
      <div className="bg-white rounded-2xl border-2 border-border shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-border flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">Standart Paket</p>
              <p className="text-xs text-muted-foreground">CRM + Randevu Yönetimi</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-extrabold text-primary">999</p>
            <p className="text-xs text-muted-foreground">TL / Ay</p>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            {[
              { icon: MessageSquare, title: "CRM Erişimi",      desc: "Müşteri taleplerini onaylayın veya karşı teklif yapın." },
              { icon: Phone,         title: "İletişim Kilidi",  desc: "Onaylanan randevularda otomatik iletişim açılır." },
              { icon: ShoppingBag,   title: "Sipariş Yönetimi", desc: "Sınırsız sipariş paneli ve durum takibi." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col gap-1.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="font-semibold text-xs text-foreground">{title}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          {firmaProfile.isSubscribed ? (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Standart Aktif — CRM özelliklerine erişiyorsunuz
            </div>
          ) : (
            <Button onClick={() => onOpenPayment("standart")} variant="outline"
              className="w-full rounded-xl h-11 font-bold gap-2 border-primary text-primary hover:bg-primary/5">
              <Shield className="w-4 h-4" />
              Standart Paketi Satın Al — 999 TL/Ay
            </Button>
          )}
        </div>
      </div>

      {/* ── 5.000 TL Elite Paket ── */}
      <div className="bg-white rounded-3xl border-2 border-primary/20 shadow-xl shadow-primary/5 overflow-hidden">
        <div className="bg-gradient-to-br from-primary to-teal-600 px-8 py-7 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-2xl" />
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <Rocket className="w-4 h-4 text-white" />
                </div>
                <span className="text-white/80 text-sm font-semibold uppercase tracking-wider">Elite Paket</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">Ana Sayfa Vitrin Paketi</h3>
              <p className="text-white/70 text-sm leading-relaxed max-w-xs">
                Bölgenizdeki binlerce müşteriye doğrudan ulaşın. Ana sayfada en üstte ve "VIP" etiketiyle görünün.
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-4xl font-extrabold text-white">5.000</p>
              <p className="text-white/70 text-sm font-medium">TL / Ay</p>
            </div>
          </div>
        </div>
        <div className="px-8 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[
              { icon: TrendingUp, title: "En Üst Sıra",  desc: "Arama sonuçlarında rakiplerinizin önünde görünün." },
              { icon: Megaphone,  title: "\"VIP\" Rozeti", desc: "Altın rozet ile markanız öne çıksın, güven kazanın." },
              { icon: Crown,      title: "Standart +",   desc: "Tüm CRM özellikleri + vitrin konumu dahil." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col gap-2">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <p className="font-semibold text-sm text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="h-px bg-border mb-5" />

          {/* Pilot uyarısı */}
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 leading-relaxed">
              <span className="font-bold">Pilot çalışma koşulları:</span> Bu paket{" "}
              <span className="font-bold">3 aylık</span> pilot çalışma kapsamındadır ve her ay için{" "}
              <span className="font-bold">5.000 TL + KDV</span> ödeme yapılır.{" "}
              <span className="font-semibold">7 günlük iptal garantisi pilot çalışma için geçerli değildir.</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">3 Aylık Pilot · Aylık 5.000 TL + KDV</p>
              <p className="text-xs text-muted-foreground mt-0.5">Toplam 15.000 TL + KDV · Pilot süre boyunca geçerli</p>
            </div>
            {firmaProfile.isSponsor ? (
              <div className="flex flex-col items-end gap-1 w-full sm:w-auto">
                <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 font-bold text-sm w-full sm:w-auto justify-center">
                  <Crown className="w-4 h-4 text-amber-500" />
                  Elite Paket Aktif — Ana Sayfadasınız
                </div>
                {(() => {
                  const start = firmaProfile.yayinaGirisTarihi;
                  if (!start) return null;
                  const PILOT_MS = 3 * 30 * 24 * 60 * 60 * 1000;
                  const endDate = new Date(start + PILOT_MS).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
                  return (
                    <p className="text-[11px] text-amber-700 font-medium">
                      Pilot çalışma bitiş tarihi: <span className="font-bold">{endDate}</span>
                    </p>
                  );
                })()}
              </div>
            ) : firmaProfile.isSubscribed ? (
              <Button onClick={() => onOpenPayment("elite")}
                className="rounded-xl h-12 px-8 font-bold gap-2 shadow-lg shadow-primary/20 w-full sm:w-auto">
                <Rocket className="w-4 h-4" />
                Elite Paketi Satın Al
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <div className="flex flex-col items-end gap-1.5 w-full sm:w-auto">
                <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-400 font-semibold text-sm cursor-not-allowed select-none w-full sm:w-auto justify-center">
                  <Lock className="w-4 h-4" />
                  Önce CRM Paketini Alın
                </div>
                <p className="text-[10px] text-muted-foreground">Elite, CRM üzerine kuruludur (Adım 2)</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Ödeme yöntemleri ── */}
      <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
        <h3 className="font-semibold text-foreground mb-3 text-sm flex items-center gap-2">
          Desteklenen Ödeme Yöntemleri
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50 border border-border">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 text-base">💳</div>
            <div>
              <p className="text-xs font-semibold text-foreground">Kredi/Banka Kartı</p>
              <p className="text-[10px] text-muted-foreground">PayTR ile güvenli ödeme · 3 taksit</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50 border border-border">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 text-base">🏦</div>
            <div>
              <p className="text-xs font-semibold text-foreground">Havale / EFT</p>
              <p className="text-[10px] text-muted-foreground">1-2 iş günü doğrulama</p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
        Standart 999 TL/Ay · Elite 5.000 TL/Ay · İptal garantisi dahil
      </p>
    </motion.div>
  );
}

/* ─────────── main component ─────────── */

const TABS: { key: Tab; label: string; icon: typeof LayoutDashboard; sub?: string }[] = [
  { key: "panel",     label: "Panel",             icon: LayoutDashboard, sub: "Genel bakış" },
  { key: "siparisler",label: "Siparişler",         icon: ShoppingBag,     sub: "CRM & randevular" },
  { key: "yorumlar",  label: "Yorumlar",           icon: MessageSquare,   sub: "Müşteri geri bildirimleri" },
  { key: "fiyatlar",  label: "Fiyat & Kapsam",     icon: Settings,        sub: "Hizmet fiyatları" },
  { key: "profil",    label: "Profil",             icon: UserIcon,        sub: "Firma bilgileri" },
  { key: "reklam",    label: "Reklam & Paketler",  icon: Megaphone,       sub: "Görünürlük & abonelik" },
];

interface SidebarProps {
  mobile?: boolean;
  userName: string;
  firmaProfile: { isSponsor: boolean; isSubscribed: boolean };
  urgentCount: number;
  activeTab: Tab;
  onTabChange: (t: Tab) => void;
  onLogout: () => void;
  onGoHome: () => void;
}

/* ─────────── CRM Gate ─────────── */
function CrmGate({ onBuyPlan }: { onBuyPlan: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[420px] text-center px-6"
    >
      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <Lock className="w-9 h-9 text-primary" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Bu Özellik Pakete Dahildir</h2>
      <p className="text-muted-foreground max-w-sm mb-2">
        Müşteri siparişlerini ve yorumlarını görüntülemek, ziyaret saati önermek ve CRM araçlarını kullanmak için <strong>Standart</strong> veya <strong>Elite</strong> pakete geçmeniz gerekiyor.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 w-full max-w-lg">
        <div className="border border-border rounded-2xl p-5 text-left bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground">Standart</span>
          </div>
          <p className="text-2xl font-extrabold text-foreground mb-1">999 <span className="text-sm font-semibold text-muted-foreground">TL/Ay</span></p>
          <ul className="text-xs text-muted-foreground space-y-1 mb-4">
            <li>✓ CRM — Sipariş yönetimi</li>
            <li>✓ Müşteri yorumlarına yanıt</li>
            <li>✓ 30 gün geçerlilik</li>
          </ul>
          <Button size="sm" className="w-full rounded-xl" onClick={onBuyPlan}>
            Paketi Seç
          </Button>
        </div>
        <div className="border border-amber-200 rounded-2xl p-5 text-left bg-amber-50 shadow-sm relative overflow-hidden">
          <div className="absolute top-3 right-3">
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">VIP</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-5 h-5 text-amber-600" />
            <span className="font-bold text-foreground">Elite</span>
          </div>
          <p className="text-2xl font-extrabold text-foreground mb-1">5.000 <span className="text-sm font-semibold text-muted-foreground">TL/Ay</span></p>
          <ul className="text-xs text-muted-foreground space-y-1 mb-4">
            <li>✓ Standart paket + CRM</li>
            <li>✓ Ana sayfada vitrin</li>
            <li>✓ Öncelikli sıralama</li>
          </ul>
          <Button size="sm" className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-white" onClick={onBuyPlan}>
            VIP Seç
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function DashboardSidebar({ mobile = false, userName, firmaProfile, urgentCount, activeTab, onTabChange, onLogout, onGoHome }: SidebarProps) {
  return (
    <aside className={
      mobile
        ? "flex flex-col h-full bg-white"
        : "hidden lg:flex flex-col w-64 bg-white border-r border-border h-screen sticky top-0 flex-shrink-0"
    }>
      {/* Logo — tıklanınca Panel sekmesine döner */}
      <div
        className="flex items-center gap-3 px-5 py-5 border-b border-border cursor-pointer hover:bg-primary/5 transition-colors"
        onClick={() => onTabChange("panel")}
        title="Panele Dön"
      >
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-primary text-sm leading-tight tracking-tight">CleanLink</p>
          <p className="text-[10px] text-muted-foreground font-medium">Firma Paneli</p>
        </div>
      </div>

      {/* Firma badge */}
      <div className="mx-3 mt-3 px-3 py-2.5 rounded-xl bg-primary/5 border border-primary/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{userName[0]?.toUpperCase() ?? "F"}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{userName}</p>
            {firmaProfile.isSponsor ? (
              <p className="text-[10px] text-amber-600 font-semibold flex items-center gap-0.5"><Crown className="w-2.5 h-2.5" /> Elite</p>
            ) : firmaProfile.isSubscribed ? (
              <p className="text-[10px] text-primary font-semibold flex items-center gap-0.5"><Shield className="w-2.5 h-2.5" /> Standart</p>
            ) : (
              <p className="text-[10px] text-muted-foreground">Ücretsiz Plan</p>
            )}
          </div>
          {urgentCount > 0 && (
            <span className="ml-auto w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
              {urgentCount}
            </span>
          )}
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {TABS.map(({ key, label, icon: Icon, sub }) => {
          const isActive = activeTab === key;
          const hasBadge = key === "siparisler" && urgentCount > 0;
          return (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                isActive
                  ? "bg-primary text-white shadow-md shadow-primary/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold leading-tight ${isActive ? "text-white" : "text-foreground"}`}>{label}</p>
                {sub && <p className={`text-[10px] leading-tight mt-0.5 ${isActive ? "text-white/70" : "text-muted-foreground"}`}>{sub}</p>}
              </div>
              {hasBadge && (
                <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${isActive ? "bg-white/30 text-white" : "bg-red-500 text-white"}`}>
                  {urgentCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom: Site link + Logout */}
      <div className="px-3 py-4 border-t border-border space-y-1">
        <button
          onClick={() => window.open("/?mode=site", "_blank")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
        >
          <Home className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-semibold">CleanLink Site</span>
          <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-semibold">Çıkış Yap</span>
        </button>
      </div>
    </aside>
  );
}

export default function FirmaDashboard({ onGoHome }: { onGoHome?: () => void }) {
  const { user, logout, orders, firmaProfile, updateFirmaProfile, refreshFirmaProfile } = useApp();
  const [tab, setTab] = useState<Tab>("panel");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* ── Lifted PaymentModal state ── */
  const [paymentPkg, setPaymentPkg] = useState<PackageType | null>(null);
  const [paymentInitialStep, setPaymentInitialStep] = useState<"choose" | "havale_detail" | "pending">("choose");
  const [paymentInitialRefCode, setPaymentInitialRefCode] = useState<string | undefined>(undefined);

  const handleOpenPayment = (pkg: PackageType) => {
    setPaymentPkg(pkg);
    setPaymentInitialStep("choose");
    setPaymentInitialRefCode(undefined);
  };

  const handlePaymentConfirm = (pkg: PackageType) => {
    if (pkg === "standart") updateFirmaProfile({ isSubscribed: true, subscriptionPending: false, havaleRefCode: undefined, havalePkg: undefined });
    else updateFirmaProfile({ isSponsor: true, isSubscribed: true, subscriptionPending: false, havaleRefCode: undefined, havalePkg: undefined });
  };

  const handleHavalePending = (refCode: string, pkg: PackageType) => {
    /* Optimistic local update so the banner shows immediately */
    updateFirmaProfile({ subscriptionPending: true, havaleRefCode: refCode, havalePkg: pkg });
    /* Persist to DB and trigger admin e-mail notification (best-effort) */
    apiSubmitHavale(refCode, pkg).catch(() => void 0);
  };

  const handleQuickRenew = async (): Promise<void> => {
    const nameSlug = (user?.name ?? "FIRMA").slice(0, 4).toUpperCase();
    const refCode = `CL-${nameSlug}-${Date.now().toString().slice(-6)}`;
    updateFirmaProfile({ subscriptionPending: true, havaleRefCode: refCode, havalePkg: "standart" });
    await apiSubmitHavale(refCode, "standart");
  };

  const handleReopenDekont = () => {
    const pkg = firmaProfile.havalePkg ?? "standart";
    setPaymentPkg(pkg);
    setPaymentInitialStep("pending");
    setPaymentInitialRefCode(firmaProfile.havaleRefCode);
  };

  /* ── Admin: havale onay / süre uzat ── */
  const handleAdminApprove = () => {
    approveFirmaHavale(user?.name ?? "")
      .then(() => refreshFirmaProfile())
      .catch(() => void 0);
  };

  const handleAdminExtend = () => {
    extendFirmaSubscription(user?.name ?? "")
      .then(() => refreshFirmaProfile())
      .catch(() => void 0);
  };

  /* ── CRM access: only for paid subscribers ── */
  const hasCrmAccess = firmaProfile.isSubscribed || firmaProfile.isSponsor;

  /* ── Orders: exact name match — loaded from DB via AppContext ── */
  const firmaOrders = orders.filter(o =>
    o.firmaName?.trim().toLowerCase() === user?.name?.trim().toLowerCase()
  );

  const totalRevenue = firmaOrders.filter(o => o.durum === "tamamlandi").reduce((s, o) => s + o.toplam, 0);
  const pendingCount = firmaOrders.filter(o => o.durum === "beklemede").length;
  const urgentCount  = firmaOrders.filter(o => o.durum === "beklemede" || o.durum === "zamanAsimi").length;

  const handleTabChange = (key: Tab) => {
    setTab(key);
    setSidebarOpen(false);
  };

  const sidebarProps: SidebarProps = {
    userName: user?.name ?? "",
    firmaProfile,
    urgentCount,
    activeTab: tab,
    onTabChange: handleTabChange,
    onLogout: logout,
    onGoHome: onGoHome ?? (() => { window.location.replace("/"); }),
  };

  return (
    <div className="flex min-h-screen bg-secondary/30">
      {/* Global PaymentModal — lifted from ReklamTab so PanelTab can open it */}
      <PaymentModal
        key={`${paymentPkg ?? "none"}-${paymentInitialStep}`}
        pkg={paymentPkg}
        userName={user?.name ?? ""}
        onClose={() => setPaymentPkg(null)}
        onConfirm={handlePaymentConfirm}
        onHavalePending={handleHavalePending}
        initialStep={paymentInitialStep}
        initialRefCode={paymentInitialRefCode}
      />

      {/* Desktop sidebar */}
      <DashboardSidebar {...sidebarProps} />

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              key="sb-bd"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              key="sb-panel"
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-72 shadow-2xl lg:hidden"
            >
              <DashboardSidebar {...sidebarProps} mobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden bg-white border-b border-border sticky top-0 z-30 shadow-sm">
          <div className="flex items-center justify-between px-4 h-14">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center"
            >
              <LayoutDashboard className="w-4 h-4 text-foreground" />
            </button>
            <button
              onClick={() => setTab("panel")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              title="Panele Dön"
            >
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <span className="font-bold text-sm text-primary">CleanLink</span>
              <span className="text-muted-foreground text-xs">/ {TABS.find(t => t.key === tab)?.label}</span>
            </button>
            {urgentCount > 0 && (
              <span className="w-6 h-6 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {urgentCount}
              </span>
            )}
          </div>
          {/* Mobile quick-tab strip */}
          <div className="overflow-x-auto px-3 pb-2 flex gap-1.5">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => handleTabChange(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                  tab === key ? "bg-primary text-white" : "bg-secondary text-muted-foreground"
                }`}
              >
                <Icon className="w-3 h-3" />
                {label.split(" ")[0]}
              </button>
            ))}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {tab === "panel"      && <PanelTab user={user} orders={firmaOrders} pendingCount={pendingCount} totalRevenue={totalRevenue} setTab={setTab} onReopenDekont={handleReopenDekont} onAdminApprove={user?.email === ADMIN_EMAIL ? handleAdminApprove : undefined} onAdminExtend={user?.email === ADMIN_EMAIL ? handleAdminExtend : undefined} onRenewRequest={handleQuickRenew} />}
          {tab === "siparisler" && <OrdersTab orders={firmaOrders} />}
          {tab === "yorumlar"   && (hasCrmAccess
            ? <ReviewsTab />
            : <CrmGate onBuyPlan={() => setTab("reklam")} />
          )}
          {tab === "fiyatlar"   && <PricesTab />}
          {tab === "profil"     && <ProfilTab />}
          {tab === "reklam"     && <ReklamTab onOpenPayment={handleOpenPayment} />}
        </main>
      </div>
    </div>
  );
}
