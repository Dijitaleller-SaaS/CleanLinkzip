# CleanLink — Çalışma Dostası 📋
> Bu dosya projenin tüm kritik verilerini, hesapları, yapı bilgilerini ve notları içerir.
> Her yeni oturumda buraya bakarak nerede kaldığımızı hatırlıyoruz.

---

## 🌐 Site Bilgileri

| | |
|---|---|
| **Canlı Domain** | https://cleanlinktr.com |
| **Dev (Frontend)** | http://localhost:5000 |
| **Dev (API)** | http://localhost:8080 |
| **Google Analytics** | G-RBYR4TNWVP |
| **Google Search Console** | Doğrulanmış ✅ |
| **Instagram** | @cleanlinktr |

---

## 🔐 Hesaplar ve Giriş Bilgileri

### Admin Hesapları

| E-posta | Giriş Yöntemi | Not |
|---------|--------------|-----|
| serkan@dijitaleller.com | E-posta + Şifre | Birincil admin |
| serkcel@gmail.com | Google ile Giriş | İkincil admin |

> Admin paneline giriş: Sağ üstten "Giriş Yap" → e-posta ile giriş → `/admin-dashboard` sayfası görünür.

### Kayıtlı Firma Hesapları (Veritabanı)

| E-posta | Firma Adı | Kayıt Yöntemi | DB ID |
|---------|-----------|--------------|-------|
| gunkoltukyikama@gmail.com | Gün Temizlik Hizmetleri | E-posta | id=1 |
| tariktingiroglu37@gmail.com | Elit Plus+ Temizlik | Google | id=2 |

### Pilot (Mock) Firmalar — Kodda Tanımlı

Bu firmalar veritabanında değil, kod içinde tanımlı gösterim amaçlı firmalardır:

| Firma Adı | Bulunduğu Yer | Açıklama |
|-----------|--------------|---------|
| Cleanlink Temizlik | FeaturedCompanies + AllVendors | Pilot gösterim firması — İstanbul/Beşiktaş |
| Elitplus+ Koltuk Yıkama | FeaturedCompanies + AllVendors | Pilot gösterim firması — İstanbul/Gaziosmanpaşa |

---

## 🏗️ Proje Mimarisi

```
cleanlink/                          ← Monorepo kökü
├── artifacts/
│   ├── cleanlink/                  ← Frontend (React + Vite) — Port 5000
│   │   ├── src/
│   │   │   ├── pages/              ← Sayfalar
│   │   │   ├── components/         ← Bileşenler
│   │   │   ├── context/AppContext  ← Global state, kullanıcı, vendor listesi
│   │   │   ├── hooks/useSEO.ts     ← SEO meta yönetimi
│   │   │   └── lib/api.ts          ← API çağrıları
│   │   └── public/                 ← Statik dosyalar (robots, sitemap, OG görseli)
│   └── api-server/                 ← Backend (Express) — Port 8080
│       └── src/
│           ├── routes/             ← API endpoint'leri
│           ├── lib/auth.ts         ← JWT doğrulama
│           └── app.ts              ← Express başlangıcı
└── lib/db/                         ← Veritabanı (Drizzle ORM + PostgreSQL)
    └── src/schema/index.ts         ← Tüm tablo tanımları
```

---

## 🗄️ Veritabanı Tabloları

| Tablo | Ne İçin |
|-------|---------|
| `vendors` | Kayıtlı temizlik firmaları |
| `users` | Tüm kullanıcılar (müşteri + firma + admin) |
| `orders` | Siparişler |
| `reviews` | Firma değerlendirmeleri |
| `notifications` | Bildirimler |
| `cms_blog_posts` | Blog yazıları (slug, content, faq, published) |
| `cms_pages` | CMS sayfaları |
| `coupons` | İndirim kuponları |
| `pilot_applications` | Pilot başvuruları |
| `bayi` | Bayi hesapları |

### Vendor (Firma) Tablo Alanları — Önemli Olanlar

