# CleanLink — Çalışma Günlüğü

## 📅 13 Mayıs 2026

---

## 1. Blog Sistemi (Tam WordPress Gibi)

### Ne Yapıldı?
Siteye tamamen çalışan bir blog sistemi kuruldu. Admin panelinden yazı yazılabiliyor, yayınlanabiliyor ve ziyaretçiler tarafından okunabiliyor.

### Detaylar:
- **Veritabanına yeni alanlar eklendi:** Her blog yazısı artık benzersiz bir URL (slug), içerik bölümleri, SSS (soru-cevap) ve yayın durumu bilgisi taşıyor.
- **3 yeni API endpoint:** Yayındaki yazıları listele, tüm yazıları listele (sadece admin), slug ile tekil yazı getir.
- **Admin Yazı Editörü yenilendi:**
  - Başlık yazınca URL otomatik oluşuyor (örn. `istanbul-hali-yikama-fiyatlari-2026`)
  - "Yayınla / Taslak" toggle'ı ile yayın kontrolü
  - Bölüm ekleyici (başlık + paragraf çiftleri)
  - SSS ekleyici (soru + cevap çiftleri)
- **Blog detay sayfası:** Veritabanından yeni yazı eklenince anında blog listesinde ve detay sayfasında görünüyor. Statik yazılar yedek olarak korundu.

---

## 2. Firmalar Sayfası Temizliği

### Ne Yapıldı?
Test amaçlı oluşturulan sahte (mock) firmalar, gerçek kayıtlı firmalarla çakışmaması için düzenlendi.

### Detaylar:
- **Kaldırılanlar:** "Cleanlink Temizlik" ve "Elitplus+ Koltuk Yıkama" adlı test firmaları AllVendors, FeaturedCompanies ve SmartCalculator sayfalarından çıkarıldı.
- **Sonuç:** Tüm Firmalar sayfasında yalnızca gerçek DB firmaları göründü: "Elit Plus+ Temizlik" ve "Gün Temizlik Hizmetleri".

---

## 3. Ana Sayfa Carousel (Öne Çıkan Firmalar) Düzeltmesi

### Ne Yapıldı?
Ana sayfadaki firma carousel'i yalnızca 1 firmayı 4-6 kez tekrarlıyordu. Bu sorun giderildi ve tüm firmalar geri getirildi.

### Detaylar:
- **"Cleanlink Temizlik"** ve **"Elitplus+ Koltuk Yıkama"** pilot firmalar olarak carousel'e geri eklendi.
- **"Elit Plus+ Temizlik"** (veritabanında kayıtlı gerçek firma) da artık carousel'de görünüyor.
- **Tekrar sorunu çözüldü:** Eski sistem 1 firmayı 6 kez dolduruyordu. Yeni sistem her firmayı yalnızca 1 kez gösteriyor, döngü sorunsuz dönüyor.
- **Toplam:** Carousel'de şu anda 4 farklı firma var — her biri döngüde 1 kez görünüyor.

---

## 4. Tüm Firmalar Sayfası — Yeni Kart Tasarımı ve Sıralama

### Ne Yapıldı?
"Tüm Firmalar" sayfasındaki firma kartları, ana sayfadaki zengin kart tasarımıyla aynı hale getirildi. Sıralama da Elit / CRM / Standart olarak yeniden düzenlendi.

### Detaylar:
- **Kart tasarımı:** Artık her kart şunları içeriyor:
  - Üstte degrade renk şerit (fotoğraf varsa gerçek fotoğraf gösteriliyor)
  - Sağ üstte rozet: ★ Elit, ✦ CRM Üye veya 🚀 Pilot Firma
  - Firma adı, konum, "Doğa Dostu" / "Pati Seçeneği" rozetleri
  - Yıldız puanı, değerlendirme sayısı, tamamlanan iş sayısı
  - Hizmet etiketleri
  - Fiyat göstergesi (üye olmayanlar için kilitli görüntü)
  - **"Profil ve Fiyatlar"** butonu → popup kart açılıyor
  - **"Tam sayfa profili aç →"** linki → firmanın tam sayfasına gidiyor
- **Sıralama:** Elit (sponsorlu) firmaların üstte, CRM üyelerinin ortada, Pilot/Standart firmaların en altta görünmesi sağlandı.
- **Pilot firmalar geri geldi:** "Cleanlink Temizlik" ve "Elitplus+ Koltuk Yıkama" Tüm Firmalar sayfasında da listeleniyor.
- **Toplam:** 4 firma gösteriliyor.

---

## 5. SEO ve Performans İyileştirmeleri

