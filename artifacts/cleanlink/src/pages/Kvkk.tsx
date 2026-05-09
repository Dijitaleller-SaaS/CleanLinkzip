import { useState, useEffect } from "react";
import { useSEO } from "@/hooks/useSEO";
import { PageLayout } from "@/components/layout/PageLayout";
import { FileText } from "lucide-react";
import { apiGetPageContent } from "@/lib/api";

const DEFAULT: Record<string, string> = {
  sonGuncelleme: "1 Ocak 2026",
  uyari: "Bu belge taslak niteliğinde olup hukuki bağlayıcılığı bulunmamaktadır. Yayın öncesinde bir hukuk danışmanına onaylatılmalıdır.",
  s1: "Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu'nun (\"KVKK\") 10. maddesi uyarınca CleanLink Teknoloji A.Ş. (\"Şirket\") tarafından kişisel verilerinizin işlenmesine ilişkin sizi bilgilendirmek amacıyla hazırlanmıştır.",
  s2: "Unvan: CleanLink Teknoloji A.Ş.\nAdres: Maslak Mah. Büyükdere Cad. No:255 Sarıyer/İstanbul\nE-posta: kvkk@cleanlink.com.tr\nTicaret Sicil No: İstanbul / 12345 (örnek)",
  s3: "Kimlik bilgileri (ad, soyad, T.C. kimlik numarası — yalnızca firma tescillerinde); iletişim bilgileri (e-posta, telefon, adres); finansal bilgiler (ödeme tutarı, işlem tarihi — kart numarası saklanmaz); müşteri işlem bilgileri (rezervasyon, sipariş geçmişi); işlem güvenliği bilgileri (IP adresi, oturum kayıtları).",
  s4: "KVKK madde 5/2 kapsamında: Sözleşmenin kurulması ve ifası amacıyla rezervasyon ve ödeme işlemleri gerçekleştirilmesi; kanuni yükümlülüklerin yerine getirilmesi; meşru menfaat kapsamında platform güvenliği ve dolandırıcılık tespiti. Açık rıza kapsamında: Ticari elektronik ileti gönderimi ve kişiselleştirilmiş içerik sunumu.",
  s5: "Kişisel verileriniz; hizmet sağlayıcı firmalarla (randevu bilgileri kapsamında), lisanslı ödeme kuruluşlarıyla (ödeme işlemi için), Kamu kurum ve kuruluşlarıyla (yasal zorunluluk halinde) paylaşılabilir. Yurt dışına aktarım, yalnızca KVKK 9. maddesi kapsamındaki güvenceler sağlandığında gerçekleştirilir.",
  s6: "Kişisel verileriniz; platform üyelik formu, mobil/web uygulama kullanımı, müşteri hizmetleri görüşmeleri ve ödeme işlemleri aracılığıyla otomatik ve otomatik olmayan yollarla toplanmaktadır.",
  s7: "Veri sorumlusuna başvurarak; kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenen verileriniz hakkında bilgi talep etme, işlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme, yurt içinde/dışında aktarıldığı kişileri bilme, eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme, KVKK md. 7 çerçevesinde silinmesini veya yok edilmesini isteme, otomatik sistemlerle yapılan analiz sonucuna itiraz etme, hukuka aykırı işleme nedeniyle zararın giderilmesini talep etme haklarına sahipsiniz.",
  s8: "KVKK kapsamındaki haklarınızı kullanmak için; kvkk@cleanlink.com.tr adresine e-posta, yukarıdaki adrese kimlik fotokopisi ekli iadeli taahhütlü mektup veya güvenli elektronik imzalı dilekçe ile başvurabilirsiniz. Başvurularınız 30 gün içinde yanıtlanır.",
};

const SECTION_TITLES = [
  "1. Aydınlatma Metninin Amacı",
  "2. Veri Sorumlusunun Kimliği",
  "3. İşlenen Kişisel Veri Kategorileri",
  "4. Kişisel Verilerin İşlenme Amaçları ve Hukuki Sebebi",
  "5. Kişisel Verilerin Aktarıldığı Taraflar",
  "6. Kişisel Verilerin Toplanma Yöntemi",
  "7. Veri Sahibinin Hakları (KVKK Madde 11)",
  "8. Başvuru Hakkı ve Yöntemi",
];

export default function Kvkk() {
  useSEO({ title: "KVKK Aydınlatma Metni", canonical: "/kvkk" });
  const [content, setContent] = useState(DEFAULT);

  useEffect(() => {
    apiGetPageContent("kvkk")
      .then(c => setContent(prev => ({ ...prev, ...c })))
      .catch(() => {});
  }, []);

  return (
    <PageLayout breadcrumbs={[{ label: "KVKK Aydınlatma Metni" }]}>
      <div className="max-w-3xl mx-auto">

        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">KVKK Aydınlatma Metni</h1>
            <p className="text-sm text-muted-foreground mt-1">Son güncelleme: {content.sonGuncelleme} · 6698 Sayılı Kanun Kapsamında</p>
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
