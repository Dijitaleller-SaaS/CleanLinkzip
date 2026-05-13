# CleanLink — Blog & Firma Sistemi Analiz Raporu

**Tarih:** 13 Mayıs 2026  
**Kapsam:** Blog sistemi teknik analiz + Firmalar sayfası duplikasyon tespiti

---

## 1. BLOG SİSTEMİ — MEVCUT DURUM

### Problem: Admin'den eklenen yazılar blogda görünmüyor

#### Neden çalışmıyor?

Sistemde **iki ayrı blog katmanı** var ve bunlar birbirine bağlı değil:

**A) Statik kodlanmış yazılar** (`BlogPost.tsx` içinde hardcoded)
- 5 adet yazı direkt kod içinde yazılmış
- Slug, başlık, kategori, body bölümleri (h/p çiftleri), FAQ — hepsi kodda
- Blog listesi bu yazıları "fallback" olarak gösteriyor
- Blog detay sayfası (örn. `/blog/istanbul-hali-yikama-fiyatlari-2026`) **sadece bu statik yazıları** okuyabiliyor

**B) Veritabanı (`cms_blog_posts` tablosu)**
- Admin panelinde yazı ekleniyor → DB'ye kaydediliyor
- DB'de şu an **0 yazı** var (admin henüz eklememis)
- Tablo şeması eksik — kritik alanlar yok:

| Alan | Mevcut mu? | Gerekli mi? |
|------|-----------|------------|
| `id`, `title`, `category` | ✅ Var | ✅ |
| `excerpt`, `post_date`, `read_time` | ✅ Var | ✅ |
| `sort_order` | ✅ Var | ✅ |
| **`slug`** | ❌ **YOK** | ✅ Zorunlu |
| **`content`** (body bölümleri JSON) | ❌ **YOK** | ✅ Zorunlu |
| **`faq`** (soru-cevap JSON) | ❌ **YOK** | ✅ Önerilir |
| **`published`** (yayın kontrolü) | ❌ **YOK** | ✅ Önerilir |

#### Sonuç
Admin'den yazı eklesen bile:
1. `slug` olmadığı için URL oluşturulamıyor → link broken
2. `content` (body) olmadığı için detay sayfası içeriksiz
3. `BlogPost.tsx` sadece statik yazı listesine bakıyor → DB yazıları detay sayfası açmıyor

---

### Çözüm Planı — WordPress Gibi Tam Blog Sistemi

#### Adım 1 — DB Migration (schema güncelleme)
`cms_blog_posts` tablosuna eklenecekler:
```sql
ALTER TABLE cms_blog_posts 
  ADD COLUMN slug VARCHAR(255) UNIQUE,
  ADD COLUMN content JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN faq JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN published BOOLEAN NOT NULL DEFAULT false;
```

#### Adım 2 — API Güncelleme (`cms.ts`)
- POST/PUT: `slug`, `content`, `faq`, `published` alanlarını kabul et
- Slug auto-generate: title → Türkçe karakter temizle → slug yap
- GET `/api/cms/blog/:slug`: slug ile tek yazı getir (BlogPost.tsx için)
- Sadece `published=true` olanları public endpoint'te döndür

#### Adım 3 — Admin Blog Editörü Genişletme
Mevcut alanlar: title, category, postDate, readTime, excerpt, sortOrder  
Eklenecekler:
- `slug` (otomatik oluşur, düzenlenebilir)
- `published` toggle (Taslak / Yayınla)
- **Body builder:** Bölüm ekle → her bölüm bir başlık (h) + paragraf (p)
- **FAQ builder:** Soru-cevap çiftleri ekle/çıkar

#### Adım 4 — Blog Detay Sayfası (`BlogPost.tsx`)
- Slug ile API'dan yazıyı çek
- Statik yazılar fallback olarak kalsın (geriye uyumluluk)
- DB'den gelen yazılar aynı tasarımla gösterilsin

#### Adım 5 — Blog Listesi (`Blog.tsx`)  
- DB yazılarında slug mevcut olacak → linkler çalışacak
- `published=false` yazılar listede görünmesin

---

## 2. FİRMALAR SAYFASI — DUPLIKASYON ANALİZİ

### Mevcut Durum

**Firmalar sayfasında 4 firma gösteriliyor:**

| Firma | Kaynak | Gerçek mi? |
|-------|--------|-----------|
| Cleanlink Temizlik (Beşiktaş) | ❌ Hardcoded mock | Test verisi |
| Elitplus+ Koltuk Yıkama (Gaziosmanpaşa) | ❌ Hardcoded mock | Test verisi |
| Elit Plus+ Temizlik (İstanbul) | ✅ DB `id=2` | tariktingiroglu37@gmail.com |
| Gün Temizlik Hizmetleri (İstanbul) | ✅ DB `id=1` | gunkoltukyikama@gmail.com |

### Duplikasyon Problemi

- **"Elitplus+ Koltuk Yıkama"** (mock) = **"Elit Plus+ Temizlik"** (DB) → Aynı işletme sahibi (Tarik Tingiroglu), iki farklı profil görünüyor
- Mock veriler üç ayrı dosyada hardcoded: `AllVendors.tsx`, `FeaturedCompanies.tsx`, `SmartCalculator.tsx`

### Çözüm Planı

#### Seçenek A — Mock'ları tamamen kaldır (önerilen)
- `AllVendors.tsx`: Hardcoded firma listesini sil, sadece DB'den gerçek firmaları göster
- `FeaturedCompanies.tsx`: Hardcoded kartları sil, DB'deki `isSponsor=true` firmaları öne çıkar
- `SmartCalculator.tsx`: Mock hesaplama verilerini DB'den al

#### Seçenek B — Mock'ları placeholder olarak tut
- "Cleanlink Temizlik" → "Yakında eklenecek..." placeholder kartı yap
- "Elitplus+ Koltuk Yıkama" → kaldır, Tarik'in gerçek profili kalacak

---

## 3. YAPILACAKLAR ÖZETİ

### Blog (Öncelik: 🔴 Yüksek)
- [ ] DB migration: slug + content + faq + published alanları ekle
- [ ] CMS API: yeni alanları işle, slug auto-generate, `/blog/:slug` endpoint
- [ ] Admin editörü: body builder + FAQ builder + slug + published toggle
- [ ] BlogPost.tsx: API'dan yazı çek (statik fallback kalsın)
- [ ] Blog.tsx: DB slug ile linkleri düzelt
- [ ] Mevcut 5 statik yazıyı DB'ye aktar (isteğe bağlı)

### Firmalar (Öncelik: 🟡 Orta)
- [ ] `AllVendors.tsx`: Mock firmaları kaldır, sadece DB kullan
- [ ] `FeaturedCompanies.tsx`: Mock firmaları kaldır, DB sponsor firmaları göster
- [ ] `SmartCalculator.tsx`: Mock verileri kaldır veya gizle

---

## 4. TAHMİNİ İŞ YÜKÜ

| Görev | Tahmini Süre |
|-------|-------------|
| DB migration | 10 dk |
| CMS API güncelleme | 20 dk |
| Admin blog editörü | 30 dk |
| BlogPost.tsx DB entegrasyonu | 20 dk |
| Mock firma temizliği | 15 dk |
| **Toplam** | **~95 dk** |

---

*Rapor oluşturuldu: 13 Mayıs 2026 — Onay bekleniyor*