### Ne Yapıldı?
Sitenin arama motorlarında ve sosyal medyada daha iyi görünmesi için kapsamlı iyileştirmeler yapıldı.

---

### 5.1 Dinamik Meta Etiketleri (Her Sayfa İçin Ayrı)

Her sayfa artık Google ve sosyal medya için kendi başlık, açıklama ve görselini taşıyor:

| Sayfa | Başlık | Görsel |
|---|---|---|
| Ana Sayfa | Genel CleanLink başlığı | Standart OG görseli |
| Firma Profili | Firma adı + bölge | **Firmanın kendi galerisi** |
| Blog Yazısı | Yazının başlığı | **Yazının kapak görseli** |
| Pilot Şartları | Program başlığı | Standart OG görseli |
| Tüm Firmalar | "Temizlik Firmaları — Onaylı Profesyoneller" | Standart OG görseli |

---

### 5.2 Open Graph — Sosyal Medya Önizlemesi

WhatsApp, Twitter/X, LinkedIn ve Facebook'ta paylaşıldığında her sayfanın doğru başlık, açıklama ve kapak görseli çıkıyor. Eksik alanlar (`og:image:width`, `og:image:height`, `og:locale`, `og:site_name`) tamamlandı.

Blog yazıları `article` türü olarak işaretlendi — Google bu farkı anlıyor ve içeriği haber/makale olarak değerlendiriyor.

---

### 5.3 Görsel Optimizasyonu — WebP + Lazy Loading

**PNG → WebP dönüşümü:**

| Görsel | PNG Boyutu | WebP Boyutu | Tasarruf |
|---|---|---|---|
| hero-cleaning | 1.2 MB | 56 KB | **%95 küçültme** |
| company-2 | 624 KB | 23 KB | **%96 küçültme** |
| company-1 | 328 KB | 23 KB | **%93 küçültme** |
| company-3 | 306 KB | 17 KB | **%94 küçültme** |

**Lazy Loading:** Tüm görsellere `loading="lazy"` eklendi. Yani sayfada görünmeyen görseller yüklenmeden bekleniyor, sayfa ilk açılışta daha hızlı çalışıyor. Bu özellikle Google'ın "LCP" (En Büyük İçerik Yükleme Süresi) skorunu iyileştiriyor.

---

### 5.4 robots.txt — Bot Erişimi

Arama motoru botları için erişim kuralları genişletildi:
- Googlebot, Bingbot, Applebot ayrı ayrı tanımlandı
- WhatsApp, Facebook, Twitter, LinkedIn botları tam erişime izin veriyor
- Admin paneli, firma paneli ve şifre sıfırlama sayfaları botlardan gizlendi

---

### 5.5 Sitemap.xml — Google'a Sayfa Haritası

Sitemap 9 URL'den **20+ URL'ye** genişletildi. Yeni eklenenler:
- 5 blog yazısı URL'si
- 4 firma profil sayfası
- 5 hizmet-şehir sayfası (İstanbul ev temizliği, koltuk yıkama, halı yıkama vb.)
- Her URL için son güncelleme tarihi ve öncelik puanı belirlendi

---

### 5.6 Yapısal Veri (JSON-LD Schema)

Google'ın sitenizi daha iyi anlaması için schema verileri eklendi/güçlendirildi:
- **Firma profil sayfaları:** `LocalBusiness` şeması — firma adı, bölge, değerlendirme puanı, hizmet alanı
- **Blog yazıları:** `Article` şeması + `FAQPage` şeması (SSS bölümleri için)
- **Pilot Şartları sayfası:** `Service` + `Offer` şeması — abonelik fiyatı dahil
- **Ana sayfa:** `Organization`, `HomeAndConstructionBusiness`, `WebSite + SearchAction` şemaları

---

## Özet Tablo — 13 Mayıs 2026

| # | Yapılan İş | Durum |
|---|---|---|
| 1 | Blog sistemi (DB + Admin editör + detay sayfası) | ✅ Tamamlandı |
| 2 | Mock firma temizliği | ✅ Tamamlandı |
| 3 | Ana sayfa carousel — tekrar sorunu giderildi | ✅ Tamamlandı |
| 4 | Tüm Firmalar — zengin kart + sıralama + modal | ✅ Tamamlandı |
| 5 | Dinamik meta etiketleri (her sayfa için) | ✅ Tamamlandı |
| 6 | Open Graph — sosyal medya önizlemesi | ✅ Tamamlandı |
| 7 | PNG → WebP dönüşümü (%93-96 boyut küçültme) | ✅ Tamamlandı |
| 8 | Lazy loading tüm görsellere eklendi | ✅ Tamamlandı |
| 9 | robots.txt — bot erişim kuralları | ✅ Tamamlandı |
| 10 | sitemap.xml — 20+ sayfa, blog + firma profilleri | ✅ Tamamlandı |
| 11 | JSON-LD yapısal veri (blog, firma, pilot, ana sayfa) | ✅ Tamamlandı |

