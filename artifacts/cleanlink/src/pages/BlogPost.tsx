import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useSEO } from "@/hooks/useSEO";
import { PageLayout } from "@/components/layout/PageLayout";
import { ArrowLeft, BookOpen, Clock, Tag } from "lucide-react";
import { apiGetBlogPostBySlug } from "@/lib/api";

const BASE_URL = "https://cleanlinktr.com";

interface FullPost {
  slug: string;
  title: string;
  category: string;
  postDate: string;
  readTime: string;
  excerpt: string;
  ctaLink: string;
  ctaText: string;
  body: { h: string; p: string }[];
  faq: { q: string; a: string }[];
}

const POSTS: FullPost[] = [
  {
    slug: "istanbul-hali-yikama-fiyatlari-2026",
    title: "İstanbul'da Halı Yıkama Fiyatları 2026 — Kapsamlı Rehber",
    category: "Halı Yıkama", postDate: "28 Nisan 2026", readTime: "5 dk",
    excerpt: "İstanbul'da halı yıkama m² fiyatları, ek hizmetler ve doğru firmayı seçmenin 7 kuralı.",
    ctaLink: "/hizmet/istanbul/hali-yikama", ctaText: "İstanbul Halı Yıkama Firmalarını Gör",
    body: [
      { h: "Ortalama m² fiyatı ne kadar?", p: "İstanbul'da 2026 yılında makine halısı yıkama m² fiyatları ortalama 35–55 TL bandındadır. Anadolu yakasında fiyatlar genelde Avrupa yakasından %5–10 daha düşüktür çünkü işletme maliyetleri farklılık gösterir. İpek halı, shaggy ve yün halı için bu rakam 80–150 TL'ye kadar çıkabilir; el dokuma kilim ve antika halılar ise tamamen el yıkama gerektirdiği için ayrı fiyatlandırılır." },
      { h: "Yerinde yıkama vs fabrika yıkama", p: "Fabrika yıkama daha ucuzdur (m² başına 35–50 TL) ve halınız 24–48 saat sonra teslim edilir. Yerinde yıkama (köpük yöntemi) ise 60–90 TL arası bir fiyatla evinizde yapılır, halıyı taşıma derdi yoktur ama derinlemesine kir ve akar temizliği daha sınırlıdır." },
      { h: "Hangi ek hizmetlere dikkat etmelisiniz?", p: "Profesyonel firmalar şu hizmetleri ek ücretsiz veya düşük ücretle sunar: ücretsiz alım–teslim, leke ön-işlem, koku giderme, anti-bakteriyel uygulama, UV sterilizasyon. Ek hizmet adı altında ekstra ücret talep eden firmalardan kaçının." },
      { h: "Doğru firmayı seçmenin 7 kuralı", p: "1) Vergi levhası ve ticari sicil belgesi olmalı. 2) Sosyal medyada gerçek müşteri yorumları bulunmalı. 3) Halınızı teslim alırken yazılı tutanak imzalatmalı. 4) Kullandığı kimyasalların marka ismini söylemeli. 5) Renk verme garantisi yazılı olmalı. 6) Kuruma süresi (24–48 saat) net belirtilmeli. 7) Sigortalı işyeri ve aracı olmalı." },
      { h: "Bölgelere göre fiyat farkları", p: "Beşiktaş, Şişli, Kadıköy gibi merkezi ilçelerde fiyatlar %15–20 daha yüksektir. Sancaktepe, Esenyurt, Sultangazi gibi çevre ilçelerde ise daha rekabetçi fiyatlar bulunur. CleanLink üzerinden ilçe bazlı filtreleme yaparak bölgenizdeki firmaları karşılaştırabilirsiniz." },
    ],
    faq: [
      { q: "Halı yıkama ortalama ne kadar sürer?", a: "Standart bir halı yıkama işlemi yıkama + kuruma dahil 24–48 saat sürer. Yaz aylarında 24 saat yeterliyken kışın 48 saat tercih edilir." },
      { q: "İpek halıyı normal makineye atabilir miyim?", a: "Hayır. İpek halı sadece soğuk suda, nötr şampuanla, el yıkama yöntemiyle temizlenebilir. Yanlış yıkama halınızın değerini sıfırlar." },
      { q: "CleanLink üzerinden firma seçince ödeme nasıl?", a: "Pilot dönemde ödeme işlem sonunda doğrudan firmaya yapılır. Online ödeme ve 3 taksit altyapısı yakında devreye girecektir." },
    ],
  },
  {
    slug: "profesyonel-koltuk-yikama-nasil-yapilir",
    title: "Profesyonel Koltuk Yıkama Nasıl Yapılır? Adım Adım Süreç",
    category: "Koltuk Yıkama", postDate: "22 Nisan 2026", readTime: "4 dk",
    excerpt: "Mobil koltuk yıkama makineleri, kullanılan kimyasallar, kuruma süresi ve evde leke çıkarma ipuçları.",
    ctaLink: "/hizmet/istanbul/koltuk-yikama", ctaText: "Koltuk Yıkama Firmalarını Gör",
    body: [
      { h: "Adım 1: Ön inceleme ve fiyatlandırma", p: "Profesyonel firma evinize geldiğinde önce koltuk kumaşının türünü tespit eder (kadife, mikrofiber, deri, keten). Her kumaş türü için farklı kimyasal ve metot kullanılır." },
      { h: "Adım 2: Toz alma ve leke ön-işlem", p: "Endüstriyel toz emici ile yüzey temizlenir. Belirgin lekeler için (kahve, yağ, mürekkep) ön-işlem ürünleri uygulanır ve 5–10 dakika beklenir." },
      { h: "Adım 3: Sıcak su ekstraksiyon yıkama", p: "Profesyonel makine sıcak su ve özel şampuanı yüksek basınçla kumaşa püskürtür ve aynı anda emer. Bu yöntem hem yüzey hem derin kiri çıkarır. Akarlar ve mikropların çoğu bu aşamada yok edilir." },
      { h: "Adım 4: Durulama ve hızlı kuruma", p: "Şampuan kalıntısı durulanır, sonra yüksek devir vakumlama ile fazla nem alınır. Modern makineler %85 nemini emer, koltuk 4–6 saatte tamamen kurur." },
      { h: "Sökülebilir kumaş vs sabit kumaş farkı", p: "Sökülebilir kılıflı koltuklarda kılıflar çıkarılıp yıkanabilir; daha derin temizlik mümkündür. Sabit kumaşlarda yerinde yıkama yapılır, kuruma süresi biraz uzayabilir." },
    ],
    faq: [
      { q: "Koltuk kuruma ne kadar sürer?", a: "Profesyonel ekipman ile 4–6 saat. Açık pencere ve hava sirkülasyonu süreyi yarıya indirir." },
      { q: "Hamile veya bebek için zararlı mı?", a: "Sertifikalı, anti-alerjik ve hipoalerjenik şampuanlar kullanılır. Kuruma sonrası kullanımı tamamen güvenlidir." },
    ],
  },
  {
    slug: "yatak-yorgan-temizligi-akar-koruma",
    title: "Yatak ve Yorgan Temizliği Neden Önemli? Akar ve Alerjiye Karşı Korunma",
    category: "Yatak & Yorgan", postDate: "12 Nisan 2026", readTime: "5 dk",
    excerpt: "Yatakta biriken toz akarları, ter ve mikroplar yıllık sağlık risklerinin başında geliyor.",
    ctaLink: "/hizmet/istanbul/yatak-yorgan", ctaText: "Yatak Temizliği Firmaları",
    body: [
      { h: "Yatağınızda neler birikiyor?", p: "Bir kişi gecede 200–300 ml ter üretir; bu nem yatağın derinine işler. 6 ay temizlenmemiş yataklarda metrekarede 100.000+ toz akarı bulunur. Akar dışkısı astım, egzama ve kronik nezlenin başlıca tetikleyicisidir." },
      { h: "Profesyonel yatak yıkama nasıl yapılır?", p: "1) UV ışınla yüzey sterilizasyonu (akar yumurtaları yok edilir). 2) Endüstriyel HEPA vakum (yüzeyi 5 katmana kadar emer). 3) Anti-bakteriyel buharlı temizlik (60°C+). 4) Hipoalerjenik kuruma. Toplam 2–3 saat sürer." },
      { h: "Yorgan yıkama: 1 vs 2 kişilik", p: "Tek kişilik yorgan: 350–500 TL. Çift kişilik: 500–750 TL. Kuş tüyü ve elyaf dolgular için farklı yöntemler kullanılır; yıkanan yorgan dolgu dağılmadan teslim edilmelidir." },
      { h: "Ne sıklıkla yaptırmalı?", p: "Yatak: yılda 2 kez. Yorgan: yılda 1 kez (mevsim geçişinde). Bebek/çocuk yatakları: 3 ayda bir. Alerjisi olanlar: 2–3 ayda bir." },
    ],
    faq: [
      { q: "Yatakta uyumadan önce kuruması garanti mi?", a: "Evet, profesyonel ekipmanla 4–6 saat içinde kullanılabilir. Sabah yıkanan yatak akşam uyunabilir." },
      { q: "Akar gerçekten gözle görülmez mi?", a: "Doğru. Toz akarı 0.2 mm boyundadır ve sadece mikroskopla görülür. Varlığını alerji semptomları, yatakta nem ve sarımsı leke ile anlarsınız." },
    ],
  },
  {
    slug: "dogru-temizlik-firmasi-secimi",
    title: "Doğru Temizlik Firması Nasıl Seçilir? 9 Kontrol Adımı",
    category: "Rehber", postDate: "1 Nisan 2026", readTime: "7 dk",
    excerpt: "Onaylı kimlik, sigortalı çalışan, şeffaf fiyat, gerçek yorum… Sahte ilanlardan kaçınmak için kontrol listesi.",
    ctaLink: "/firmalar", ctaText: "Onaylı Firmaları İncele",
    body: [
      { h: "1) Vergi levhası ve ticari sicil", p: "Mutlaka istemeniz gereken ilk belge. CleanLink onaylı tüm firmalar bu kontrolden geçer. Ticari sicil belgesi, firmanın resmi olarak temizlik hizmeti verme yetkisi olduğunu gösterir." },
      { h: "2) Çalışan sigortası", p: "İşçi evinizde çalışırken bir kaza geçirirse sigortasız ise sorumluluk size düşebilir. Profesyonel firma çalışanlarının SGK kayıt numaralarını sunar." },
      { h: "3) Şeffaf fiyatlandırma", p: "İşten önce yazılı veya dijital fiyat teklifi alın. \"Sonra konuşuruz\" diyenlerden uzak durun. CleanLink üzerinden tüm fiyatlar peşinen görüntülenir." },
      { h: "4) Gerçek müşteri yorumları", p: "Sadece tamamlanmış sipariş üzerine yazılan yorumlar güvenilirdir. CleanLink'te sahte yorum imkânı yoktur — sadece sipariş veren müşteri yorum yazabilir." },
      { h: "5) Hasar tazmin garantisi", p: "Eşyanıza zarar gelirse firma kaç gün içinde nasıl tazmin edecek? Yazılı garanti şart. CleanLink'te firma standartları gereği bu garanti zorunludur." },
      { h: "6) Kullanılan ürünler", p: "Hangi marka kimyasal kullanıldığını sorun. \"Kendi karışımımız\" diyen firmadan kaçının. Hipoalerjenik, çocuk–evcil hayvan dostu sertifikalar olmalı." },
      { h: "7) İletişim sürekliliği", p: "İşten önce, sırasında ve sonrasında ulaşılabilir mi? CleanLink mesajlaşma sistemi tüm yazışmaları kayıt altında tutar." },
      { h: "8) Onaylı kimlik", p: "Firma sahibinin TC kimlik bilgisi ve adres doğrulaması yapılmış mı? CleanLink her firmayı bu süreçten geçirir." },
      { h: "9) İptal ve iade politikası", p: "Randevu öncesi 24 saat içinde ücretsiz iptal şart. Daha kısıtlı politika sunan firma şüpheli." },
    ],
    faq: [
      { q: "İlanda \"En ucuz\" yazan firma neden tehlikeli?", a: "Ucuz fiyat genelde sigortasız işçi, kalitesiz kimyasal ve garantisiz hizmet anlamına gelir. Eşya hasarı riskinin maliyeti çok daha yüksek olabilir." },
      { q: "CleanLink'te tüm firmalar onaylı mı?", a: "Evet. Yayına alınan her firma vergi levhası, ticari sicil ve kimlik kontrolünden geçer." },
    ],
  },
  {
    slug: "ev-temizliginde-dogal-urunler",
    title: "Ev Temizliğinde Doğal Ürünler — Karbonat, Sirke ve Limon Kullanımı",
    category: "Ev Temizliği", postDate: "20 Mart 2026", readTime: "5 dk",
    excerpt: "Mutfak yağ lekeleri, banyo kireci, leke çıkarma… Kimyasal yerine doğal alternatifler.",
    ctaLink: "/hizmet/istanbul/ev-temizligi", ctaText: "Ev Temizliği Firmaları",
    body: [
      { h: "Karbonat: Mutfağın gerçek dostu", p: "Yağ lekesi ve yanmış tencere için: 2 yemek kaşığı karbonat + sıcak su patlatın, 30 dakika bekleyin. Buzdolabı koku gidermek için açık kapta 1 fincan karbonat. Yanmış fırın için karbonat + birkaç damla sirke macun yapın, 1 saat bekletin." },
      { h: "Beyaz sirke: Kireç ve mikrop avcısı", p: "Banyo kireçleri için 1:1 sirke + su sprey ile uygulayın, 10 dakika bekletin. Çamaşır makinesi temizliği için 2 fincan sirke ile boş program. Cam temizliği için sirke + su spreyi tüllerin parlamasını sağlar. UYARI: Mermer, traverten gibi doğal taşlarda KULLANMAYIN — yüzey aşınır." },
      { h: "Limon: Doğal beyazlatıcı", p: "Mikrodalga temizliği için: bir tas suya yarım limon sıkın, 3 dakika çalıştırın, kapı buharla yumuşar. Bakır–pirinç eşya parlatma için limon + tuz ovma. Plastik kap leke çıkarma için limon suyu + güneşe bırakın." },
      { h: "Karıştırılmaması gereken ürünler", p: "Çamaşır suyu + sirke = klor gazı (zehirli). Karbonat + sirke uzun süre = etkisiz. Karbonat + amonyak = pozitif ama solunum tehlikeli. Doğal ürün dahi olsa karıştırma kuralı aynıdır." },
      { h: "Profesyonele ne zaman bırakmalı?", p: "Genel haftalık temizlik için doğal ürünler yeterli. Ancak halı–koltuk derin yıkama, akar temizliği, küf, derz–silikon, post-tadilat işleri için profesyonel ekipman ve özel kimyasallar gereklidir." },
    ],
    faq: [
      { q: "Doğal ürünler kimyasal kadar etkili mi?", a: "Yüzey temizliği için evet. Mikropların %99'u sirke + sıcak su ile ölür. Ancak hastane düzeyi sterilizasyon için tıbbi grade dezenfektan gerekir." },
      { q: "Bebek odasında ne kullanmalı?", a: "Sadece karbonat + saf su + sirke. Parfümlü hiçbir ürün kullanmayın." },
    ],
  },
];

