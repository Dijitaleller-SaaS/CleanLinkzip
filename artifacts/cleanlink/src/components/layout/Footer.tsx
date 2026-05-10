import { Sparkles, ArrowRight, Instagram, Twitter, Facebook, Building2, ChevronRight, LogIn } from "lucide-react";
import { Link } from "wouter";
import { useApp } from "@/context/AppContext";
import { useLocation } from "wouter";

export function Footer() {
  const { user, setShowAuthModal, setAuthMode } = useApp();
  const [, navigate] = useLocation();

  const handleFirmaGiris = () => {
    if (user?.type === "firma") {
      navigate("/firma-dashboard");
    } else {
      setAuthMode("firma");
      setShowAuthModal(true);
    }
  };

  return (
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

          <div className="relative z-10 w-full md:w-auto flex-shrink-0 flex flex-col items-center gap-3">
            <Link
              href="/pilot-sartlari"
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-white text-primary hover:bg-gray-50 text-lg font-semibold h-14 px-8 rounded-2xl shadow-xl shadow-black/10 group transition-colors"
            >
              İşini 999 TL / Ay'a Dijitalleştir
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button
              onClick={handleFirmaGiris}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold h-10 px-6 rounded-xl transition-colors"
            >
              <LogIn className="w-4 h-4" />
              {user?.type === "firma" ? "Firma Paneline Git" : "Firma Girişi Yap"}
            </button>
            <p className="text-white/60 text-xs">İlk ay ücretsiz · İptal garantisi</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-16">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-2xl tracking-tight text-white">
                CleanLink
              </span>
            </Link>
            <p className="text-white/60 mb-6 text-sm leading-relaxed max-w-xs">
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

          {/* Hizmetler */}
          <div>
            <h3 className="font-display font-semibold text-base mb-5">Hizmetler</h3>
            <ul className="space-y-3.5">
              <li><Link href="/" className="text-white/60 hover:text-white transition-colors text-sm">Ev Temizliği</Link></li>
              <li><Link href="/" className="text-white/60 hover:text-white transition-colors text-sm">Ofis Temizliği</Link></li>
              <li><Link href="/" className="text-white/60 hover:text-white transition-colors text-sm">İnşaat Sonrası</Link></li>
              <li><Link href="/" className="text-white/60 hover:text-white transition-colors text-sm">Koltuk & Halı Yıkama</Link></li>
            </ul>
          </div>

          {/* İş Ortaklığı */}
          <div>
            <h3 className="font-display font-semibold text-base mb-5 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-primary" />
              İş Ortaklığı
            </h3>
            <ul className="space-y-3.5">
              <li>
                <Link
                  href="/pilot-sartlari"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary group-hover:scale-125 transition-transform flex-shrink-0" />
                  Firma Kayıt / Hizmet Ver
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </li>
              <li>
                <Link href="/pilot-sartlari" className="text-white/60 hover:text-white transition-colors text-sm">
                  Pilot Şartları
                </Link>
              </li>
              <li>
                <Link href="/pilot-sartlari" className="text-white/60 hover:text-white transition-colors text-sm inline-flex items-center gap-1.5">
                  CRM Paketi
                  <span className="bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">999 TL</span>
                </Link>
              </li>
              <li><Link href="/hakkimizda" className="text-white/60 hover:text-white transition-colors text-sm">Hakkımızda</Link></li>
            </ul>
          </div>

          {/* Yasal */}
          <div>
            <h3 className="font-display font-semibold text-base mb-5">Yasal</h3>
            <ul className="space-y-3.5">
              <li><Link href="/kullanim-kosullari" className="text-white/60 hover:text-white transition-colors text-sm">Kullanım Koşulları</Link></li>
              <li><Link href="/gizlilik-politikasi" className="text-white/60 hover:text-white transition-colors text-sm">Gizlilik Politikası</Link></li>
              <li><Link href="/kvkk" className="text-white/60 hover:text-white transition-colors text-sm">KVKK Aydınlatma Metni</Link></li>
              <li><Link href="/cerez-politikasi" className="text-white/60 hover:text-white transition-colors text-sm">Çerez Politikası</Link></li>
              <li><Link href="/iletisim" className="text-white/60 hover:text-white transition-colors text-sm">İletişim</Link></li>
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
  );
}