---

## 📅 14 Mayıs 2026

---

## 6. Proje Veri Dosyaları Oluşturuldu

### Ne Yapıldı?
Projenin tüm verilerini tek bir yerde toplayacak referans dosyaları oluşturuldu.

### Detaylar:
- **`çalışma-dosyası.md`** oluşturuldu: Hesaplar, mimari, DB tabloları, API endpoint'leri, SEO durumu, abonelik paketleri, yapılacaklar listesi — tüm proje bilgileri tek dosyada.
- İlk denemede dosya adı yanlış (`çalışma-dostası.md`) oluşturuldu, kullanıcı uyarısı üzerine `çalışma-dosyası.md` olarak düzeltildi.

---

## 7. OpenGraph & Sosyal Medya Bot Uyumluluğu — Kapsamlı İyileştirme

### Ne Yapıldı?
5 ayrı teknik düzenleme ile sosyal medya botlarının (Facebook, WhatsApp, LinkedIn, Twitter vb.) sitenin içeriğini daha iyi okuması sağlandı.

---

### 7.1 react-helmet-async Entegrasyonu

**Dosyalar:** `src/context/SEOContext.tsx` (yeni), `src/hooks/useSEO.ts`, `src/main.tsx`, `src/App.tsx`

- `SEOContext.tsx` oluşturuldu: Tüm OG meta etiketlerini yöneten merkezi bir React context + Helmet bileşeni.
- `HelmetProvider` → `main.tsx`'e eklendi.
- `SEOProvider` → `App.tsx`'e eklendi (tüm uygulamayı sarıyor).
- `useSEO` hook'u artık hem DOM manipülasyonu hem de Helmet context'ini aynı anda güncelliyor.
- OG görsel boyutu `1280×720` → `1200×630` olarak düzeltildi (Facebook/WhatsApp standardı).

---

### 7.2 Sayfa Bazlı OG Görselleri — 1200×630 px

**Dosyalar:** `public/opengraph-1200.png`, `public/og-pilot.png`, `pages/PilotSartlari.tsx`, `index.html`

- AI ile 2 adet profesyonel OG banner görseli üretildi (16:9 oran, ~700-850 KB):
  - `/opengraph-1200.png` → Ana sayfa için teal/turkuaz tasarımlı banner
  - `/og-pilot.png` → Pilot Şartları sayfası için roket ikonlu özel banner
- `PilotSartlari.tsx`'te `ogImage` güncellendi: artık ana sayfa görseli değil kendi özel görseli kullanılıyor.
- `index.html` statik OG boyutları düzeltildi.

---

### 7.3 robots.txt — Bot Optimizasyonu

**Dosya:** `public/robots.txt`

Yeni eklenen bot tanımları:

| Bot | Amaç |
|-----|------|
| DuckDuckBot | DuckDuckGo arama motoru |
| Slurp | Yahoo arama motoru |
| Baiduspider | Çin arama motoru |
| YandexBot | Rus arama motoru |
| Discordbot | Discord önizlemesi |
| Telegrambot | Telegram önizlemesi |
| Pinterest | Pinterest önizlemesi |
| vkShare | VKontakte önizlemesi |
| Slackbot | Slack önizlemesi |
| SkypeUriPreview | Skype önizlemesi |

OG görselleri (`opengraph.jpg`, `opengraph-1200.png`, `og-pilot.png`) tüm botlar için `Allow:` ile güvenceye alındı.

---

### 7.4 Audit Log Entegrasyonu — IP + Zaman Damgası

**Dosyalar:** `api-server/src/routes/og-audit.ts` (yeni), `api-server/src/routes/index.ts`

- `POST /api/og-audit` endpoint'i oluşturuldu.
- `useSEO` hook'u her sayfa render edildiğinde bu endpoint'i `keepalive: true` ile çağırıyor.
- Sunucu loglarına şunlar yazılıyor: `type: og-audit`, `ip`, `ts` (zaman damgası), `page` (URL), `title`, `description` (ilk 100 karakter), `image`.
- Test: `HTTP 204` ✅

