import { useState, useEffect } from "react";
import { useSEO } from "@/hooks/useSEO";
import { PageLayout } from "@/components/layout/PageLayout";
import { FirmaBasvuruModal } from "@/components/basvuru/FirmaBasvuruModal";
import {
  Rocket, MapPin, ShieldCheck, Megaphone, Users, Star, Lock, Info,
  TrendingUp, BadgeCheck, Fingerprint, Crown, Check, ArrowRight,
  Building2, ChevronRight, Zap, LayoutDashboard, Award,
} from "lucide-react";
import { apiGetPageContent } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { useLocation } from "wouter";

const DEFAULT_KONTENJAN =
  "Şişli bölgesi pilot programı 24 firma ile sınırlıdır. Kayıtlar açık olmaya devam etmektedir; kontenjan tamamlandığında bilgilendirme yapılacaktır.";

const FUNNEL_STEPS = [
  {
    step: "01",
    icon: Users,
    title: "Üye Ol",
    desc: "Standart kullanıcı olarak 2 dakikada kaydol. E-posta veya Google ile anında başla.",
    color: "from-teal-50 to-white",
    accent: "text-teal-600",
    border: "border-teal-100",
    badge: "bg-teal-100 text-teal-700",
    active: true,
  },
  {
    step: "02",
    icon: Zap,
    title: "CRM Paketini Satın Al",
    desc: "999 TL / ay ile tüm müşteri yönetim araçlarına ve firma paneline anında eriş.",
    color: "from-primary/5 to-white",
    accent: "text-primary",
    border: "border-primary/20",
    badge: "bg-primary/10 text-primary",
    active: true,
  },
  {
    step: "03",
    icon: Award,
    title: "Vitrin & Pilot Başvurusu",
    desc: "Firma panelinizden vitrinde yer alın, bölge koruması kazanın ve Pilot programa dahil olun.",
    color: "from-amber-50 to-white",
    accent: "text-amber-600",
    border: "border-amber-100",
    badge: "bg-amber-100 text-amber-700",
    active: false,
  },
];

const CRM_FEATURES = [
  "Tam özellikli Firma Paneli erişimi",
  "Sınırsız müşteri takibi ve CRM",
  "Randevu ve sipariş yönetimi",
  "Gerçek müşteri yorum sistemi",
  "Fiyat & hizmet listesi yönetimi",
  "Vitrin başvurusu hakkı (ek ücret ile)",
  "Bölge koruması başvurusu",
  "Pilot program önceliği",
  "7/24 destek hattı",
];