const POST_BY_SLUG: Record<string, FullPost> = Object.fromEntries(POSTS.map(p => [p.slug, p]));

function dbPostToFullPost(p: Awaited<ReturnType<typeof apiGetBlogPostBySlug>>): FullPost | null {
  if (!p || !p.slug) return null;
  return {
    slug: p.slug,
    title: p.title,
    category: p.category,
    postDate: p.postDate,
    readTime: p.readTime,
    excerpt: p.excerpt,
    ctaLink: "/firmalar",
    ctaText: "Onaylı Firmaları İncele",
    body: (p.content ?? []) as { h: string; p: string }[],
    faq: (p.faq ?? []) as { q: string; a: string }[],
  };
}

export default function BlogPost() {
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug ?? "";
  const staticPost = POST_BY_SLUG[slug];
  const [post, setPost] = useState<FullPost | null>(staticPost ?? null);
  const [loadingDb, setLoadingDb] = useState(!staticPost);

  useEffect(() => {
    if (staticPost) { setPost(staticPost); return; }
    setLoadingDb(true);
    apiGetBlogPostBySlug(slug)
      .then(dbPost => { const p = dbPostToFullPost(dbPost); if (p) setPost(p); })
      .finally(() => setLoadingDb(false));
  }, [slug, staticPost]);

  useSEO({
    title: post ? post.title : "Yazı bulunamadı | CleanLink Blog",
    description: post?.excerpt ?? "Aradığınız blog yazısı bulunamadı.",
    canonical: `/blog/${slug}`,
    ogType: "article",
    ogImage: post?.coverImage,
  });

  useEffect(() => {
    if (!post) return;
    const article = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      datePublished: post.postDate,
      author: { "@type": "Organization", name: "CleanLink" },
      publisher: { "@type": "Organization", name: "CleanLink", url: BASE_URL },
      mainEntityOfPage: `${BASE_URL}/blog/${post.slug}`,
      articleSection: post.category,
      description: post.excerpt,
    };
    const faq = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: post.faq.map(f => ({
        "@type": "Question", name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    };
    const tag1 = document.createElement("script");
    tag1.type = "application/ld+json";
    tag1.id = "blog-article-jsonld";
    tag1.text = JSON.stringify(article);
    const tag2 = document.createElement("script");
    tag2.type = "application/ld+json";
    tag2.id = "blog-faq-jsonld";
    tag2.text = JSON.stringify(faq);
    document.head.appendChild(tag1);
    document.head.appendChild(tag2);
    return () => { tag1.remove(); tag2.remove(); };
  }, [post]);

  if (loadingDb) {
    return (
      <PageLayout breadcrumbs={[{ label: "Blog", href: "/blog" }, { label: "Yükleniyor..." }]}>
        <div className="max-w-2xl mx-auto text-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Yazı yükleniyor...</p>
        </div>
      </PageLayout>
    );
  }

  if (!post) {
    return (
      <PageLayout breadcrumbs={[{ label: "Blog", href: "/blog" }, { label: "Yazı bulunamadı" }]}>
        <div className="max-w-2xl mx-auto text-center py-20">
          <h1 className="text-3xl font-bold mb-4">Yazı bulunamadı</h1>
          <Link href="/blog" className="text-primary font-semibold inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Blog'a dön
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout breadcrumbs={[{ label: "Blog", href: "/blog" }, { label: post.title }]}>
      <article className="max-w-3xl mx-auto">
        <Link href="/blog" className="text-sm text-muted-foreground inline-flex items-center gap-1 mb-6 hover:text-primary">
          <ArrowLeft className="w-4 h-4" /> Tüm yazılar
        </Link>

        <div className="flex items-center gap-3 mb-4 flex-wrap text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full font-semibold uppercase tracking-wide">
            <Tag className="w-3 h-3" /> {post.category}
          </span>
          <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {post.readTime} okuma</span>
          <span>·</span>
          <span>{post.postDate}</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground leading-tight mb-4">
          {post.title}
        </h1>
        <p className="text-lg text-muted-foreground mb-10">{post.excerpt}</p>

        <div className="space-y-8 mb-12">
          {post.body.map(sec => (
            <section key={sec.h}>
              <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-3">{sec.h}</h2>
              <p className="text-foreground/80 leading-relaxed">{sec.p}</p>
            </section>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-primary/10 to-teal-50 rounded-2xl border border-primary/20 p-6 md:p-8 mb-12 text-center">
          <BookOpen className="w-8 h-8 text-primary mx-auto mb-3" />
          <h3 className="text-lg font-display font-bold mb-2">Hizmeti hemen rezerve edin</h3>
          <p className="text-sm text-muted-foreground mb-5">Bu rehberde anlatılan hizmeti CleanLink onaylı firmalardan alın.</p>
          <Link href={post.ctaLink} className="inline-block px-6 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90">
            {post.ctaText}
          </Link>
        </div>

        {/* FAQ */}
        <section className="border-t border-border pt-10 mb-12">
          <h2 className="text-2xl font-display font-bold mb-6">Sıkça Sorulan Sorular</h2>
          <div className="space-y-5">
            {post.faq.map(f => (
              <div key={f.q}>
                <p className="font-semibold text-foreground">{f.q}</p>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="text-center text-sm text-muted-foreground border-t border-border pt-8">
          <Link href="/blog" className="text-primary font-semibold inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Tüm rehberleri gör
          </Link>
        </div>
      </article>
    </PageLayout>
  );
}

export { POSTS as ALL_BLOG_POSTS };
