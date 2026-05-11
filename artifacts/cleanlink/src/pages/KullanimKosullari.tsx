import { useSEO } from "@/hooks/useSEO";
import { PageLayout } from "@/components/layout/PageLayout";
import { ScrollText } from "lucide-react";

const SECTIONS = [
  {
    title: "1. Taraflar ve Rol Tanımı",
    text: `İşbu sözleşme, Cleanlinktr (Bundan sonra "Platform" olarak anılacaktır) ile Platform'a üye olan "Müşteri" ve "Firma/Hizmet Sağlayıcı" (Bundan sonra ortaklaşa "Kullanıcı" olarak anılacaktır) arasında akdedilmiştir.

Cleanlinktr'nin Rolü: Cleanlinktr, hizmet alan ile hizmet vereni dijital ortamda buluşturan bir "Aracı Hizmet Sağlayıcı"dır. Cleanlinktr, taraflar arasında bir köprü vazifesi görür; ancak sunulan temizlik, bakım veya diğer hizmetlerin hiçbir aşamasında "işveren", "yüklenici", "temsilci" veya "garantör" sıfatına sahip değildir.`,
  },
  {
    title: "2. Sorumluluk Sınırlandırılması (Mesuliyet Reddi)",
    text: `Köprü Statüsü: Cleanlinktr, Müşteri ve Firma arasındaki ticari ilişkinin tarafı değildir. Hizmetin kalitesi, süresi, eksik ifası veya hiç ifa edilmemesi ile ilgili hiçbir sorumluluk Cleanlinktr'ye rücu edilemez.

Eylem ve Davranışlar: Hizmetin ifası sırasında tarafların (Firma personeli veya Müşteri) birbirlerine karşı sergilediği her türlü tutum, davranış, sözlü veya fiziksel eylem, etik dışı hareket, ihmal veya kusurdan münhasıran ilgili taraf sorumludur. Cleanlinktr, tarafların şahsi davranışlarından doğacak hiçbir doğrudan veya dolaylı zarardan mesul tutulamaz.

Maddi Hasarlar: Saha çalışması esnasında oluşabilecek hasar, kayıp, hırsızlık veya üçüncü şahıslara verilen zararlarda muhatap doğrudan hizmeti ifa eden Firmadır. Cleanlinktr bu süreçlerde arabulucu, hakim veya tazminat yükümlüsü değildir.`,
  },
  {
    title: "3. Firmalar İçin İş Garantisi Reddi",
    text: `Cleanlinktr, platforma kayıt olan Hizmet Sağlayıcılara (Firmalara) belirli bir iş hacmi, müşteri sayısı, süreklilik veya kazanç garantisi vermez.

Platform, firmalara sadece potansiyel müşterilere ulaşma imkânı sunan bir teknolojik altyapıdır. Sistemsel güncellemeler veya pazar koşulları nedeniyle iş akışında yaşanabilecek değişimlerden Platform sorumlu değildir.`,
  },
  {
    title: "4. Hakların Saklı Tutulması ve Değişiklik Yetkisi",
    text: `Tek Taraflı Değişiklik: Cleanlinktr, işbu sözleşme maddelerini, kullanım şartlarını, komisyon oranlarını ve platformun işleyişini dilediği zaman, önceden ihbara gerek olmaksızın değiştirme hakkını saklı tutar.

Platform Hakları: Platformun ismi, logosu, yazılımı, algoritması ve veri tabanı üzerindeki tüm fikri mülkiyet hakları Cleanlinktr'ye aittir. İzinsiz kullanımı halinde yasal işlem başlatılır.`,
  },
  {
    title: "5. KVKK Aydınlatma Metni ve Veri Süreçleri",
    text: `Veri İşleme: Kullanıcıların isim, iletişim ve adres bilgileri, sadece "Müşteri-Firma eşleşmesinin sağlanması" ve "Hizmetin ifası" amacıyla işlenir.

Veri Aktarımı: Rezervasyon onaylandığında, hizmetin gerçekleşebilmesi için gerekli olan veriler karşılıklı olarak (Müşteri bilgisi Firmaya, Firma bilgisi Müşteriye) aktarılır. Kullanıcılar, bu aşamadan sonra verilerin karşı tarafça kullanımı veya korunması ile ilgili Cleanlinktr'nin bir denetim yükümlülüğü olmadığını kabul eder.

Ticari İletişim: Kullanıcı, onay kutucuğunu işaretleyerek Cleanlinktr'den kampanya ve bilgilendirme iletileri almayı kabul etmiş sayılır.`,
  },
  {
    title: "6. Cayma ve İptal Şartları",
    text: `Hizmet iptalleri, Cleanlinktr tarafından belirlenen ve platformda ilan edilen süreler içinde yapılmalıdır. Belirlenen süreden sonra yapılan iptallerde hizmet bedelinin tamamı veya bir kısmı "rezervasyon iptal ücreti" olarak tahsil edilebilir.`,
  },
  {
    title: "7. Yetkili Mahkeme",
    text: `İşbu sözleşmeden doğacak uyuşmazlıklarda İstanbul (Çağlayan) Mahkemeleri ve İcra Daireleri münhasıran yetkilidir. Platform kayıtları, kesin ve bağlayıcı delil niteliğindedir.`,
  },
];

export default function KullanimKosullari() {
  useSEO({ title: "Kullanım Koşulları", canonical: "/kullanim-kosullari", noIndex: false });

  return (
    <PageLayout breadcrumbs={[{ label: "Kullanım Koşulları" }]}>
      <div className="max-w-3xl mx-auto">

        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
            <ScrollText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Kullanıcı Sözleşmesi</h1>
            <p className="text-sm text-muted-foreground mt-1">Cleanlinktr Kullanıcı Sözleşmesi ve Hukuki Şartlar</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-10 text-sm text-amber-800 leading-relaxed">
          Bu belgeyi okuyup anladıktan sonra kayıt olabilirsiniz. Platforma üye olarak bu sözleşmenin tüm maddelerini kabul etmiş sayılırsınız.
        </div>

        <div className="space-y-8 mb-16">
          {SECTIONS.map((s) => (
            <div key={s.title} className="border-b border-border pb-8 last:border-0">
              <h2 className="text-lg font-display font-semibold text-foreground mb-3">{s.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{s.text}</p>
            </div>
          ))}
        </div>

      </div>
    </PageLayout>
  );
}