| Alan | Anlamı |
|------|--------|
| `isPublished` | Sitede görünür mü? |
| `isSubscribed` | Aboneliği aktif mi? |
| `isSponsor` | Öne çıkan (Elit) mi? |
| `subscriptionPending` | Havale bekliyor mu? |
| `yayinaGirisTarihi` | Abonelik başlangıç tarihi |
| `galleryUrls` | Galeri fotoğrafları |
| `prices` | Hizmet fiyatları |
| `serviceScopes` | Hizmet kapsamları |

---

## 📄 Sayfalar ve URL'ler

| Sayfa | URL | Açıklama |
|-------|-----|---------|
| Ana Sayfa | `/` | Hero, carousel, nasıl çalışır |
| Tüm Firmalar | `/firmalar` | Tüm kayıtlı + pilot firmalar |
| Firma Profili | `/firma/:slug` | Tekil firma tam sayfa |
| Blog Listesi | `/blog` | Blog yazıları |
| Blog Yazısı | `/blog/:slug` | Tekil yazı detay |
| Pilot Şartları | `/pilot-sartlari` | Firma başvuru ve abonelik bilgisi |
| Hakkımızda | `/hakkimizda` | — |
| İletişim | `/iletisim` | — |
| Kariyer | `/kariyer` | — |
| Şifre Sıfırla | `/sifre-sifirla` | — |
| Hizmet-Şehir | `/:sehir-:hizmet` | SEO sayfaları (istanbul-ev-temizligi vb.) |
| **Admin Paneli** | `/admin-dashboard` | Sadece admin e-postalarıyla erişilir |
| **Firma Paneli** | `/firma-dashboard` | Sadece firma hesabıyla erişilir |

---

## 🔌 API Endpoint'leri

### Auth
| Endpoint | Metod | Açıklama |
|----------|-------|---------|
| `/api/auth/register` | POST | Kayıt ol |
| `/api/auth/login` | POST | Giriş yap |
| `/api/auth/google` | GET | Google OAuth başlat |
| `/api/auth/google/callback` | GET | Google OAuth callback |
| `/api/auth/me` | GET | Oturum bilgisi |

### Vendors
| Endpoint | Metod | Açıklama |
|----------|-------|---------|
| `/api/vendors` | GET | Tüm yayındaki firmalar |
| `/api/vendors/me` | GET/PUT | Kendi firma profilim |
| `/api/vendors/havale` | POST | Havale bildirimi |

### Blog (CMS)
| Endpoint | Metod | Yetki | Açıklama |
|----------|-------|-------|---------|
| `/api/cms/blog` | GET | Public | Yayındaki yazılar |
| `/api/cms/blog/all` | GET | Admin | Tüm yazılar (taslak dahil) |
| `/api/cms/blog/:slug` | GET | Public | Slug ile tekil yazı |
| `/api/cms/blog` | POST | Admin | Yeni yazı ekle |
| `/api/cms/blog/:id` | PUT | Admin | Yazıyı güncelle |

### Admin
| Endpoint | Metod | Açıklama |
|----------|-------|---------|
| `/api/admin/vendors` | GET | Tüm firmalar (admin görünümü) |
| `/api/admin/vendors/:id/approve` | POST | Firma onayla |
| `/api/admin/vendors/:id/subscribe` | POST | Abonelik uzat |
| `/api/admin/coupons` | GET/POST | Kupon yönetimi |

---

## 💳 Abonelik Paketleri

| Paket | Fiyat | Özellikler |
|-------|-------|-----------|
| Standart | 999 TL/ay | Profil, rezervasyon sistemi, firmalar listesi |
| Sponsor (Elit) | Özel fiyat | Öne çıkan carousel, "★ Elit" rozeti, öncelik sıralama |

### Abonelik Durumu Rozetleri (Tüm Firmalar sayfası)
| Rozet | Renk | Durum |
|-------|------|-------|
| ★ Elit | Sarı/Amber | isSponsor = true |
| ✦ CRM Üye | Mor | isSubscribed = true |
| 🚀 Pilot Firma | Yeşil | Mock/pilot firma (kodda tanımlı) |

---

## 🛠️ Ortam Değişkenleri (Environment Secrets)

