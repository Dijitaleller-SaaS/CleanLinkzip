import { useState, useEffect } from "react";
import { useSEO } from "@/hooks/useSEO";
import { PageLayout } from "@/components/layout/PageLayout";
import { ScrollText } from "lucide-react";
import { apiGetPageContent } from "@/lib/api";

const DEFAULT: Record<string, string> = {
  sonGuncelleme: "1 Ocak 2026",
  uyari: "Bu belge taslak niteliğinde olup hukuki bağlayıcılığı bulunmamaktadır. Yayın öncesinde bir hukuk danışmanına onaylatılmalıdır.",
  s1: "Bu Kullanım Koşulları (\"Koşullar\"), CleanLink Teknoloji A.Ş. (\"CleanLink\", \"biz\") ile CleanLink platformunu kullanan bireyler ve kurumlar (\"Kullanıcı\", \"siz\") arasındaki ilişkiyi düzenler. Platforma erişim sağlayarak bu Koşulları kabul etmiş sayılırsınız.",
  s2: "CleanLink, temizlik hizmet sağlayıcılarını (\"Firma\") müşterilerle (\"Müşteri\") buluşturan çevrimiçi bir pazar yeridir. CleanLink, söz konusu hizmetlerin doğrudan sağlayıcısı değildir; yalnızca aracılık hizmeti sunar. Firmalar bağımsız üçüncü taraflardır.",
  s3: "Platforma üye olmak için 18 yaşını doldurmuş olmanız gerekmektedir. Hesap bilgilerinizin gizliliğini ve güvenliğini sağlamak sizin sorumluluğunuzdadır. Hesabınızdan gerçekleştirilen tüm faaliyetlerden siz sorumlusunuzdur. Şüpheli bir durum fark ettiğinizde derhal destek@cleanlink.com.tr adresine bildirmelisiniz.",
  s4: "PİLOT DÖNEM ÖDEME: CleanLink şu anda pilot aşamasındadır. Müşteri ödemeleri hizmet tamamlandıktan sonra doğrudan hizmet sağlayıcı firmaya yapılır; CleanLink müşteri ödemelerinde aracılık etmez ve komisyon tahsil etmez. Online ödeme ve 3 taksit altyapısı yakında devreye alınacaktır. Firma abonelik ödemeleri (Standart/Elite paket) Havale/EFT veya online ödeme sağlayıcısı (PayTR) üzerinden yapılır. Randevu onaylandıktan sonra 24 saat içinde ücretsiz iptal yapılabilir.",
  s5: "Platformu yasa dışı amaçlarla kullanmak, sahte yorum yazmak, başka kullanıcıların bilgilerini izinsiz toplamak, sistemi aşırı yükleyecek işlemler gerçekleştirmek, firmalar veya müşterilerle platforma zarar verecek faaliyetlerde bulunmak kesinlikle yasaktır. Bu tür ihlaller hesabın askıya alınmasıyla sonuçlanabilir.",
  s6: "CleanLink, firmalar tarafından sunulan hizmetlerin kalitesinden doğrudan sorumlu değildir. Ancak oluşabilecek uyuşmazlıklarda arabuluculuk hizmeti sunmak için çaba gösterir. CleanLink'in herhangi bir ihmal veya hata nedeniyle sorumluluğu, ilgili işlem bedeliyle sınırlıdır.",
  s7: "CleanLink platformu, tasarımı, logosu, içerikleri ve yazılımı CleanLink Teknoloji A.Ş.'nin münhasır mülkiyetindedir ve Türkiye Cumhuriyeti fikri mülkiyet mevzuatıyla korunmaktadır. İzinsiz çoğaltma, dağıtma veya türev eser oluşturma yasaktır.",
  s8: "CleanLink, bu Koşulları önceden bildirimde bulunmaksızın güncelleme hakkını saklı tutar. Güncellemeler yayınlandıktan sonra platformu kullanmaya devam etmeniz, yeni koşulları kabul ettiğiniz anlamına gelir. Önemli değişikliklerde kayıtlı e-posta adresinize bildirim yapılır.",
  s9: "Bu Koşullar Türk hukukuna tabidir. Uyuşmazlıklarda İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.",
};

const SECTION_TITLES = [
  "1. Taraflar ve Kapsam",
  "2. Hizmetin Tanımı",
  "3. Üyelik ve Hesap Güvenliği",
  "4. Ödemeler ve İptal Politikası",
  "5. Yasaklı Kullanımlar",
  "6. Sorumluluk Sınırlaması",
  "7. Fikri Mülkiyet",
  "8. Koşulların Değiştirilmesi",
  "9. Uygulanacak Hukuk",
];

export default function KullanimKosullari() {
  useSEO({ title: "Kullanım Koşulları", canonical: "/kullanim-kosullari", noIndex: false });
  const [content, setContent] = useState(DEFAULT);

  useEffect(() => {
    apiGetPageContent("kosullar")
      .then(c => setContent(prev => ({ ...prev, ...c })))
      .catch(() => {});
  }, []);

  return (
    <PageLayout breadcrumbs={[{ label: "Kullanım Koşulları" }]}>
      <div className="max-w-3xl mx-auto">

        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
            <ScrollText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Kullanım Koşulları</h1>
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
