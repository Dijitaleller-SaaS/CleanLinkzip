import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, X } from "lucide-react";

const STORAGE_KEY = "cleanlink_kvkk_accepted";

export function KvkkConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(STORAGE_KEY);
    if (!accepted) {
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-2rem)] max-w-lg"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-border p-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <p className="font-bold text-foreground text-sm">Gizliliğiniz Bizimle Güvende</p>
              </div>
              <button
                onClick={accept}
                className="w-7 h-7 rounded-full bg-secondary hover:bg-border transition-colors flex items-center justify-center flex-shrink-0"
                aria-label="Kapat"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>

            {/* Body */}
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              Size en yakın profesyonel ekibi yönlendirebilmek için adres ve iletişim bilgilerinize ihtiyaç duyuyoruz.
              Verileriniz <span className="font-semibold text-foreground">KVKK kapsamında korunmakta</span> ve
              yalnızca hizmet sürecini yönetmek amacıyla işlenmektedir. Devam ederek{" "}
              <a href="/cerez-politikasi" className="text-primary hover:underline">Çerez Politikamızı</a> ve{" "}
              <a href="/kvkk" className="text-primary hover:underline">Aydınlatma Metnimizi</a> kabul etmiş olursunuz.
            </p>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={accept}
                className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold text-sm py-2.5 px-4 rounded-xl transition-colors shadow-sm shadow-primary/20"
              >
                Anladım, Devam Et
              </button>
              <a
                href="/kvkk"
                className="text-xs text-muted-foreground hover:text-primary underline-offset-2 hover:underline whitespace-nowrap"
              >
                Daha fazla bilgi
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
