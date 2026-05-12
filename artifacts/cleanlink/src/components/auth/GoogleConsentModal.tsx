import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { apiSubmitGoogleConsent } from "@/lib/api";
import { apiMe } from "@/lib/api";

export function GoogleConsentModal() {
  const { pendingGoogleToken, setPendingGoogleToken, setUser } = useApp();
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToKvkk, setAgreedToKvkk]   = useState(false);
  const [loading, setLoading]              = useState(false);
  const [error, setError]                  = useState("");

  if (!pendingGoogleToken) return null;

  const handleClose = () => {
    setPendingGoogleToken(null);
  };

  const handleAccept = async () => {
    setError("");
    if (!agreedToTerms) { setError("Kullanıcı Sözleşmesi'ni kabul etmeniz gerekmektedir."); return; }
    if (!agreedToKvkk)  { setError("KVKK Aydınlatma Metni'ni kabul etmeniz gerekmektedir."); return; }

    setLoading(true);
    try {
      await apiSubmitGoogleConsent(pendingGoogleToken, true, true);
      localStorage.setItem("cleanlink_jwt", pendingGoogleToken);
      const apiUser = await apiMe();
      if (apiUser) {
        setUser({
          type:  apiUser.role === "admin" ? "musteri" : apiUser.role as "musteri" | "firma",
          name:  apiUser.name,
          email: apiUser.email,
          role:  apiUser.role,
        });
      }
      setPendingGoogleToken(null);
    } catch {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 z-10"
        >
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          <div className="mb-6">
            <h2 className="text-2xl font-display font-bold text-foreground">Son Bir Adım</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Google hesabınızla devam etmeden önce aşağıdaki sözleşmeleri onaylayın.
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={e => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-teal-600 flex-shrink-0 cursor-pointer"
              />
              <span className="text-sm text-muted-foreground leading-relaxed">
                <Link href="/kullanim-kosullari" target="_blank" className="text-primary font-semibold hover:underline">
                  Cleanlinktr Kullanıcı Sözleşmesi
                </Link>'ni okudum ve kabul ediyorum. Platformun sadece bir aracı olduğunu, taraflar arasındaki hiçbir uyuşmazlıktan (hizmet kusuru, saha hasarı, şahsi davranışlar vb.) mesul tutulamayacağını onaylıyorum. <span className="text-red-500 font-semibold">*</span>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreedToKvkk}
                onChange={e => setAgreedToKvkk(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-teal-600 flex-shrink-0 cursor-pointer"
              />
              <span className="text-sm text-muted-foreground leading-relaxed">
                KVKK Aydınlatma Metni'ni okudum; kişisel verilerimin hizmetin ifası amacıyla ilgili taraflara aktarılmasını ve işlenmesini kabul ediyorum. <span className="text-red-500 font-semibold">*</span>
              </span>
            </label>
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-4">
              {error}
            </p>
          )}

          <Button
            onClick={handleAccept}
            disabled={loading}
            className="w-full h-12 rounded-xl font-bold text-base gap-2 shadow-lg shadow-primary/20"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Kaydediliyor...</>
              : <><span>Kabul Ediyorum & Devam Et</span><ArrowRight className="w-4 h-4" /></>
            }
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-3">
            Kabul etmezseniz hesabınız oluşturulmaz.
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