**Örnek log çıktısı:**
```json
{
  "type": "og-audit",
  "ip": "::1",
  "ts": "2026-05-14T00:15:17.947Z",
  "page": "https://cleanlinktr.com/",
  "title": "CleanLink — Profesyonel Ev, Ofis, Koltuk ve Halı Temizliği",
  "description": "CleanLink ile eviniz, ofisiniz...",
  "image": "https://cleanlinktr.com/opengraph.jpg"
}
```

---

### 7.5 Bot Middleware — Express Header Yapılandırması

**Dosya:** `api-server/src/app.ts`

Express'e sosyal medya bot tespiti için middleware eklendi. 18 farklı bot user-agent tanımlandı:

```
facebookexternalhit, facebot, twitterbot, linkedinbot, whatsapp,
slurp, duckduckbot, applebot, discordbot, telegrambot, skypeuri,
pinterest, vkshare, w3c_validator, baiduspider, yandexbot, msnbot
```

Bot tespit edildiğinde otomatik olarak gönderilen header'lar:

| Header | Değer | Etki |
|--------|-------|------|
| `Vary: User-Agent` | — | CDN'e "UA'ya göre farklı yanıt ver" sinyali |
| `Cache-Control: no-store` | — | Cloudflare'in eski/challenge sayfasını cache'lememesi |
| `X-Robots-Tag: index, follow` | — | Bota doğrudan indekslenebilirlik sinyali |

Test çıktısı (`facebookexternalhit` UA ile istek):
```
Vary: User-Agent          ✅
Cache-Control: no-store   ✅
X-Robots-Tag: index,follow ✅
```

---

---

## 7. Gün Temizlik Hizmetleri — Galeri & Sertifika Kurtarma

### Ne Yapıldı?

Production DB'de `vendor_profiles id=1` için `gallery_urls=[]` ve `cert_urls=[]` boştu — canlı sitede firma profili görselsiz ve belgesizsiz görünüyordu.

### Yapılan Adımlar

1. **Dev DB'den veri çekildi** — `gallery_urls[0]` (base64 JPEG, 72KB) ve `cert_urls[0]` (base64 PDF, 3.1MB) Node.js pg modülüyle okundu.
2. **Statik dosyalar oluşturuldu:**
   - `artifacts/cleanlink/public/firmalar/gun-temizlik/galeri-1.jpg` (72KB)
   - `artifacts/cleanlink/public/firmalar/gun-temizlik/gun-hali-yikama-temizlik.pdf` (3.1MB)
3. **Dev DB güncellendi** — `gallery_urls` ve `cert_urls` artık base64 değil dosya URL'i içeriyor:
   - Gallery: `["/firmalar/gun-temizlik/galeri-1.jpg"]`
   - Cert: `[{"name":"GÜN HALI YIKAMA & TEMİZLİK .pdf","fileType":"pdf","url":"/firmalar/gun-temizlik/..."}]`
4. **Admin endpoint eklendi** — `PATCH /api/admin/vendors/:id/media` (admin kimlik doğrulama gerekli)
5. **Startup seed eklendi** — API server başlarken `vendor_profiles id=1`'in gallery/cert alanları boşsa otomatik file URL'leriyle doldurur (`index.ts` içinde `seedVendorOneMedia()`). Production'a deploy edildiğinde kendiliğinden düzelecek.
6. **Dev'de doğrulandı** — `/firmalar` sayfasında Gün Temizlik kartında "1 fotoğraf" ibaresi görünüyor ✅

### Sonuç

- Dev sunucu: galeri görsel + PDF sertifika çalışıyor ✅
- Production: **deploy sonrası startup seed otomatik düzeltecek** ✅
- Artık base64 veri DB'de tutulmuyor — statik dosya URL'leri kullanılıyor (performans artışı)

---

## Özet Tablo — 14 Mayıs 2026

| # | Yapılan İş | Durum |
|---|---|---|
| 1 | `çalışma-dosyası.md` proje veri dosyası oluşturuldu | ✅ Tamamlandı |
| 2 | react-helmet-async — SEOContext + HelmetProvider entegrasyonu | ✅ Tamamlandı |
| 3 | OG görselleri 1200×630 px (homepage + pilot sayfa) | ✅ Tamamlandı |
| 4 | robots.txt — 10 yeni bot eklendi, OG görselleri izne alındı | ✅ Tamamlandı |
| 5 | Audit Log — `/api/og-audit` endpoint, IP + zaman damgası | ✅ Tamamlandı |
| 6 | Bot middleware — 18 bot UA tespiti, 3 özel header | ✅ Tamamlandı |
| 7 | Gün Temizlik galeri/sertifika kurtarma — statik dosyalar + startup seed | ✅ Tamamlandı |
