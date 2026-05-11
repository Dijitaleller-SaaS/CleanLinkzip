import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ArrowRight, Eye, EyeOff, Loader2, CheckCircle2, Mail, Building2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useApp, UserType } from "@/context/AppContext";
import { apiLogin, apiRegister, apiForgotPassword } from "@/lib/api";
import { useLocation } from "wouter";

type AuthTab = "giris" | "kayit";
type ModalStep = "auth" | "sifremi-unuttum" | "sifremi-unuttum-basarili" | "email-dogrulama";

export function AuthModal() {
  const { showAuthModal, setShowAuthModal, setUser, authMode } = useApp();
  const [, navigate] = useLocation();
  const isFirma = authMode === "firma";

  const [step, setStep] = useState<ModalStep>("auth");
  const [authTab, setAuthTab] = useState<AuthTab>("giris");

  const [email, setEmail]       = useState("");
  const [name, setName]         = useState("");
  const [password, setPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [showPw, setShowPw]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const reset = () => {
    setEmail(""); setName(""); setPassword(""); setForgotEmail("");
    setError(""); setLoading(false); setStep("auth"); setAgreedToTerms(false);
  };

  const handleClose = () => { reset(); setShowAuthModal(false); };

  const handleAuthTabChange = (t: AuthTab) => { setAuthTab(t); setError(""); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) { setError("E-posta ve şifre zorunludur."); return; }
    if (authTab === "kayit" && !name.trim()) { setError("Lütfen adınızı girin."); return; }
    if (password.length < 6) { setError("Şifre en az 6 karakter olmalıdır."); return; }
    if (authTab === "kayit" && !agreedToTerms) { setError("Devam etmek için kullanıcı sözleşmesini kabul etmeniz gerekmektedir."); return; }

    setLoading(true);
    try {
      let result;
      if (authTab === "kayit") {
        const registerRole: UserType = isFirma ? "firma" : "musteri";
        result = await apiRegister(email.trim(), name.trim(), password, registerRole);
      } else {
        result = await apiLogin(email.trim(), password);
      }
      setUser({
        type: result.user.role === "admin" ? "musteri" : result.user.role as UserType,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
      });
      if (authTab === "kayit") {
        setStep("email-dogrulama");
      } else {
        setShowAuthModal(false);
        reset();
        if (result.user.role === "firma") {
          navigate("/firma-dashboard");
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!forgotEmail.trim()) { setError("E-posta adresinizi girin."); return; }
    setLoading(true);
    try {
      await apiForgotPassword(forgotEmail.trim());
      setStep("sifremi-unuttum-basarili");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <AnimatePresence>
      {showAuthModal && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed inset-0 z-[81] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none"
          >
            <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden max-h-[92vh] overflow-y-auto">

              <AnimatePresence mode="wait">

                {/* ── Main auth step ── */}
                {step === "auth" && (
                  <motion.div key="step-auth"
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.18 }}
                  >
                    <div className="relative bg-gradient-to-br from-primary/5 to-teal-50 px-5 sm:px-8 pt-6 pb-5 sm:pt-8 sm:pb-6">
                      <button
                        onClick={handleClose}
                        className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white transition-colors shadow-sm"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-xl text-primary tracking-tight">CleanLink</span>
                      </div>
                      <h2 className="text-2xl font-bold text-foreground">
                        {isFirma
                          ? (authTab === "giris" ? "Firma Girişi" : "Firma Hesabı Oluştur")
                          : (authTab === "giris" ? "Hesabınıza Giriş Yapın" : "Hesap Oluşturun")
                        }
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        {isFirma
                          ? (authTab === "giris" ? "Firma panelinize erişin." : "Firmanızı CleanLink'e kaydedin.")
                          : (authTab === "giris" ? "Hoş geldiniz, hizmetlerinizi yönetin." : "Ücretsiz hesap oluşturun ve temizlik hizmetlerini keşfedin.")
                        }
                      </p>
                    </div>

                    <div className="px-5 sm:px-8 pt-4 pb-6 sm:pt-5 sm:pb-8">
                      <div className="flex bg-secondary rounded-xl p-1 mb-5">
                        {(["giris", "kayit"] as AuthTab[]).map(t => (
                          <button
                            key={t}
                            onClick={() => handleAuthTabChange(t)}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                              authTab === t
                                ? "bg-white text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {t === "giris" ? "Giriş Yap" : "Üye Ol"}
                          </button>
                        ))}
                      </div>

                      {/* Google butonu */}
                      <>
                        <a
                          href="/api/auth/google"
                          className="flex items-center justify-center gap-3 w-full h-11 rounded-xl border-2 border-border bg-white hover:bg-gray-50 hover:border-gray-300 transition-all font-semibold text-sm text-foreground shadow-sm mb-4"
                        >
                          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                          Google ile Devam Et
                        </a>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex-1 h-px bg-border" />
                          <span className="text-xs text-muted-foreground">veya e-posta ile</span>
                          <div className="flex-1 h-px bg-border" />
                        </div>
                      </>

                      <form onSubmit={handleSubmit} className="space-y-3">
                        {authTab === "kayit" && (
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                              {isFirma ? "Firma Adı" : "Adınız Soyadınız"}
                            </label>
                            <input
                              type="text" value={name}
                              onChange={e => { setName(e.target.value); setError(""); }}
                              placeholder={isFirma ? "Örn: Gün Temizlik Hizmetleri" : "Örn: Fatma Kaya"}
                              className="w-full border-2 border-border rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors text-foreground font-medium text-sm"
                              autoFocus
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1.5">E-posta</label>
                          <input
                            type="email" value={email}
                            onChange={e => { setEmail(e.target.value); setError(""); }}
                            placeholder="ornek@eposta.com"
                            className="w-full border-2 border-border rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors text-foreground text-sm"
                            autoFocus={authTab === "giris"}
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-sm font-medium text-foreground">Şifre</label>
                            {authTab === "giris" && (
                              <button
                                type="button"
                                onClick={() => { setForgotEmail(email); setError(""); setStep("sifremi-unuttum"); }}
                                className="text-xs text-primary font-medium hover:underline"
                              >
                                Şifremi unuttum
                              </button>
                            )}
                          </div>
                          <div className="relative">
                            <input
                              type={showPw ? "text" : "password"} value={password}
                              onChange={e => { setPassword(e.target.value); setError(""); }}
                              placeholder={authTab === "kayit" ? "En az 6 karakter" : "Şifrenizi girin"}
                              className="w-full border-2 border-border rounded-xl px-4 py-3 pr-11 outline-none focus:border-primary transition-colors text-foreground text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPw(v => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {error && (
                          <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
                        )}

                        {authTab === "kayit" && (
                          <label className="flex items-start gap-2.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={agreedToTerms}
                              onChange={e => setAgreedToTerms(e.target.checked)}
                              className="mt-0.5 w-4 h-4 accent-teal-600 flex-shrink-0 cursor-pointer"
                            />
                            <span className="text-xs text-muted-foreground leading-relaxed">
                              <Link href="/kullanim-kosullari" target="_blank" className="text-primary font-semibold hover:underline">Cleanlinktr Kullanıcı Sözleşmesi ve Aydınlatma Metni</Link>'ni okudum, anladım. Cleanlinktr'nin sadece bir aracı platform (köprü) olduğunu, hizmetin ifasından veya tarafların davranışlarından doğacak uyuşmazlıklarda Cleanlinktr'nin hiçbir hukuki ve cezai mesuliyeti bulunmadığını kabul, beyan ve taahhüt ederim.
                            </span>
                          </label>
                        )}

                        <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl font-bold text-base gap-2 shadow-lg shadow-primary/20 mt-1">
                          {loading ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Lütfen bekleyin...</>
                          ) : authTab === "giris" ? (
                            <><span>Giriş Yap</span><ArrowRight className="w-4 h-4" /></>
                          ) : (
                            <><span>Üye Ol</span><ArrowRight className="w-4 h-4" /></>
                          )}
                        </Button>

                        <p className="text-xs text-center text-muted-foreground mt-2">
                          {authTab === "giris" ? (
                            <>Hesabınız yok mu?{" "}
                              <button type="button" onClick={() => handleAuthTabChange("kayit")} className="text-primary font-semibold hover:underline">
                                Üye olun
                              </button>
                            </>
                          ) : (
                            <>Hesabınız var mı?{" "}
                              <button type="button" onClick={() => handleAuthTabChange("giris")} className="text-primary font-semibold hover:underline">
                                Giriş yapın
                              </button>
                            </>
                          )}
                        </p>

                      </form>

                      {/* Alt yönlendirme */}
                      {!isFirma && (
                        <div className="mt-5 pt-4 border-t border-border flex items-center justify-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <p className="text-xs text-muted-foreground">
                            Firmanızı mı kaydetmek istiyorsunuz?{" "}
                            <Link
                              href="/pilot-sartlari"
                              onClick={handleClose}
                              className="text-primary font-semibold hover:underline"
                            >
                              İş Ortaklığı →
                            </Link>
                          </p>
                        </div>
                      )}
                      {isFirma && (
                        <div className="mt-5 pt-4 border-t border-border flex items-center justify-center gap-2">
                          <p className="text-xs text-muted-foreground">
                            Müşteri misiniz?{" "}
                            <Link
                              href="/"
                              onClick={handleClose}
                              className="text-primary font-semibold hover:underline"
                            >
                              Müşteri girişi →
                            </Link>
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* ── Forgot password step ── */}
                {step === "sifremi-unuttum" && (
                  <motion.div key="step-forgot"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.18 }}
                  >
                    <div className="relative bg-gradient-to-br from-primary/5 to-teal-50 px-5 sm:px-8 pt-6 pb-5 sm:pt-8 sm:pb-6">
                      <button
                        onClick={handleClose}
                        className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white transition-colors shadow-sm"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                        <Mail className="w-6 h-6 text-primary" />
                      </div>
                      <h2 className="text-2xl font-bold text-foreground">Şifremi Unuttum</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Kayıtlı e-posta adresinizi girin, size yardımcı olalım.
                      </p>
                    </div>

                    <div className="px-5 sm:px-8 pt-5 pb-6 sm:pt-6 sm:pb-8">
                      <form onSubmit={handleForgotSubmit} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1.5">E-posta Adresiniz</label>
                          <input
                            type="email" value={forgotEmail} autoFocus
                            onChange={e => { setForgotEmail(e.target.value); setError(""); }}
                            placeholder="ornek@eposta.com"
                            className="w-full border-2 border-border rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors text-foreground text-sm"
                          />
                        </div>

                        {error && (
                          <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
                        )}

                        <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl font-bold text-base gap-2 shadow-lg shadow-primary/20">
                          {loading ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Gönderiliyor...</>
                          ) : (
                            <><span>Talep Gönder</span><ArrowRight className="w-4 h-4" /></>
                          )}
                        </Button>

                        <button
                          type="button"
                          onClick={() => { setStep("auth"); setError(""); }}
                          className="w-full text-xs text-center text-muted-foreground hover:text-primary transition-colors"
                        >
                          ← Giriş ekranına dön
                        </button>
                      </form>
                    </div>
                  </motion.div>
                )}

                {/* ── Musteri email doğrulama adımı ── */}
                {step === "email-dogrulama" && (
                  <motion.div key="step-email-dogrulama"
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-8 py-12 flex flex-col items-center text-center">
                      <button
                        onClick={handleClose}
                        className="absolute top-5 right-5 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                        <Mail className="w-8 h-8 text-primary" />
                      </div>
                      <h2 className="text-xl font-bold text-foreground mb-2">Doğrulama E-postası Gönderildi</h2>
                      <p className="text-sm text-muted-foreground mb-1">
                        <span className="font-semibold text-foreground">{email}</span> adresine
                      </p>
                      <p className="text-sm text-muted-foreground mb-6">
                        bir doğrulama bağlantısı gönderdik. Lütfen e-postanızı kontrol edin.
                      </p>
                      <Button
                        onClick={() => { handleClose(); if (isFirma) navigate("/firma-dashboard"); }}
                        className="w-full h-12 rounded-xl font-bold mb-3"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Devam Et
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* ── Success step ── */}
                {step === "sifremi-unuttum-basarili" && (
                  <motion.div key="step-success"
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-8 py-12 flex flex-col items-center text-center">
                      <button
                        onClick={handleClose}
                        className="absolute top-5 right-5 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-5">
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                      </div>
                      <h2 className="text-xl font-bold text-foreground mb-2">Talebiniz Alındı</h2>
                      <p className="text-sm text-muted-foreground mb-1">
                        <span className="font-medium text-foreground">{forgotEmail}</span> adresine kayıtlı hesabınız bulundu.
                      </p>
                      <p className="text-sm text-muted-foreground mb-6">
                        Destek ekibimiz en kısa sürede sizinle iletişime geçecektir.
                      </p>
                      <Button
                        onClick={() => { setStep("auth"); setError(""); }}
                        className="w-full h-12 rounded-xl font-bold"
                      >
                        Giriş Ekranına Dön
                      </Button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
}
