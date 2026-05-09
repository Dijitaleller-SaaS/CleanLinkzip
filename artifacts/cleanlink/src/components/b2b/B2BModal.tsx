import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, BadgeCheck, BrainCircuit, ArrowRight, CheckCircle2, Phone, MapPin, Building2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onClose: () => void;
}

const BENEFITS = [
  {
    icon: CreditCard,
    color: "from-violet-500 to-purple-600",
    bg: "bg-violet-50",
    title: "3 Taksitli Tahsilat",
    desc: "Pilot dönemde ödeme firma–müşteri arasında doğrudan yapılır. CleanLink ödeme komisyonu almaz; yakında entegre online ödeme devreye alınacaktır.",
  },
  {
    icon: BadgeCheck,
    color: "from-sky-500 to-blue-600",
    bg: "bg-sky-50",
    title: "Profesyonel Profil",
    desc: "Dükkan görselleri, sertifikalar ve doğrulanmış müşteri yorumlarıyla güven kazanın. Rakiplerinizden öne çıkın.",
  },
  {
    icon: BrainCircuit,
    color: "from-primary to-teal-600",
    bg: "bg-teal-50",
    title: "Gelişmiş CRM",
    desc: "Müşteri listenizi dijitalde yönetin, otomatik hatırlatıcılar ve randevu sistemiyle işinizi büyütün.",
  },
];

const REGIONS = [
  "İstanbul Avrupa", "İstanbul Anadolu", "Ankara", "İzmir", "Bursa",
  "Antalya", "Adana", "Gaziantep", "Konya", "Kayseri",
];

