import { useState, useEffect } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { FirmaBasvuruModal } from "@/components/basvuru/FirmaBasvuruModal";
import {
  Rocket, MapPin, ShieldCheck, Megaphone, Users, Star, Lock, Info,
  TrendingUp, BadgeCheck, Fingerprint, Crown,
} from "lucide-react";
import { apiGetPageContent } from "@/lib/api";

const DEFAULT_KONTENJAN =
  "Şişli bölgesi pilot programı 24 firma ile sınırlıdır. Kayıtlar açık olmaya devam etmektedir; kontenjan tamamlandığında bilgilendirme yapılacaktır.";

export default function PilotSartlari() {
  const [basvuruOpen, setBasvuruOpen] = useState(false);
  const [kontenjan, setKontenjan] = useState(DEFAULT_KONTENJAN);

  useEffect(() => {
    apiGetPageContent("pilot")
      .then(content => { if (content.kontenjan) setKontenjan(content.kontenjan); })
      .catch(() => { /* keep default */ });
  }, []);

  return (
    <PageLayout breadcrumbs={[{ label: "Pilot Şartları" }]}>
      <FirmaBasvuruModal open={basvuruOpen} onClose={() => setBasvuruOpen(false)} />

      <div className="max-w-5xl mx-auto">

        {/* Hero */}
        <div className="flex items-start gap-5 mb-10">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Rocket className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground leading-tight">
              Pilot Şartları ve<br />
              <span className="text-primary">Sponsor Avantajları</span>
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">Son güncelleme: 30 Nisan 2026</p>
          </div>
        </div>

        {/* Kontenjan uyarısı */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-10">
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-800 text-sm">Sınırlı Kontenjan</p>
            <p className="text-sm text-amber-700 mt-0.5">{kontenjan}</p>
          </div>
        </div>

        {/* ── Bento Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-14">

          {/* 1 — Bölge & Semt Koruması  — 4/6 cols */}
          <div className="lg:col-span-4 relative bg-white border border-border rounded-3xl p-7 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-white pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-violet-100 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-violet-600" />
                </div>
                <span className="text-[11px] font-bold tracking-widest text-violet-500 uppercase">Rekabet Koruması</span>
              </div>
              <h2 className="text-xl font-display font-bold text-foreground mb-3 leading-snug">
                Bölge & Semt Koruması
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                Her bölge ve semtte yalnızca belirli sayıda işletme platforma dahil edilir. Bu kota sistemi sayesinde
                firmalar kendi bölgelerinde gereksiz rekabete maruz kalmaz; aksine bölgenin doğal talebi
                sınırlı sayıda firma arasında paylaşılır. Bölgenizde yer açıkken başvurmanız kritik öneme sahiptir.
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
              <h2 className="text-lg font-display font-bold text-foreground mb-3 leading-snug">
                Sponsor Firma Filtresi
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sisteme yalnızca denetimden geçmiş ve CleanLink ekibi tarafından onaylanmış firmalar dahil edilebilir.
                Her başvuru kimlik doğrulama, referans kontrolü ve kapasite değerlendirmesinden geçer.
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
              <h2 className="text-lg font-display font-bold text-foreground mb-3 leading-snug">
                %60 Reklam Gücü
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ödemenizin <span className="font-semibold text-orange-700">%60'ı</span> doğrudan Google Ads yönetimine aktarılır.
                Reklam yönetim ücreti ayrıca talep edilmez — ödenen bütçe reklama, müşteriye gider.
              </p>
              <div className="mt-5">
                <div className="w-full bg-orange-100 rounded-full h-2">
                  <div className="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full" style={{ width: "60%" }} />
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground mt-1.5">
                  <span className="text-orange-600 font-bold">%60 Reklam</span>
                  <span>%40 Operasyon</span>
                </div>
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
              <h2 className="text-xl font-display font-bold text-foreground mb-3 leading-snug">
                Müşteri Mıknatısı & CRM
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                Firmanız CleanLink ana sayfasında vitrine çıkar ve bölge aramasında üst sıralarda görünür.
                Entegre CRM sistemi ile tüm müşteri ilişkilerinizi profesyonelce takip eder,
                gerçek müşteri yorumlarıyla güvenilirliğinizi pekiştirirsiniz.
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
              <h2 className="text-xl font-display font-bold text-white mb-3 leading-snug">
                Geleceğin Ayrıcalıkları
              </h2>
              <p className="text-sm text-white/70 leading-relaxed">
                Bugün Sponsor Firma olarak katılanlar, ilerleyen dönemlerde uygulanacak reklam yönetim ücretinden
                <span className="text-amber-300 font-semibold"> muaf tutulacak</span> ve mevcut paket fiyatlarını
                ömür boyu koruma hakkı kazanacaktır. Erken gelen, kalıcı kazanır.
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
              <h2 className="text-xl font-display font-bold text-foreground mb-3 leading-snug">
                Sistem Güvenliği
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                3 aylık pilot süreci boyunca tüm bütçe aktarımları <span className="font-semibold text-slate-700">IP ve zaman damgalı dijital onay sistemiyle</span> kayıt altına alınır.
                Her işlem izlenebilir, şeffaf ve hukuki geçerliliğe sahiptir.
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
        {/* ── /Bento Grid ── */}

        {/* CTA */}
        <div className="bg-foreground text-white rounded-3xl p-8 md:p-10 mb-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 justify-between">
            <div>
              <h2 className="text-xl font-display font-bold mb-2">Başvurmak İster misiniz?</h2>
              <p className="text-white/70 text-sm max-w-md">
                Pilot programına katılmak için firma hesabı oluşturun ve sponsorluk paketinizi seçin.
                Kontenjanlar sınırlıdır — erken kayıt öncelik hakkı kazandırır.
              </p>
            </div>
            <button
              onClick={() => setBasvuruOpen(true)}
              className="flex-shrink-0 inline-flex items-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-2xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30"
            >
              <Rocket className="w-4 h-4" />
              Hemen Başvur
            </button>
          </div>
        </div>

      </div>
    </PageLayout>
  );
}