| Değişken | Ne İçin |
|----------|---------|
| `DATABASE_URL` | PostgreSQL bağlantı adresi |
| `JWT_SECRET` | Token imzalama anahtarı |
| `GOOGLE_CLIENT_ID` | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `SMTP_*` | E-posta gönderimi |
| `PAYTR_*` | Ödeme sistemi |

---

## 📱 SEO & Sosyal Medya Durumu

### Tamamlananlar ✅
- Her sayfada dinamik `<title>` + `<meta description>`
- Open Graph: `og:title`, `og:description`, `og:image`, `og:type`, `og:url`
- Twitter Card: `summary_large_image`
- Firma profil sayfası → kendi galeri fotoğrafını `og:image` olarak kullanıyor
- Blog yazısı → `og:type = article`, kapak görseli `og:image`
- robots.txt: Googlebot, Bingbot, sosyal medya botları ayrı ayrı tanımlı
- sitemap.xml: 20+ URL (blog, firma profilleri, hizmet-şehir sayfaları)
- JSON-LD: Organization, LocalBusiness, WebSite, Article, FAQPage, Service şemaları
- Görseller WebP formatına çevrildi (%93-96 boyut küçültme)
- Tüm `<img>` tag'lerinde `loading="lazy"` mevcut

### Bilinen Sorun ⚠️
- Instagram/Facebook önizleme çalışmıyor → Replit deployment'ında Cloudflare bot koruması var
- Çözüm: Facebook Sharing Debugger ile URL'yi yenile: `developers.facebook.com/tools/debug`

---

## 📝 Blog Yazıları (Statik — Kodda Yazılı)

| Başlık | Slug | Kategori |
|--------|------|---------|
| İstanbul'da Halı Yıkama Fiyatları 2026 | `istanbul-hali-yikama-fiyatlari-2026` | HALI YIKAMA |
| Koltuk Yıkama Kaç Saatte Kurur? | `koltuk-yikama-kac-saatte-kurur` | KOLTUK YIKAMA |
| Profesyonel Ev Temizliği Kontrol Listesi | `profesyonel-ev-temizligi-kontrol-listesi` | EV TEMİZLİĞİ |
| Araç Koltuk Yıkama İstanbul | `arac-koltuk-yikama-istanbul` | ARAÇ YIKAMA |
| Ofis Temizliği Fiyatları 2026 | `ofis-temizligi-fiyatlari-2026` | OFİS TEMİZLİĞİ |

> Admin panelinden eklenen yeni yazılar da artık çalışıyor — DB'ye kaydoluyor, slug oluşuyor, yayınlanabiliyor.

---

## 🗓️ Yapılacaklar / Notlar

### Bekleyen Görevler
- [ ] OG görselini 1200×630 px boyutunda yeniden tasarla (şu an 1280×720)
- [ ] Google Business Profile oluştur
- [ ] Google Search Console'da sitemap submit et
- [ ] `www.cleanlinktr.com` → `cleanlinktr.com` yönlendirmesi (sunucu seviyesinde)
- [ ] Sosyal medya profil linkleri ekle (`sameAs` JSON-LD alanı)

### Gelecek Fikirler
- Şehir bazlı sayfalar için SSR/SSG (daha iyi SEO)
- Müşteri sipariş takip sayfası
- Firma takvim/uygunluk sistemi
- SMS bildirim entegrasyonu

---

## 📁 Diğer Önemli Dosyalar

| Dosya | Açıklama |
|-------|---------|
| `CALISMA_GUNLUGU.md` | 13 Mayıs 2026 — o gün yapılan işlerin özeti |
| `credentials.md` | Hesap bilgileri (kısa özet) |
| `SEO_RAPORU.md` | SEO teknik analiz raporu |
| `SEO_BLOG_FIRMA_RAPORU.md` | Blog sistemi ve firma duplikasyon analizi |
| `threat_model.md` | Güvenlik mimarisi ve risk analizi |
| `artifacts/cleanlink/public/robots.txt` | Bot erişim kuralları |
| `artifacts/cleanlink/public/sitemap.xml` | Google sayfa haritası |

---

*Son güncelleme: 13 Mayıs 2026*
