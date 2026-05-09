import { useState, useEffect } from "react";
import { useSEO } from "@/hooks/useSEO";
import { PageLayout } from "@/components/layout/PageLayout";
import { Cookie } from "lucide-react";
import { apiGetPageContent } from "@/lib/api";

const DEFAULT_CEREZ_ACIKLAMALAR = {
  zorunlu:    "Platformun temel işlevleri için gereklidir. Bu çerezler olmadan oturum yönetimi, kimlik doğrulama ve güvenlik işlemleri çalışmaz.",
  islevsel:   "Dil tercihleri, tema ayarları ve kullanıcı tercihlerini hatırlamak için kullanılır. Devre dışı bırakılabilir ancak deneyim kalitesi düşebilir.",
  analitik:   "Ziyaretçilerin platformu nasıl kullandığını anlamamıza ve hizmet kalitesini iyileştirmemize yardımcı olur. Veriler anonim olarak işlenir.",
  pazarlama:  "Yalnızca açık rızanız olması durumunda kişiselleştirilmiş reklam ve içerik gösterimi için kullanılır.",
};

const DEFAULT: Record<string, string> = {
  sonGuncelleme: "1 Ocak 2026",
  uyari: "Bu belge taslak niteliğinde olup hukuki bağlayıcılığı bulunmamaktadır. Yayın öncesinde bir hukuk danışmanına onaylatılmalıdır.",
  giris: "CleanLink olarak, platformumuzu daha iyi sunmak ve kullanıcı deneyimini geliştirmek amacıyla çerezler ve benzer teknolojiler kullanıyoruz. Bu politika, hangi çerezleri kullandığımızı, neden kullandığımızı ve tercihlerinizi nasıl yönetebileceğinizi açıklar.",
  zorunlu:    DEFAULT_CEREZ_ACIKLAMALAR.zorunlu,
  islevsel:   DEFAULT_CEREZ_ACIKLAMALAR.islevsel,
  analitik:   DEFAULT_CEREZ_ACIKLAMALAR.analitik,
  pazarlama:  DEFAULT_CEREZ_ACIKLAMALAR.pazarlama,
  yonetme:    "Tarayıcınızın ayarlar menüsünden çerezleri silebilir veya engelleyebilirsiniz. Ancak zorunlu çerezlerin engellenmesi durumunda platformun bazı özellikleri çalışmayabilir. Chrome, Firefox, Safari ve Edge tarayıcılarının çerez yönetimi için destek sayfalarını inceleyebilirsiniz.",
  ucuncu_taraf: "Ödeme işlemleri ve analitik hizmetler için bazı üçüncü taraf araçlar çerez yerleştirebilir. Bu çerezler ilgili üçüncü tarafların gizlilik politikasına tabidir.",
  iletisim_text: "Çerez politikamıza ilişkin sorularınız için kvkk@cleanlink.com.tr adresine yazabilirsiniz.",
};

interface CerezTipi {
  key: string;
  name: string;
  examples: string;
  duration: string;
  canDisable: boolean;
  color: string;
}

const CEREZ_TIPLERI: CerezTipi[] = [
  { key: "zorunlu",   name: "Zorunlu Çerezler",   examples: "Oturum ID, CSRF token, güvenlik çerezi",  duration: "Oturum süresi boyunca", canDisable: false, color: "bg-red-50 border-red-200 text-red-700" },
  { key: "islevsel",  name: "İşlevsel Çerezler",  examples: "Dil ayarı, konum tercihi, son arama",     duration: "1 yıla kadar",          canDisable: true,  color: "bg-blue-50 border-blue-200 text-blue-700" },
  { key: "analitik",  name: "Analitik Çerezler",  examples: "Sayfa görüntüleme, oturum süresi, tıklama yolu", duration: "2 yıla kadar", canDisable: true,  color: "bg-purple-50 border-purple-200 text-purple-700" },
  { key: "pazarlama", name: "Pazarlama Çerezleri", examples: "Reklam ID, dönüşüm takibi",             duration: "90 güne kadar",         canDisable: true,  color: "bg-orange-50 border-orange-200 text-orange-700" },
];

export default function CerezPolitikasi() {
  useSEO({ title: "Çerez Politikası", canonical: "/cerez-politikasi" });
  const [content, setContent] = useState(DEFAULT);

  useEffect(() => {
    apiGetPageContent("cerez")
      .then(c => setContent(prev => ({ ...prev, ...c })))
      .catch(() => {});
  }, []);

  return (
    <PageLayout breadcrumbs={[{ label: "Çerez Politikası" }]}>
      <div className="max-w-3xl mx-auto">

        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Cookie className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Çerez Politikası</h1>
            <p className="text-sm text-muted-foreground mt-1">Son güncelleme: {content.sonGuncelleme}</p>
          </div>
        </div>

        {content.uyari && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-10 text-sm text-amber-800">
            {content.uyari}
          </div>
        )}

        <div className="prose-sm text-muted-foreground mb-10">
          <p className="leading-relaxed">{content.giris}</p>
        </div>

        <div className="space-y-5 mb-12">
          <h2 className="text-xl font-display font-bold text-foreground">Kullandığımız Çerez Türleri</h2>
          {CEREZ_TIPLERI.map(c => (
            <div key={c.key} className={`border rounded-2xl p-5 ${c.color}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">{c.name}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/60">
                  {c.canDisable ? "İsteğe bağlı" : "Zorunlu"}
                </span>
              </div>
              <p className="text-xs leading-relaxed mb-2">
                {content[c.key] ?? DEFAULT[c.key]}
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-xs opacity-80">
                <span><strong>Örnek:</strong> {c.examples}</span>
                <span><strong>Süre:</strong> {c.duration}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-8 mb-16">
          <div className="border-b border-border pb-8">
            <h2 className="text-lg font-display font-semibold text-foreground mb-3">Çerez Tercihlerinizi Yönetme</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{content.yonetme}</p>
          </div>

          <div className="border-b border-border pb-8">
            <h2 className="text-lg font-display font-semibold text-foreground mb-3">Üçüncü Taraf Çerezler</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{content.ucuncu_taraf}</p>
          </div>

          <div>
            <h2 className="text-lg font-display font-semibold text-foreground mb-3">İletişim</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {content.iletisim_text.includes("kvkk@") ? (
                <>
                  {content.iletisim_text.split("kvkk@")[0]}
                  <a href="mailto:kvkk@cleanlink.com.tr" className="text-primary hover:underline">
                    kvkk@cleanlink.com.tr
                  </a>
                  {content.iletisim_text.split("kvkk@cleanlink.com.tr")[1] ?? ""}
                </>
              ) : content.iletisim_text}
            </p>
          </div>
        </div>

      </div>
    </PageLayout>
  );
}