export default function PilotSartlari() {
  useSEO({
    title: "İş Ortaklığı & Pilot Program — Temizlik Firmanızı Dijitalleştirin",
    description: "CleanLink pilot programına katılın. Temizlik firmanızı dijitalleştirin, yeni müşteriler kazanın, rezervasyonlarınızı yönetin. Aylık 999 TL ile vitrine çıkın.",
    canonical: "/pilot-sartlari",
    ogImage: "https://cleanlinktr.com/og-pilot.png",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "CleanLink Pilot Program",
      "description": "Temizlik firmalarına yönelik dijital platform abonelik hizmeti. Yeni müşteriler, online rezervasyon ve CRM araçları.",
      "provider": { "@type": "Organization", "name": "CleanLink", "url": "https://cleanlinktr.com" },
      "offers": {
        "@type": "Offer",
        "price": "999",
        "priceCurrency": "TRY",
        "billingIncrement": "P1M",
        "description": "Aylık abonelik — pilot program",
      },
      "url": "https://cleanlinktr.com/pilot-sartlari",
    },
  });
  const [basvuruOpen, setBasvuruOpen] = useState(false);
  const [kontenjan, setKontenjan] = useState(DEFAULT_KONTENJAN);
  const { user, setShowAuthModal, setAuthMode } = useApp();
  const [, navigate] = useLocation();

  useEffect(() => {
    apiGetPageContent("pilot")
      .then(content => { if (content.kontenjan) setKontenjan(content.kontenjan); })
      .catch(() => { /* keep default */ });
  }, []);

  const handleCrmCta = () => {
    if (!user) {
      setAuthMode("firma");
      setShowAuthModal(true);
    } else if (user.type === "firma") {
      navigate("/firma-dashboard");
    } else {
      setBasvuruOpen(true);
    }
  };

  const handleFirmaGiris = () => {
    setAuthMode("firma");
    setShowAuthModal(true);
  };

  return (
    <PageLayout breadcrumbs={[{ label: "İş Ortaklığı" }, { label: "Firma Kayıt & CRM Paketi" }]}>
      <FirmaBasvuruModal open={basvuruOpen} onClose={() => setBasvuruOpen(false)} />

      <div className="max-w-5xl mx-auto">

        {/* ── Page Hero ── */}
        <div className="flex items-start gap-5 mb-10">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Building2 className="w-7 h-7 text-primary" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full mb-3">
              <Zap className="w-3 h-3" /> İş Ortaklığı
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground leading-tight">
              Temizlik İşletmenizi<br />
              <span className="text-primary">Dijitalleştirin</span>
            </h1>
            <p className="text-muted-foreground mt-2 text-base max-w-lg">
              999 TL / ay ile tüm müşteri yönetim araçlarına sahip olun, vitrine çıkın ve bölgenizde rakiplerden önce yer alın.
            </p>
          </div>
        </div>

        {/* ── Funnel Steps ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {FUNNEL_STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className={`relative bg-gradient-to-br ${s.color} border ${s.border} rounded-3xl p-6 overflow-hidden`}
              >
                <div className="absolute top-4 right-4 text-5xl font-black text-black/[0.04] leading-none select-none">
                  {s.step}
                </div>
                <div className={`w-10 h-10 rounded-2xl ${s.badge} flex items-center justify-center mb-4`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className={`font-display font-bold text-base text-foreground mb-1.5`}>{s.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                {i < FUNNEL_STEPS.length - 1 && (
                  <div className="hidden sm:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-5 h-5 rounded-full bg-white border border-border items-center justify-center shadow-sm">
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Pricing Card ── */}
        <div className="relative bg-foreground rounded-3xl overflow-hidden mb-14">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-primary/5 to-transparent pointer-events-none" />
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-0">

            {/* Left — Price */}
            <div className="p-8 md:p-10 border-b md:border-b-0 md:border-r border-white/10">
              <div className="inline-flex items-center gap-2 bg-primary/30 text-primary-foreground text-xs font-bold px-3 py-1 rounded-full mb-6">
                <Rocket className="w-3 h-3" /> Kapsamlı CRM Paketi
              </div>

              <div className="flex items-end gap-2 mb-2">
                <span className="text-5xl font-black text-white tracking-tight">999</span>
                <div className="pb-1.5">
                  <span className="text-white/60 text-lg font-medium">TL</span>
                  <span className="text-white/40 text-sm"> / ay</span>
                </div>
              </div>
              <p className="text-white/50 text-xs mb-8">KDV dahil · Her ay yenilenebilir · İptal garantisi</p>

              <button
                onClick={handleCrmCta}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-base h-14 px-8 rounded-2xl shadow-xl shadow-primary/30 group transition-colors mb-3"
              >
                {user?.type === "firma" ? (
                  <>
                    <LayoutDashboard className="w-5 h-5" />
                    Firma Paneline Git
                  </>
                ) : user ? (
                  <>
                    <Zap className="w-5 h-5" />
                    Paketi Satın Al
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                ) : (
                  <>
                    <Users className="w-5 h-5" />
                    Üye Ol &amp; Başla
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              {!user && (
                <p className="text-white/40 text-xs text-center">
                  Zaten hesabınız var mı?{" "}
                  <button
                    onClick={handleFirmaGiris}
                    className="text-primary hover:underline"
                  >
                    Giriş yapın
                  </button>
                </p>
              )}
              {user?.type === "musteri" && (
                <p className="text-white/40 text-xs text-center">
                  <span className="text-white/60 font-medium">{user.name}</span> olarak giriş yaptınız
                </p>
              )}
            </div>

            {/* Right — Features */}
            <div className="p-8 md:p-10">
              <p className="text-white/50 text-xs font-bold tracking-widest uppercase mb-5">Pakete Dahil</p>
              <ul className="space-y-3">
                {CRM_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-white/80 text-sm leading-relaxed">{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 pt-6 border-t border-white/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 flex items-center justify-center">
                  <Crown className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-xs text-white/50 leading-relaxed">
                  Bugün katılanlara <span className="text-amber-300 font-semibold">ömür boyu fiyat kilidi</span> — ilerleyen dönem zamlarından etkilenmezsiniz.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Kontenjan uyarısı ── */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-12">
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-800 text-sm">Sınırlı Kontenjan</p>
            <p className="text-sm text-amber-700 mt-0.5">{kontenjan}</p>
          </div>
        </div>

        {/* ── Section Title ── */}
        <div className="mb-8">
          <h2 className="text-2xl font-display font-bold text-foreground">Paket Avantajları</h2>
          <p className="text-muted-foreground text-sm mt-1">CRM paketinizi aktifleştirdiğinizde aşağıdaki tüm özelliklere erişirsiniz.</p>
        </div>

        {/* ── Bento Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-14">

          {/* 1 — Bölge & Semt Koruması — 4/6 cols */}
          <div className="lg:col-span-4 relative bg-white border border-border rounded-3xl p-7 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-white pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-violet-100 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-violet-600" />
                </div>
                <span className="text-[11px] font-bold tracking-widest text-violet-500 uppercase">Rekabet Koruması</span>
              </div>
              <h3 className="text-xl font-display font-bold text-foreground mb-3 leading-snug">
                Bölge & Semt Koruması
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                Her bölge ve semtte yalnızca belirli sayıda işletme platforma dahil edilir. Bu kota sistemi sayesinde
                firmalar kendi bölgelerinde gereksiz rekabete maruz kalmaz; aksine bölgenin doğal talebi
                sınırlı sayıda firma arasında paylaşılır.
              </p>
              <div className="mt-5 flex items-center gap-5">
                {[["2-3", "Hizmet başına max. firma"], ["100%", "Bölge talebi size"], ["Sınırlı", "Kontenjan garantili"]].map(([val, lbl]) => (
                  <div key={lbl}>
                    <p className="text-lg font-bold text-violet-700">{val}</p>
                    <p className="text-[11px] text-muted-foreground leading-tight">{lbl}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 2 — Sponsor Firma Filtresi — 2/6 cols */}
          <div className="lg:col-span-2 relative bg-white border border-border rounded-3xl p-7 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-white pointer-events-none" />
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-teal-100 flex items-center justify-center mb-4">
                <BadgeCheck className="w-5 h-5 text-teal-600" />
              </div>
              <h3 className="text-lg font-display font-bold text-foreground mb-3 leading-snug">
                Onaylı Firma Güvencesi
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sisteme yalnızca denetimden geçmiş firmalar dahil edilir. Her başvuru kimlik doğrulama, referans ve kapasite değerlendirmesinden geçer.
              </p>
              <div className="mt-5 inline-flex items-center gap-1.5 bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" />
                Onaylı Firma Güvencesi
              </div>
            </div>
          </div>

          {/* 3 — %60 Reklam Gücü — 2/6 cols */}
          <div className="lg:col-span-2 relative bg-white border border-border rounded-3xl p-7 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-white pointer-events-none" />
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-orange-100 flex items-center justify-center mb-4">
                <Megaphone className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-lg font-display font-bold text-foreground mb-3 leading-snug">
                %60 Reklam Gücü
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ödemenizin <span className="font-semibold text-orange-700">%60'ı</span> doğrudan Google Ads yönetimine aktarılır.
                Reklam yönetim ücreti ayrıca talep edilmez.
              </p>
              <div className="mt-4 mb-4">
                <div className="w-full bg-orange-100 rounded-full h-2">
                  <div className="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full" style={{ width: "60%" }} />
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground mt-1.5">
                  <span className="text-orange-600 font-bold">%60 Reklam</span>
                  <span>%40 Operasyon</span>
                </div>
              </div>
              {/* Google Ads logo */}
              <div className="flex items-center gap-2 mt-2">
                <svg viewBox="0 0 48 48" className="w-5 h-5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
                  <path d="M43.5 22.5h-1.5v-.75C42 12.51 34.74 5.25 25.5 5.25S9 12.51 9 21.75v.75H7.5C6.12 22.5 5 23.62 5 25.02v14.96C5 41.38 6.12 42.5 7.5 42.5h36c1.38 0 2.5-1.12 2.5-2.52V25.02C46 23.62 44.88 22.5 43.5 22.5zM25.5 8.25c8.01 0 14.25 5.99 14.25 13.5v.75h-28.5v-.75c0-7.51 6.24-13.5 14.25-13.5z" fill="#4285F4"/>
                  <circle cx="17" cy="33" r="4" fill="#EA4335"/>
                  <circle cx="25.5" cy="33" r="4" fill="#FBBC04"/>
                  <circle cx="34" cy="33" r="4" fill="#34A853"/>
                </svg>
                <span className="text-[11px] font-bold text-gray-500 tracking-wide">Google Ads ile Yönetilir</span>
              </div>
            </div>
          </div>

          {/* 4 — Müşteri Mıknatısı & CRM — 4/6 cols */}
          <div className="lg:col-span-4 relative bg-white border border-border rounded-3xl p-7 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-white pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-blue-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-[11px] font-bold tracking-widest text-blue-500 uppercase">Müşteri & Büyüme</span>
              </div>
              <h3 className="text-xl font-display font-bold text-foreground mb-3 leading-snug">
                Müşteri Mıknatısı & CRM
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                Firmanız CleanLink ana sayfasında vitrine çıkar ve bölge aramasında üst sıralarda görünür.
                Entegre CRM sistemi ile tüm müşteri ilişkilerinizi profesyonelce takip edin.
              </p>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  { icon: TrendingUp, label: "Ana Sayfa Vitrini", color: "bg-blue-50 text-blue-600" },
                  { icon: Users,      label: "CRM Müşteri Takibi", color: "bg-indigo-50 text-indigo-600" },
                  { icon: Star,       label: "Gerçek Yorum Sistemi",  color: "bg-sky-50 text-sky-600" },
                ].map(({ icon: Icon, label, color }) => (
                  <div key={label} className={`flex items-center gap-2 rounded-2xl px-3 py-2.5 ${color} bg-opacity-60`}>
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs font-semibold leading-tight">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 5 — Geleceğin Ayrıcalıkları — 3/6 cols */}
          <div className="lg:col-span-3 relative bg-foreground rounded-3xl p-7 shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-primary/10 to-transparent pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-amber-400/20 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-amber-400" />
                </div>
                <span className="text-[11px] font-bold tracking-widest text-amber-400 uppercase">Ömür Boyu</span>
              </div>
              <h3 className="text-xl font-display font-bold text-white mb-3 leading-snug">
                Geleceğin Ayrıcalıkları
              </h3>
              <p className="text-sm text-white/70 leading-relaxed">
                Bugün katılanlar, ilerleyen dönemlerde uygulanacak reklam yönetim ücretinden
                <span className="text-amber-300 font-semibold"> muaf tutulacak</span> ve mevcut paket fiyatlarını
                ömür boyu koruma hakkı kazanacaktır.
              </p>
              <ul className="mt-5 space-y-2">
                {["Yönetim ücreti yok — sonsuza dek", "Fiyat kilidi güvencesi", "Öncelikli destek hattı"].map(item => (
                  <li key={item} className="flex items-center gap-2 text-xs text-white/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 6 — Sistem Güvenliği — 3/6 cols */}
          <div className="lg:col-span-3 relative bg-white border border-border rounded-3xl p-7 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-white pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <Fingerprint className="w-5 h-5 text-slate-600" />
                </div>
                <span className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">Şeffaf & Güvenli</span>
              </div>
              <h3 className="text-xl font-display font-bold text-foreground mb-3 leading-snug">
                Sistem Güvenliği
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                3 aylık pilot süreci boyunca tüm bütçe aktarımları <span className="font-semibold text-slate-700">IP ve zaman damgalı dijital onay sistemiyle</span> kayıt altına alınır.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  { icon: Lock,       label: "IP + Zaman Damgası", sub: "Her işlemde" },
                  { icon: ShieldCheck, label: "Dijital Onay Kaydı", sub: "Hukuki geçerli" },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3">
                    <Icon className="w-4 h-4 text-slate-500 mb-1.5" />
                    <p className="text-xs font-semibold text-slate-700 leading-tight">{label}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* ── Final CTA ── */}
        <div className="bg-foreground text-white rounded-3xl p-8 md:p-10 mb-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 justify-between">
            <div>
              <h2 className="text-xl font-display font-bold mb-2">Hemen Başvurun</h2>
              <p className="text-white/70 text-sm max-w-md">
                Üye olun, CRM paketinizi aktifleştirin ve vitrin ile pilot başvurusunu Firma Panelinizden yapın.
                Kontenjanlar sınırlıdır — erken kayıt öncelik hakkı kazandırır.
              </p>
            </div>
            <button
              onClick={handleCrmCta}
              className="flex-shrink-0 inline-flex items-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-2xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30"
            >
              <Rocket className="w-4 h-4" />
              {user?.type === "firma" ? "Firma Paneline Git" : user ? "Paketi Satın Al" : "Üye Ol & Başla"}
            </button>
          </div>
        </div>

      </div>
    </PageLayout>
  );
}
