import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Search, ChevronDown, CheckCircle2, Clock } from "lucide-react";
import { SmartCalculator } from "./SmartCalculator";

const CITIES = [
  { name: "İstanbul", active: true,  label: "Aktif & Pilot Bölge" },
  { name: "Ankara",   active: false, label: "Çok Yakında" },
  { name: "İzmir",    active: false, label: "Çok Yakında" },
  { name: "Antalya",  active: false, label: "Çok Yakında" },
  { name: "Bursa",    active: false, label: "Çok Yakında" },
];

export function Hero() {
  const [selectedCity, setSelectedCity] = useState("İstanbul");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <section className="relative pt-40 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-secondary">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-[40%] -left-[10%] w-[30%] h-[40%] rounded-full bg-teal-300/10 blur-3xl" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMTUsIDExOCwgMTEwLCAwLjA1KSIvPjwvc3ZnPg==')] [mask-image:linear-gradient(to_bottom,white,transparent)]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">

          {/* Left Column: Copy & Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left pt-10 lg:pt-0"
          >
            {/* Live pulse badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-primary/10 text-primary font-medium text-sm mb-6 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              🚀 Pilot Bölge: İstanbul — Türkiye'ye Yayılıyoruz!
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold text-foreground leading-[1.1] mb-4">
              Temizlikte <br className="hidden lg:block" />
              <span className="text-gradient">Yeni Standart</span>
            </h1>

            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Eviniz veya ofisiniz için en iyi profesyonelleri bulun. Şeffaf fiyatlandırma, güvenilir hizmet ve anında rezervasyon.
            </p>

            {/* Custom City Dropdown */}
            <div className="glass rounded-2xl p-2 max-w-md mx-auto lg:mx-0 flex items-center shadow-lg shadow-primary/5 relative" ref={dropdownRef}>
              <div className="flex-1 flex items-center px-4 relative">
                <MapPin className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
                <button
                  className="w-full bg-transparent text-left font-medium text-foreground py-3 flex items-center justify-between gap-2 outline-none"
                  onClick={() => setShowDropdown(v => !v)}
                >
                  <span>{selectedCity}</span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showDropdown ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-border z-50 overflow-hidden"
                    >
                      {CITIES.map(city => (
                        <button
                          key={city.name}
                          disabled={!city.active}
                          onClick={() => {
                            if (city.active) {
                              setSelectedCity(city.name);
                              setShowDropdown(false);
                            }
                          }}
                          className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors text-left ${
                            city.active
                              ? "hover:bg-primary/5 cursor-pointer"
                              : "opacity-50 cursor-not-allowed"
                          } ${selectedCity === city.name ? "bg-primary/5" : ""}`}
                        >
                          <div className="flex items-center gap-2.5">
                            {city.active
                              ? <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                              : <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            }
                            <span className={`font-medium ${city.active ? "text-foreground" : "text-muted-foreground"}`}>
                              {city.name}
                            </span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            city.active
                              ? "bg-primary/10 text-primary"
                              : "bg-secondary text-muted-foreground"
                          }`}>
                            {city.label}
                          </span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6 py-4 font-semibold shadow-md shadow-primary/20 transition-transform active:scale-95 flex items-center gap-2">
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Firmaları Gör</span>
              </button>
            </div>

            {/* Network expansion — below city selector */}
            <div className="mt-4 max-w-md mx-auto lg:mx-0">
              <p className="text-[11px] font-bold text-primary uppercase tracking-wider mb-1">
                Türkiye'nin Dijital Temizlik Ağı Genişliyor!
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Şu an <span className="font-semibold text-foreground">Pilot Bölge İstanbul</span>'da profesyonel temizlik standartlarını yeniden tanımlıyoruz.
                Çok yakında hizmet kalitemizi <span className="font-semibold text-foreground">4 yeni şehrimize</span> daha taşıyarak sizlerle birlikte olacağız.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-center lg:justify-start gap-6 text-sm text-muted-foreground font-medium">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center"><Check className="w-3 h-3 text-green-600" /></div>
                Onaylı Uzmanlar
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center"><Check className="w-3 h-3 text-green-600" /></div>
                Güvenli Ödeme
              </div>
            </div>
          </motion.div>

          {/* Right Column: Calculator */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative lg:ml-auto w-full max-w-md mx-auto"
          >
            <div className="absolute -inset-4 md:-inset-10 z-0 hidden md:block">
              <img
                src={`${import.meta.env.BASE_URL}images/hero-cleaning.png`}
                alt="Modern temiz bir oturma odası"
                width="600"
                height="500"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="w-full h-full object-cover rounded-[2.5rem] opacity-40 mix-blend-multiply"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/80 to-transparent rounded-[2.5rem]"></div>
            </div>

            <div className="relative z-10">
              <SmartCalculator />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );
}
