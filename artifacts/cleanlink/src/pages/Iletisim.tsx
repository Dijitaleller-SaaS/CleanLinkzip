import { useEffect, useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import { PageLayout } from "@/components/layout/PageLayout";
import { Mail, Phone, MapPin } from "lucide-react";
import { apiGetPageContent } from "@/lib/api";

const DEFAULTS = {
  h1:            "Bize Ulaşın",
  h2:            "Sorularınız, önerileriniz veya işbirliği teklifleriniz için ekibimiz size yardımcı olmaktan mutluluk duyar.",
  email:         "destek@cleanlink.com.tr",
  telefon:       "0850 333 44 55",
  adres1:        "Maslak Mah. Büyükdere Cad.",
  adres2:        "No: 255 Sarıyer / İstanbul",
  mesaiSaatleri: "Hft–Cts: 09:00 – 18:00",
};

export default function Iletisim() {
  useSEO({
    title: "İletişim — Bize Ulaşın",
    description: "CleanLink ile iletişime geçin. Sorularınız, önerileriniz veya firma başvurularınız için destek ekibimiz yardımcı olmaya hazır.",
    canonical: "/iletisim",
  });

  const [cms, setCms] = useState(DEFAULTS);

  useEffect(() => {
    apiGetPageContent("iletisim")
      .then(c => setCms(prev => ({ ...prev, ...c })))
      .catch(() => {});
  }, []);

  return (
    <PageLayout breadcrumbs={[{ label: "İletişim" }]}>
      <div className="max-w-2xl mx-auto">

        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
            {cms.h1.includes("Ulaşın") ? (
              <>Bize <span className="text-primary">Ulaşın</span></>
            ) : cms.h1}
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl">{cms.h2}</p>
        </div>

        <div className="space-y-5">
          <div className="bg-white border border-border rounded-2xl p-5 flex items-start gap-4 shadow-sm">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">E-posta</p>
              <a href={`mailto:${cms.email}`} className="text-sm text-primary hover:underline">
                {cms.email}
              </a>
              <p className="text-xs text-muted-foreground mt-0.5">Yanıt süresi: 24 saat</p>
            </div>
          </div>

          <div className="bg-white border border-border rounded-2xl p-5 flex items-start gap-4 shadow-sm">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Telefon</p>
              <a href={`tel:${cms.telefon.replace(/\s/g, "")}`} className="text-sm text-primary hover:underline">
                {cms.telefon}
              </a>
              <p className="text-xs text-muted-foreground mt-0.5">{cms.mesaiSaatleri}</p>
            </div>
          </div>

          <div className="bg-white border border-border rounded-2xl p-5 flex items-start gap-4 shadow-sm">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Adres</p>
              <p className="text-sm text-muted-foreground">{cms.adres1}</p>
              <p className="text-sm text-muted-foreground">{cms.adres2}</p>
            </div>
          </div>
        </div>

      </div>
    </PageLayout>
  );
}
