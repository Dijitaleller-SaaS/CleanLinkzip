import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/layout/PageLayout";
import { useSEO } from "@/hooks/useSEO";
import { apiResetPassword } from "@/lib/api";

export default function SifreSifirla() {
  useSEO({
    title: "Şifre Sıfırla — CleanLink",
    description: "CleanLink hesabınız için yeni şifre belirleyin.",
    canonical: "/sifre-sifirla",
  });

  const [, navigate] = useLocation();
  const token = new URLSearchParams(window.location.search).get("token") ?? "";

  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [showCf, setShowCf]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const isMatch  = password === confirm;
  const isStrong = password.length >= 6;
  const canSubmit = password.length > 0 && isMatch && isStrong && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    if (!token) { setError("Geçersiz sıfırlama bağlantısı. Lütfen tekrar şifre sıfırlama isteği gönderin."); return; }
    setLoading(true); setError(null);
    try {
      await apiResetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate("/"), 3000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout breadcrumbs={[{ label: "Şifre Sıfırla" }]}>
      <div className="max-w-md mx-auto">
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Şifreniz Güncellendi!</h2>
              <p className="text-muted-foreground">
                Yeni şifrenizle giriş yapabilirsiniz. Birkaç saniye içinde ana sayfaya yönlendirileceksiniz…
              </p>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div className="mb-8">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-3xl font-display font-bold text-foreground mb-2">
                  Yeni Şifre Belirle
                </h1>
                <p className="text-muted-foreground">
                  Hesabınız için güçlü bir şifre oluşturun. En az 6 karakter olmalıdır.
                </p>
              </div>

              {!token && (
                <div className="flex items-start gap-3 bg-destructive/5 border border-destructive/20 rounded-2xl px-4 py-3 mb-6">
                  <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">
                    Geçersiz veya eksik sıfırlama bağlantısı. Lütfen yeni bir şifre sıfırlama talebi oluşturun.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    Yeni Şifre
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="En az 6 karakter"
                      className="w-full border-2 border-border rounded-xl px-4 py-3 pr-11 outline-none focus:border-primary transition-colors text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {password.length > 0 && !isStrong && (
                    <p className="text-xs text-destructive mt-1">Şifre en az 6 karakter olmalıdır.</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    Şifre Tekrar
                  </label>
                  <div className="relative">
                    <input
                      type={showCf ? "text" : "password"}
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="Şifrenizi tekrar girin"
                      className={`w-full border-2 rounded-xl px-4 py-3 pr-11 outline-none transition-colors text-sm ${
                        confirm.length > 0 && !isMatch
                          ? "border-destructive focus:border-destructive"
                          : "border-border focus:border-primary"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCf(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showCf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirm.length > 0 && !isMatch && (
                    <p className="text-xs text-destructive mt-1">Şifreler eşleşmiyor.</p>
                  )}
                </div>

                {error && (
                  <div className="flex items-start gap-2 bg-destructive/5 border border-destructive/20 rounded-xl px-4 py-3">
                    <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={!canSubmit || !token}
                  className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20 gap-2"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Güncelleniyor…</>
                  ) : (
                    <><Lock className="w-4 h-4" /> Şifremi Güncelle</>
                  )}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageLayout>
  );
}
