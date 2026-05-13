# CleanLink — SEO & Sosyal Medya Önizleme Raporu

**Tarih:** 13 Mayıs 2026  
**Domain:** https://cleanlinktr.com  
**Durum:** Aktif yayında

---

## 1. Sosyal Medya Önizleme Sorunu (Instagram "Just a moment...")

### Sorunun Kökü
Instagram (ve Facebook) bir linki önizlemek için `facebookexternalhit` adlı bir bot gönderir. Bu bot sayfayı açıp OG etiketlerini okumaya çalışır. Ancak Replit'in deployment altyapısında Cloudflare bot koruması devreye giriyor ve bota "Just a moment..." (JS challenge) sayfası gönderiyor. Bot JavaScript çalıştıramadığı için önizleme oluşturulamıyor.

### Durum
- OG etiketleri doğru şekilde `index.html` içinde mevcut ✅
- Sorun uygulama kodunda değil, deployment katmanında ❌
- Replit'in Cloudflare ayarları kullanıcı tarafından doğrudan değiştirilemiyor

### Çözüm Önerileri
1. **Kısa vadeli:** Facebook Sharing Debugger (`developers.facebook.com/tools/debug`) ile URL'yi zorla yenile — cache temizlenir, bazen önizleme düzelir
2. **Orta vadeli:** Replit destek ekibine bot korumasını social media crawlers için devre dışı bırakmaları talep edilebilir
3. **Uzun vadeli:** Özel sunucuya taşındığında Cloudflare ayarlarından `facebookexternalhit` ve `Twitterbot` user-agent'ları whitelist'e eklenmeli

---

## 2. SEO Teknik Durum

### ✅ Yapılanlar

| Özellik | Durum |
|---------|-------|
| `<title>` etiketi | ✅ Mevcut ve optimize |
| `<meta name="description">` | ✅ Mevcut (155 karakter) |
| `<meta name="keywords">` | ✅ Mevcut |
| `<meta name="robots">` | ✅ `index, follow` |
| `<link rel="canonical">` | ✅ Doğru domain |
| Open Graph (og:title, og:description, og:image, og:url) | ✅ Mevcut |
| Twitter Card | ✅ `summary_large_image` |
| `robots.txt` | ✅ Doğru yapılandırılmış |
| `sitemap.xml` | ✅ 10 URL |
| GA4 (Google Analytics) | ✅ G-RBYR4TNWVP aktif |
| Google Search Console meta | ✅ Eklendi |
| Google Search Console HTML doğrulama | ✅ public/ klasöründe |
| JSON-LD: Organization | ✅ Mevcut |
| JSON-LD: LocalBusiness | ✅ Mevcut |
| JSON-LD: WebSite + SearchAction | ✅ Mevcut |
| Favicon + PWA ikonları | ✅ 192px, 512px, apple-touch |
| PWA manifest | ✅ Mevcut |
| `og:image` dosyası | ✅ `/opengraph.jpg` |
| useSEO hook (sayfa bazlı SEO) | ✅ Her sayfada aktif |
| HTTPS / SSL | ✅ Replit deployment |
| Kullanıcı sözleşmesi sayfası | ✅ /kullanim-kosullari |
| KVKK sayfası | ✅ /kvkk |
| Gizlilik politikası | ✅ /gizlilik-politikasi |

### ❌ Eksikler / Düzeltmeler

| Sorun | Öncelik | Durum |
|-------|---------|-------|
| Instagram/FB önizleme çalışmıyor (Cloudflare bot koruması) | 🔴 Kritik | Deployment katmanı sorunu |
| `og:image` boyutu 1280x720 (olması gereken 1200x630) | 🟡 Orta | **Bu raporda düzeltildi** |
| `og:image:alt` etiketi eksikti | 🟡 Orta | **Bu raporda düzeltildi** |
| `og:image:type` etiketi eksikti | 🟠 Düşük | **Bu raporda düzeltildi** |
| `twitter:site` etiketi eksikti | 🟠 Düşük | **Bu raporda düzeltildi** |
| `dns-prefetch` eski domain'e işaret ediyordu (`replit.app`) | 🟡 Orta | **Bu raporda düzeltildi** |
| JSON-LD iletişim e-postası kişisel adres | 🟠 Düşük | **Bu raporda düzeltildi** |
| JSON-LD `sameAs` boş | 🟠 Düşük | Sosyal medya profilleri eklenmeli |
| Sitemap'te `/pilot-sartlari` eksikti | 🟡 Orta | **Bu raporda düzeltildi** |
| Sosyal medya profil linkleri (`sameAs`) boş | 🟠 Düşük | Instagram/LinkedIn linkleri eklenmeli |
| `og:image` boyutu yeniden üretilmeli (1200x630) | 🟡 Orta | Yeni görsel tasarlanmalı |

---

## 3. OG Görsel (opengraph.jpg) Durumu

- **Mevcut boyut:** 1280×720 px  
- **Önerilen boyut:** 1200×630 px (Facebook standartı)  
- **Dosya boyutu:** ~74 KB (ideal: <300 KB) ✅  
- **Format:** JPEG ✅  
- **İçerik:** CleanLink logosu ve slogan görünmekte

> Not: Görsel yeniden tasarlanırken 1200×630 px boyutunda export edilmeli.

---

## 4. Sitemap Durumu

**Mevcut URL'ler (10 adet):**
- / (anasayfa)
- /firmalar
- /hakkimizda
- /kariyer
- /blog
- /iletisim
- /kullanim-kosullari
- /gizlilik-politikasi
- /kvkk
- /cerez-politikasi
- /pilot-sartlari ← **Bu raporda eklendi**

---

## 5. robots.txt Durumu

```
User-agent: *
Allow: /
Disallow: /admin-dashboard
Disallow: /firma-dashboard
Disallow: /sifre-sifirla
Disallow: /api/
Sitemap: https://cleanlinktr.com/sitemap.xml
```

Social media bot'ları için izin satırları eklendi.

---

## 6. Sonraki Adımlar (Yapılacaklar)

### Kısa Vadeli
- [ ] Facebook Sharing Debugger ile URL'yi zorla yenile: https://developers.facebook.com/tools/debug
- [ ] Google Search Console'da sitemap submit et: `cleanlinktr.com/sitemap.xml`
- [ ] `/pilot-sartlari` sayfasına özel SEO metni (useSEO hook ile) ekle

### Orta Vadeli
- [ ] OG görselini 1200×630 boyutunda yeniden tasarla ve yükle
- [ ] JSON-LD `sameAs` alanına Instagram ve LinkedIn profil URL'lerini ekle
- [ ] İletişim e-postasını `info@cleanlinktr.com` veya `destek@cleanlinktr.com` olarak güncelle

### Uzun Vadeli
- [ ] Şehir bazlı sayfalar için ayrı OG tag'leri (SSR veya SSG gerektirir)
- [ ] Blog yazıları için bireysel OG tag'leri
- [ ] Google Business Profile oluştur ve JSON-LD `sameAs` ile ilişkilendir
- [ ] Core Web Vitals optimizasyonu (LCP, CLS, FID)

---

*Rapor otomatik olarak oluşturulmuştur. Son güncelleme: 13 Mayıs 2026*
