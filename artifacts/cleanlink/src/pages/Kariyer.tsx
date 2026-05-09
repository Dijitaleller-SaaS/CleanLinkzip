import { useState, useEffect } from "react";
import { useSEO } from "@/hooks/useSEO";
import { PageLayout } from "@/components/layout/PageLayout";
import { Briefcase, Rocket, Heart, Coffee, ChevronDown, ChevronUp, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiGetPageContent } from "@/lib/api";

const DEFAULT_POSITIONS = [
  { title: "Ürün Müdürü",                    department: "Ürün",             location: "İstanbul (Hibrit)", type: "Tam Zamanlı" },
  { title: "Frontend Geliştirici (React)",    department: "Mühendislik",      location: "Uzaktan",           type: "Tam Zamanlı" },
  { title: "Müşteri Başarı Uzmanı",           department: "Müşteri Deneyimi", location: "İstanbul",          type: "Tam Zamanlı" },
  { title: "Satış Geliştirme Temsilcisi",     department: "Satış",            location: "İstanbul",          type: "Tam Zamanlı" },
];

const perks = [
  { icon: Rocket,    title: "Büyüme Fırsatı",   desc: "Türkiye'nin en hızlı büyüyen temizlik platformunda kariyer inşa edin." },
  { icon: Heart,     title: "Sağlık Sigortası",  desc: "Özel sağlık sigortası ve yıllık sağlık check-up desteği." },
  { icon: Coffee,    title: "Esnek Çalışma",     desc: "Hibrit ve uzaktan çalışma seçenekleri, esnek mesai." },
  { icon: Briefcase, title: "Eğitim Bütçesi",   desc: "Yılda 5.000 TL kişisel gelişim ve eğitim bütçesi." },
];

function parsePosition(raw: string): { title: string; department: string; location: string; type: string } | null {
  const parts = raw.split("|").map(s => s.trim());
  if (parts.length < 4) return null;
  return { title: parts[0], department: parts[1], location: parts[2], type: parts[3] };
}

export default function Kariyer() {
  useSEO({
    title: "Kariyer — CleanLink'te Çalışın",
    description: "CleanLink ekibine katılın! Temizlik sektörünü dönüştüren startup'ta kariyer fırsatlarını keşfedin. Açık pozisyonlar ve başvuru formu.",
    canonical: "/kariyer",
  });
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [form, setForm]       = useState({ name: "", email: "", note: "" });
  const [sent, setSent]       = useState(false);
  const { toast }             = useToast();

  const [h1,        setH1]        = useState("CleanLink Ailesine Katılın");
  const [h2,        setH2]        = useState("Temizlik sektörünü dönüştürme misyonumuzda bize katılın. Dinamik ekibimizle birlikte Türkiye'nin en büyük temizlik platformunu birlikte inşaa edelim.");
  const [positions, setPositions] = useState(DEFAULT_POSITIONS);

  useEffect(() => {
    apiGetPageContent("kariyer").then(c => {
      if (c.h1) setH1(c.h1);
      if (c.h2) setH2(c.h2);
      const parsed = [c.pos1, c.pos2, c.pos3, c.pos4]
        .map(v => (v ? parsePosition(v) : null))
        .filter((p): p is NonNullable<typeof p> => p !== null);
      if (parsed.length > 0) setPositions(parsed);
    }).catch(() => {});
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    toast({ title: "Başvurunuz Alındı!", description: "En kısa sürede size dönüş yapacağız." });
  };

  return (
    <PageLayout breadcrumbs={[{ label: "Kariyer" }]}>
      <div className="max-w-4xl mx-auto">

        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-5">
            {h1.includes("Katılın") ? (
              <>
                {h1.split("Katılın")[0]}
                <span className="text-primary">Katılın</span>
              </>
            ) : h1}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{h2}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {perks.map(p => (
            <div key={p.title} className="bg-white border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow text-center">
              <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <p.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm text-foreground mb-1">{p.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-display font-bold text-foreground mb-6">Açık Pozisyonlar</h2>
          <div className="space-y-3">
            {positions.map((pos, i) => (
              <div key={i} className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <button
                  onClick={() => setOpenIdx(openIdx === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                >
                  <div>
                    <p className="font-semibold text-foreground">{pos.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{pos.department} · {pos.location} · {pos.type}</p>
                  </div>
                  {openIdx === i ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
                {openIdx === i && (
                  <div className="border-t border-border px-6 py-5 bg-secondary/20">
                    <p className="text-sm text-muted-foreground mb-4">
                      Bu pozisyon için başvuru yapmak isterseniz aşağıdaki formu doldurabilirsiniz.
                      İnsan Kaynakları ekibimiz en kısa sürede sizinle iletişime geçecektir.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => {
                        const el = document.getElementById("basvuru-formu");
                        el?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      <Send className="w-4 h-4 mr-2" /> Başvur
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div id="basvuru-formu" className="bg-white border border-border rounded-3xl p-8 shadow-sm mb-16">
          <h2 className="text-xl font-display font-bold text-foreground mb-2">Genel Başvuru</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Açık bir pozisyon bulamadıysanız, özgeçmişinizi ve motivasyon notunuzu bizimle paylaşın.
          </p>
          {sent ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Heart className="w-7 h-7 text-primary" />
              </div>
              <p className="font-bold text-foreground">Başvurunuz Alındı!</p>
              <p className="text-sm text-muted-foreground mt-1">En kısa sürede size dönüş yapacağız.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Ad Soyad</label>
                  <input
                    required
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    placeholder="Adınız Soyadınız"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">E-posta</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    placeholder="ornek@mail.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Motivasyon Notu</label>
                <textarea
                  value={form.note}
                  onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                  rows={4}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
                  placeholder="Kendinizden ve CleanLink'e katılmak isteme nedeninizden bahsedin…"
                />
              </div>
              <Button type="submit" className="w-full md:w-auto px-8">
                <Send className="w-4 h-4 mr-2" /> Başvuruyu Gönder
              </Button>
            </form>
          )}
        </div>

      </div>
    </PageLayout>
  );
}