export function B2BModal({ open, onClose }: Props) {
  const [firmaAdi, setFirmaAdi] = useState("");
  const [telefon, setTelefon] = useState("");
  const [bolge, setBolge] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!firmaAdi.trim()) e.firmaAdi = "Firma adı zorunludur.";
    if (!telefon.trim()) e.telefon = "Telefon numarası zorunludur.";
    else if (!/^[0-9+\s\-()]{7,15}$/.test(telefon.trim())) e.telefon = "Geçerli bir telefon girin.";
    if (!bolge) e.bolge = "Hizmet bölgesi seçiniz.";
    if (!accepted) e.accepted = "Sözleşmeyi kabul etmeniz gerekiyor.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) setSubmitted(true);
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setSubmitted(false);
      setFirmaAdi(""); setTelefon(""); setBolge("");
      setAccepted(false); setErrors({});
    }, 300);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="b2b-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            key="b2b-modal"
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 24 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto pointer-events-auto">

              {/* ── Header ── */}
              <div className="relative bg-gradient-to-br from-primary to-teal-600 px-8 pt-8 pb-7 rounded-t-3xl overflow-hidden">
                <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute bottom-0 left-8 w-24 h-24 bg-black/10 rounded-full blur-2xl" />
                <button
                  onClick={handleClose}
                  className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="relative z-10">
                  <p className="text-white/70 text-sm font-medium uppercase tracking-wider mb-1">CleanLink İş Ortağı</p>
                  <h2 className="text-3xl font-bold text-white mb-1">Ağımıza Katılın</h2>
                  <div className="flex items-baseline gap-1 mt-3">
                    <span className="text-5xl font-extrabold text-white">999</span>
                    <span className="text-2xl font-bold text-white/80">TL</span>
                    <span className="text-white/70 text-base font-medium ml-1">/ Ay</span>
                  </div>
                  <p className="text-white/60 text-sm mt-1">İptal garantisi — İlk ay ücretsiz deneyin</p>
                </div>
              </div>

              <div className="px-8 py-7">

                {/* ── Benefits ── */}
                <div className="mb-7">
                  <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </span>
                    Neden Katılmalısınız?
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {BENEFITS.map(({ icon: Icon, color, bg, title, desc }) => (
                      <div key={title} className={`${bg} rounded-2xl p-4 border border-border/40`}>
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-md`}>
                          <Icon className="w-4 h-4 text-white" strokeWidth={2} />
                        </div>
                        <p className="font-semibold text-sm text-foreground mb-1">{title}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Divider ── */}
                <div className="h-px bg-border mb-6" />

                {submitted ? (
                  /* ── Success state ── */
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center text-center py-6 gap-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle2 className="w-9 h-9 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-1">Başvurunuz Alındı!</h3>
                      <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                        <strong>{firmaAdi}</strong> için kaydınız oluşturuldu. Ekibimiz en kısa sürede <strong>{telefon}</strong> numaralı hattınızı arayacak.
                      </p>
                    </div>
                    <Button onClick={handleClose} className="mt-2 rounded-xl px-8 shadow-lg shadow-primary/20">
                      Kapat
                    </Button>
                  </motion.div>
                ) : (
                  /* ── Registration form ── */
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <h3 className="text-base font-bold text-foreground mb-1">Hızlı Kayıt</h3>
                    <p className="text-sm text-muted-foreground mb-4">3 bilgi ile dakikalar içinde başlayın.</p>

                    {/* Firma Adı */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1.5">
                        <Building2 className="w-3.5 h-3.5 inline mr-1.5 text-primary" />
                        Firma Adı
                      </label>
                      <input
                        type="text"
                        value={firmaAdi}
                        onChange={e => { setFirmaAdi(e.target.value); setErrors(v => ({ ...v, firmaAdi: "" })); }}
                        placeholder="Temizlik firmanızın adı"
                        className={`w-full border-2 rounded-xl px-4 py-3 outline-none transition-colors text-foreground font-medium text-sm ${errors.firmaAdi ? "border-destructive bg-destructive/5" : "border-border focus:border-primary"}`}
                      />
                      {errors.firmaAdi && <p className="text-destructive text-xs mt-1">{errors.firmaAdi}</p>}
                    </div>

                    {/* Telefon */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1.5">
                        <Phone className="w-3.5 h-3.5 inline mr-1.5 text-primary" />
                        Yetkili Telefonu
                      </label>
                      <input
                        type="tel"
                        value={telefon}
                        onChange={e => { setTelefon(e.target.value); setErrors(v => ({ ...v, telefon: "" })); }}
                        placeholder="0532 000 00 00"
                        className={`w-full border-2 rounded-xl px-4 py-3 outline-none transition-colors text-foreground font-medium text-sm ${errors.telefon ? "border-destructive bg-destructive/5" : "border-border focus:border-primary"}`}
                      />
                      {errors.telefon && <p className="text-destructive text-xs mt-1">{errors.telefon}</p>}
                    </div>

                    {/* Hizmet Bölgesi */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1.5">
                        <MapPin className="w-3.5 h-3.5 inline mr-1.5 text-primary" />
                        Hizmet Bölgesi
                      </label>
                      <div className="relative">
                        <select
                          value={bolge}
                          onChange={e => { setBolge(e.target.value); setErrors(v => ({ ...v, bolge: "" })); }}
                          className={`w-full border-2 rounded-xl px-4 py-3 outline-none transition-colors text-foreground font-medium text-sm appearance-none bg-white cursor-pointer ${errors.bolge ? "border-destructive bg-destructive/5" : "border-border focus:border-primary"}`}
                        >
                          <option value="" disabled>Bölge seçiniz...</option>
                          {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      </div>
                      {errors.bolge && <p className="text-destructive text-xs mt-1">{errors.bolge}</p>}
                    </div>

                    {/* Terms checkbox */}
                    <div className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-colors cursor-pointer ${errors.accepted ? "border-destructive bg-destructive/5" : accepted ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                      onClick={() => { setAccepted(a => !a); setErrors(v => ({ ...v, accepted: "" })); }}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${accepted ? "bg-primary border-primary" : "border-border bg-white"}`}>
                        {accepted && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <p className="text-sm text-foreground leading-relaxed select-none">
                        <span className="font-semibold">CleanLink İş Ortağı Sözleşmesi</span>'ni ve{" "}
                        <span className="font-semibold text-primary">%10 Komisyon Modelini</span> okudum, kabul ediyorum.
                      </p>
                    </div>
                    {errors.accepted && <p className="text-destructive text-xs -mt-2">{errors.accepted}</p>}

                    {/* Submit */}
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full h-14 rounded-xl font-bold text-base gap-2 shadow-xl shadow-primary/25 hover:shadow-primary/35 transition-all hover:-translate-y-0.5 mt-2"
                    >
                      Şimdi Aboneliğinizi Başlatın ve Panelinize Erişin
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      İlk ay ücretsiz · İptal garantisi · 7/24 destek
                    </p>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
