import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Menu, X, User, Sparkles, LogOut, Building2, ShoppingBag, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useApp, ADMIN_EMAIL } from "@/context/AppContext";
import { NotificationBell } from "@/components/notifications/NotificationBell";

function scrollToSection(id: string) {
  const HEADER_OFFSET = 104; // AnnouncementBar (36px) + Header (~68px)
  const el = document.getElementById(id);
  if (el) {
    const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
    window.scrollTo({ top, behavior: "smooth" });
  }
}

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, setShowAuthModal, setAuthMode, myOrders, setShowMyOrders } = useApp();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openAuth = (mode: "musteri" | "firma") => {
    setAuthMode(mode);
    setShowAuthModal(true);
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-9 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/90 backdrop-blur-md shadow-sm py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25 group-hover:scale-105 transition-transform duration-300">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-primary">
              CleanLink
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection("hizmetler")}
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Hizmetler
            </button>
            <button
              onClick={() => scrollToSection("nasil-calisir")}
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Nasıl Çalışır?
            </button>
            <button
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Kurumsal
            </button>
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {/* Siparişlerim — only for musteri */}
                {user.email === ADMIN_EMAIL && (
                  <Link
                    href="/admin-dashboard"
                    className="flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:bg-violet-50 px-3 py-2 rounded-lg transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Admin Panel
                  </Link>
                )}
                {user.type === "musteri" && (
                  <button
                    onClick={() => setShowMyOrders(true)}
                    className="relative flex items-center gap-1.5 text-sm font-medium text-primary hover:bg-primary/5 px-3 py-2 rounded-lg transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Siparişlerim
                    {myOrders.some(o => o.durum === "onayBekliyor") && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white" />
                    )}
                  </button>
                )}
                <NotificationBell />
                {user.type === "firma" ? (
                  <Link href="/firma-dashboard" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors cursor-pointer">
                    <Building2 className="w-4 h-4" />
                    {user.name}
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    <User className="w-4 h-4" />
                    {user.name}
                  </div>
                )}
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors px-3 py-2 rounded-lg hover:bg-destructive/5"
                >
                  <LogOut className="w-4 h-4" />
                  Çıkış
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowMyOrders(true)}
                  className="relative flex items-center gap-1.5 text-sm font-medium text-primary hover:bg-primary/5 px-3 py-2 rounded-lg transition-colors"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Siparişlerim
                </button>
                <Button
                  variant="ghost"
                  onClick={() => openAuth("musteri")}
                  className="text-primary hover:text-primary hover:bg-primary/5 font-medium"
                >
                  Giriş Yap
                </Button>
                <Button
                  onClick={() => openAuth("musteri")}
                  className="bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 rounded-full px-6 gap-2"
                >
                  <User className="w-4 h-4" />
                  <span>Üye Ol</span>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-border overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-2 flex flex-col">
              <button
                onClick={() => { scrollToSection("hizmetler"); setMobileMenuOpen(false); }}
                className="px-4 py-3 text-base font-medium rounded-lg hover:bg-secondary text-left text-foreground"
              >
                Hizmetler
              </button>
              <button
                onClick={() => { scrollToSection("nasil-calisir"); setMobileMenuOpen(false); }}
                className="px-4 py-3 text-base font-medium rounded-lg hover:bg-secondary text-left text-foreground"
              >
                Nasıl Çalışır?
              </button>
              <button className="px-4 py-3 text-base font-medium rounded-lg hover:bg-secondary text-left text-foreground">
                Kurumsal
              </button>
              <div className="h-px bg-border my-2" />
              {user ? (
                <>
                  {user.email === ADMIN_EMAIL && (
                    <Link
                      href="/admin-dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full px-4 py-3 text-base font-semibold rounded-lg hover:bg-violet-50 text-left text-violet-600 flex items-center gap-2"
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      Admin Panel
                    </Link>
                  )}
                  {user.type === "musteri" && (
                    <button
                      onClick={() => { setShowMyOrders(true); setMobileMenuOpen(false); }}
                      className="w-full px-4 py-3 text-base font-semibold rounded-lg hover:bg-primary/5 text-left text-primary flex items-center gap-2"
                    >
                      <ShoppingBag className="w-5 h-5" />
                      Siparişlerim
                      {myOrders.some(o => o.durum === "onayBekliyor") && (
                        <span className="ml-auto w-2.5 h-2.5 rounded-full bg-blue-500" />
                      )}
                    </button>
                  )}
                  <div className="flex items-center justify-between px-4 py-3">
                    {user.type === "firma" ? (
                      <Link href="/firma-dashboard" onClick={() => setMobileMenuOpen(false)} className="font-medium text-primary hover:underline flex items-center gap-1.5">
                        <Building2 className="w-4 h-4" />{user.name}
                      </Link>
                    ) : (
                      <span className="font-medium text-primary">{user.name}</span>
                    )}
                    <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="text-muted-foreground hover:text-destructive text-sm flex items-center gap-1">
                      <LogOut className="w-4 h-4" /> Çıkış
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setShowMyOrders(true); setMobileMenuOpen(false); }}
                    className="w-full px-4 py-3 text-base font-semibold rounded-lg hover:bg-primary/5 text-left text-primary flex items-center gap-2"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    Siparişlerim
                  </button>
                  <Button variant="outline" className="w-full justify-center" onClick={() => openAuth("musteri")}>
                    Giriş Yap
                  </Button>
                  <Button className="w-full justify-center bg-primary" onClick={() => openAuth("musteri")}>
                    Üye Ol
                  </Button>
                  <Button variant="ghost" className="w-full justify-center text-primary border border-primary/20" onClick={() => openAuth("firma")}>
                    <Building2 className="w-4 h-4 mr-2" /> Firma Girişi
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
