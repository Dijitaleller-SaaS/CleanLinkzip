import { useState, useEffect } from "react";
import { useSEO } from "@/hooks/useSEO";
import { PageLayout } from "@/components/layout/PageLayout";
import { ShieldCheck } from "lucide-react";
import { apiGetPageContent } from "@/lib/api";

const DEFAULT: Record<string, string> = {
  sonGuncelleme: "1 Ocak 2026",
  uyari: "Bu belge taslak niteliğinde olup hukuki bağlayıcılığı bulunmamaktadır. Yayın öncesinde bir hukuk danışmanına onaylatılmalıdır.",
  s1: "CleanLink Teknoloji A.Ş. (\"CleanLink\"), 6698 sayılı Kişisel Verilerin Korunması Kanunu (\"KVKK\") kapsamında veri sorumlusu sıfatını taşımaktadır. Merkez adresimiz: Maslak Mah. Büyükdere Cad. No:255 Sarıyer/İstanbul.",
  s2: "Platformu kullanırken aşağıdaki kişisel verileriniz işlenebilir: Ad, soyad ve iletişim bilgileri (e-posta, telefon); cihaz ve tarayıcı bilgileri; IP adresi ve konum verileri (yalnızca bölge düzeyi); hizmet rezervasyonu ve ödeme kayıtları; platform içi mesajlaşma ve yorum içerikleri.",
  s3: "Kişisel verileriniz şu amaçlarla işlenir: Hizmet rezervasyonu ve randevu yönetimi; ödeme işlemlerinin gerçekleştirilmesi; müşteri desteği ve şikayet yönetimi; platform güvenliğinin sağlanması ve dolandırıcılığın önlenmesi; yasal yükümlülüklerin yerine getirilmesi; pazarlama faaliyetleri (yalnızca açık rıza durumunda).",
  s4: "Verileriniz; hizmet aldığınız firmalarla (randevu bilgileri kapsamında), ödeme altyapı sağlayıcılarıyla, yasal zorunluluk halinde kamu kurumlarıyla paylaşılabilir. Verileriniz hiçbir koşulda reklam amaçlı üçüncü taraflara satılmaz.",
  s5: "Kişisel verileriniz, işlenme amacının gerektirdiği süre boyunca ve ilgili yasal saklama süreleri gözetilerek tutulur. Hesabınızı silmeniz durumunda verileriniz yasal zorunluluk bulunmadığı sürece 30 gün içinde silinir veya anonim hale getirilir.",
  s6: "Verileriniz SSL/TLS şifreleme, erişim kontrol listeleri ve düzenli güvenlik denetimleri ile korunmaktadır. CleanLink, ISO 27001 standardına uygun bilgi güvenliği yönetim sistemi uygulamaktadır.",
  s7: "Platformumuz, deneyiminizi iyileştirmek amacıyla çerezler kullanmaktadır. Çerez tercihleri için Çerez Politikamızı inceleyin.",
  s8: "KVKK'nın 11. maddesi kapsamında; verilerinizin işlenip işlenmediğini öğrenme, işlendiyse bilgi talep etme, işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme, yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme, eksik veya yanlış işlenmişse düzeltilmesini isteme, silinmesini veya yok edilmesini isteme haklarına sahipsiniz. Talepler için: kvkk@cleanlink.com.tr",
};

const SECTION_TITLES = [
  "1. Veri Sorumlusu",
  "2. Toplanan Veriler",
  "3. Verilerin Kullanım Amaçları",
  "4. Verilerin Paylaşımı",
  "5. Verilerin Saklanma Süresi",
  "6. Güvenlik Önlemleri",
  "7. Çerezler",
  "8. Haklarınız",
];

export default function GizlilikPolitikasi() {
  useSEO({ title: "Gizlilik Politikası", canonical: "/gizlilik-politikasi" });
  const [content, setContent] = useState(DEFAULT);

  useEffect(() => {
    apiGetPageContent("gizlilik")
      .then(c => setContent(prev => ({ ...prev, ...c })))
      .catch(() => {});
  }, []);

  return (
    <PageLayout breadcrumbs={[{ label: "Gizlilik Politikası" }]}>
      <div className="max-w-3xl mx-auto">

        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Gizlilik Politikası</h1>
            <p className="text-sm text-muted-foreground mt-1">Son güncelleme: {content.sonGuncelleme}</p>
          </div>
        </div>

        {content.uyari && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-10 text-sm text-amber-800">
            {content.uyari}
          </div>
        )}

        <div className="space-y-8 mb-16">
          {SECTION_TITLES.map((title, i) => {
            const key = `s${i + 1}`;
            const text = content[key] ?? DEFAULT[key] ?? "";
            return (
              <div key={title} className="border-b border-border pb-8 last:border-0">
                <h2 className="text-lg font-display font-semibold text-foreground mb-3">{title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{text}</p>
              </div>
            );
          })}
        </div>

      </div>
    </PageLayout>
  );
}
