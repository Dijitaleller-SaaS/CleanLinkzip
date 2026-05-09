import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Instagram, Twitter, Facebook } from "lucide-react";
import { Link } from "wouter";
import { B2BModal } from "@/components/b2b/B2BModal";

export function Footer() {
  const [b2bOpen, setB2bOpen] = useState(false);

  return (
    <>
      <B2BModal open={b2bOpen} onClose={() => setB2bOpen(false)} />

      <footer className="bg-foreground text-white pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* B2B CTA Section */}
          <div className="bg-primary rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 mb-20 relative overflow-hidden">
            <div className="absolute top-[-50%] right-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-[-50%] left-[-10%] w-64 h-64 bg-black/10 rounded-full blur-2xl" />

            <div className="relative z-10 max-w-xl text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Temizlik Firmanız Mı Var?</h2>
              <p className="text-primary-foreground/80 text-lg">
                CleanLink ağına katılın, yüzlerce yeni müşteriye anında ulaşın. Randevu, ödeme ve müşteri yönetimi tek ekranda.
              </p>
            </div>

            <div className="relative z-10 w-full md:w-auto flex-shrink-0 flex flex-col items-center gap-2">
              <Button
                size="lg"
                onClick={() => setB2bOpen(true)}
                className="w-full md:w-auto bg-white text-primary hover:bg-gray-50 text-lg font-semibold h-14 px-8 rounded-2xl shadow-xl shadow-black/10 group"
              >
                İşini 999 TL / Ay'a Dijitalleştir
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <p className="text-white/60 text-xs">İlk ay ücretsiz · İptal garantisi</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="font-display font-bold text-2xl tracking-tight text-white">
                  CleanLink
                </span>
              </Link>
              <p className="text-white/60 mb-6 text-sm leading-relaxed">
                Temizlikte yeni standart. Güvenilir profesyoneller, şeffaf fiyatlandırma ve mükemmel müşteri deneyimi.
              </p>
              <div className="flex items-center gap-4">
                <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-colors text-white/60">
                  <Instagram className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-colors text-white/60">
                  <Twitter className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-colors text-white/60">
                  <Facebook className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-display font-semibold text-lg mb-6">Hizmetler</h3>
              <ul className="space-y-4">
                <li><Link href="/" className="text-white/60 hover:text-white transition-colors">Ev Temizliği</Link></li>
                <li><Link href="/" className="text-white/60 hover:text-white transition-colors">Ofis Temizliği</Link></li>
                <li><Link href="/" className="text-white/60 hover:text-white transition-colors">İnşaat Sonrası</Link></li>
                <li><Link href="/" className="text-white/60 hover:text-white transition-colors">Koltuk & Halı Yıkama</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-display font-semibold text-lg mb-6">Şirket</h3>
              <ul className="space-y-4">
                <li><Link href="/hakkimizda" className="text-white/60 hover:text-white transition-colors">Hakkımızda</Link></li>
                <li><Link href="/kariyer" className="text-white/60 hover:text-white transition-colors">Kariyer</Link></li>
                <li><Link href="/blog" className="text-white/60 hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/iletisim" className="text-white/60 hover:text-white transition-colors">İletişim</Link></li>
                <li>
                  <Link href="/pilot-sartlari" className="text-white/60 hover:text-white transition-colors inline-flex items-center gap-1.5">
                    Pilot Şartları
                    <span className="bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">YENİ</span>
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-display font-semibold text-lg mb-6">Yasal</h3>
              <ul className="space-y-4">
                <li><Link href="/kullanim-kosullari" className="text-white/60 hover:text-white transition-colors">Kullanım Koşulları</Link></li>
                <li><Link href="/gizlilik-politikasi" className="text-white/60 hover:text-white transition-colors">Gizlilik Politikası</Link></li>
                <li><Link href="/kvkk" className="text-white/60 hover:text-white transition-colors">KVKK Aydınlatma Metni</Link></li>
                <li><Link href="/cerez-politikasi" className="text-white/60 hover:text-white transition-colors">Çerez Politikası</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-white/40 text-sm">
            <p>© {new Date().getFullYear()} CleanLink Teknoloji A.Ş. Tüm hakları saklıdır.</p>
            <div className="flex items-center gap-2">
              <span>Türkiye'de <span className="text-red-500">❤️</span> ile yapıldı</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
