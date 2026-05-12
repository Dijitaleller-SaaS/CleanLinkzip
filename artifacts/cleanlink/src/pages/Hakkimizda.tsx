import { useState, useEffect } from "react";
import { useSEO } from "@/hooks/useSEO";
import { PageLayout } from "@/components/layout/PageLayout";
import { Leaf, Target, Users, Award, TreePine, Globe2 } from "lucide-react";
import { apiGetPageContent } from "@/lib/api";

const stats = [
  { label: "Aktif Firma",         value: "500+"   },
  { label: "Tamamlanan Hizmet",   value: "12.000+" },
  { label: "Dikilen Fidan",       value: "1.237"  },
  { label: "Memnun Müşteri",      value: "9.800+" },
];

const team = [
  { name: "Serkan Çelebi",   role: "Kurucu Ortak / CEO",       initials: "SÇ" },
  { name: "Emre Yunus Gün",  role: "Saha Satış Yöneticisi",   initials: "EG" },
];

const DEFAULTS = {
  h1:     "Temizlikte Yeni\nStandart Koyuyoruz",
  h2:     "CleanLink, güvenilir temizlik profesyonellerini müşterilerle buluşturan Türkiye'nin ilk akıllı temizlik marketyeri. Şeffaf fiyatlandırma, anlık randevu ve sürdürülebilir temizlik anlayışıyla sektörü dönüştürüyoruz.",
  vizyon: "Türkiye'nin her şehrinde güvenilir, şeffaf ve sürdürülebilir temizlik hizmetine erişimi demokratikleştirmek. Hem müşteriler hem de hizmet sağlayıcılar için adil, dijital bir ekosistem kurmak.",
  yesil:  "Her 2.500 TL üzeri hizmette adınıza 1 fidan dikiyoruz. CleanLink Yeşil Dönüşüm programı kapsamında bugüne kadar 1.237 fidan toprakla buluştu. Tertemiz evler, yeşeren bir gelecek.",
};

export default function Hakkimizda() {
  useSEO({
    title: "Hakkımızda — CleanLink'in Hikayesi",
    description: "CleanLink, profesyonel temizlik firmalarını müşterilerle buluşturan Türkiye'nin güvenilir platformu. Misyonumuz, değerlerimiz ve ekibimiz hakkında bilgi alın.",
    canonical: "/hakkimizda",
  });
  const [cms, setCms] = useState(DEFAULTS);

  useEffect(() => {
    apiGetPageContent("hakkimizda")
      .then(content => setCms(prev => ({ ...prev, ...content })))
      .catch(() => {});
  }, []);

  return (
    <PageLayout breadcrumbs={[{ label: "Hakkımızda" }]}>
      <div className="max-w-4xl mx-auto">

        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            <Leaf className="w-4 h-4" /> Yeşil Dönüşüm Hareketi
          </span>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6 leading-tight whitespace-pre-line">
            {cms.h1}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">{cms.h2}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {stats.map(s => (
            <div key={s.label} className="bg-white border border-border rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
              <p className="text-3xl font-display font-black text-primary mb-1">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-20">
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-3xl p-8">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-primary/25">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-display font-bold text-foreground mb-3">Vizyonumuz</h2>
            <p className="text-muted-foreground leading-relaxed">{cms.vizyon}</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-3xl p-8">
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-emerald-600/25">
              <TreePine className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-display font-bold text-foreground mb-3">Yeşil Misyonumuz</h2>
            <p className="text-muted-foreground leading-relaxed">{cms.yesil}</p>
          </div>
        </div>

        <div className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-foreground" />
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground">Ekibimiz</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {team.map(m => (
              <div key={m.name} className="bg-white border border-border rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-shadow hover:-translate-y-0.5 duration-200">
                <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center text-lg font-black mx-auto mb-3">
                  {m.initials}
                </div>
                <p className="font-semibold text-foreground text-sm">{m.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{m.role}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-foreground text-white rounded-3xl p-8 md:p-12 mb-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent pointer-events-none" />
          <Globe2 className="w-10 h-10 text-primary mx-auto mb-4 relative z-10" />
          <h2 className="text-2xl font-display font-bold mb-3 relative z-10">Türkiye'de Üretildi</h2>
          <p className="text-white/70 max-w-md mx-auto relative z-10">
            CleanLink, Türkiye'nin yerel ihtiyaçları için Türk mühendisler tarafından tasarlandı ve geliştirildi.
            Verileriniz Türkiye'de saklanır, destek ekibimiz Türkçe hizmet verir.
          </p>
          <div className="flex items-center justify-center gap-2 mt-5 relative z-10">
            <Award className="w-5 h-5 text-primary" />
            <span className="text-sm text-white/80 font-medium">ISO 27001 Güvenlik Sertifikası — 2024</span>
          </div>
        </div>

      </div>
    </PageLayout>
  );
}
