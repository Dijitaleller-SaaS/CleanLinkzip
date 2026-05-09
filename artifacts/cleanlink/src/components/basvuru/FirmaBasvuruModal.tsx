import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Rocket, CheckCircle2, Building2, User, Phone,
  Mail, Clock, Wrench, Star, MessageSquare, ExternalLink,
  ChevronRight, ChevronLeft, Layers, ShieldCheck, ChevronDown, ChevronUp,
} from "lucide-react";
import { ADMIN_EMAIL } from "@/context/AppContext";
import { apiSubmitPilotApplication } from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
}

const HIZMET_KATEGORILERI = [
  "Ev Temizliği",
  "Ofis Temizliği",
  "Halı & Koltuk Yıkama",
  "İnşaat Sonrası Temizlik",
  "Araç İç Temizliği",
];

const DENEYIM_SURESI = [
  { value: "0-1", label: "0 – 1 yıl" },
  { value: "1-3", label: "1 – 3 yıl" },
  { value: "3-5", label: "3 – 5 yıl" },
  { value: "5+",  label: "5+ yıl" },
];

const EKIPMAN = [
  { value: "kendi",     label: "Kendi ekipmanımız var" },
  { value: "musteri",   label: "Müşteri malzemesi kullanıyoruz" },
  { value: "her-ikisi", label: "Her ikisi" },
];

interface FormState {
  firmaAdi:       string;
  yetkiliAdi:     string;
  telefon:        string;
  email:          string;
  deneyim:        string;
  hizmetler:      string[];
  ekipman:        string;
  googleLink:     string;
  notlar:         string;
  sartlariOkudum: boolean;
}

const EMPTY: FormState = {
  firmaAdi:       "",
  yetkiliAdi:     "",
  telefon:        "",
  email:          "",
  deneyim:        "",
  hizmetler:      [],
  ekipman:        "",
  googleLink:     "",
  notlar:         "",
  sartlariOkudum: false,
};

function buildMailto(f: FormState): string {
  const subject = encodeURIComponent(`CleanLink Pilot Program Başvurusu – ${f.firmaAdi}`);
  const body = encodeURIComponent(
    `CleanLink Pilot Program Başvurusu\n` +
    `==========================================\n\n` +
    `Firma Adı       : ${f.firmaAdi}\n` +
    `Yetkili Kişi    : ${f.yetkiliAdi}\n` +
    `Telefon         : ${f.telefon}\n` +
    `E-posta         : ${f.email}\n\n` +
    `Sektör Deneyimi : ${DENEYIM_SURESI.find(d => d.value === f.deneyim)?.label ?? f.deneyim}\n` +
    `Hizmet Alanları : ${f.hizmetler.join(", ") || "–"}\n` +
    `Ekipman Durumu  : ${EKIPMAN.find(e => e.value === f.ekipman)?.label ?? f.ekipman}\n\n` +
    `Google Yorum    : ${f.googleLink || "Belirtilmedi"}\n\n` +
    `Ek Notlar / Tanıtım:\n${f.notlar || "–"}`
  );
  return `mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`;
}

export function FirmaBasvuruModal({ open, onClose }: Props) {
  const [step, setStep]           = useState<1 | 2>(1);
  const [form, setForm]           = useState<FormState>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors]       = useState<Partial<Record<keyof FormState, string>>>({});

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: val }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  function toggleHizmet(h: string) {
    setForm(prev => ({
      ...prev,
      hizmetler: prev.hizmetler.includes(h)
        ? prev.hizmetler.filter(x => x !== h)
        : [...prev.hizmetler, h],
    }));
  }

  function validateStep1(): boolean {
    const e: typeof errors = {};
    if (!form.firmaAdi.trim())   e.firmaAdi   = "Firma adı zorunludur";
    if (!form.yetkiliAdi.trim()) e.yetkiliAdi = "Yetkili adı zorunludur";
    if (!form.telefon.trim())    e.telefon    = "Telefon numarası zorunludur";
    if (!form.email.trim())      e.email      = "E-posta adresi zorunludur";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Geçerli bir e-posta girin";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2(): boolean {
    const e: typeof errors = {};
    if (!form.deneyim)              e.deneyim  = "Lütfen bir seçenek belirtin";
    if (form.hizmetler.length === 0) e.hizmetler = "En az bir hizmet seçin";
    if (!form.ekipman)              e.ekipman  = "Lütfen bir seçenek belirtin";
    if (!form.sartlariOkudum)       e.sartlariOkudum = "Pilot şartlarını kabul etmeniz zorunludur";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNext() { if (validateStep1()) setStep(2); }

  async function handleSubmit() {
    if (!validateStep2()) return;
    setSubmitting(true);
    try {
      await apiSubmitPilotApplication({
        firmaAdi:       form.firmaAdi,
        yetkiliAdi:     form.yetkiliAdi,
        telefon:        form.telefon,
        email:          form.email,
        deneyim:        form.deneyim,
        hizmetler:      form.hizmetler,
        ekipman:        form.ekipman,
        googleLink:     form.googleLink || undefined,
        notlar:         form.notlar || undefined,
        sartlariOkudum: true,
      });
    } catch {
      /* API başarısız olursa mailto fallback aç */
      window.open(buildMailto(form), "_blank");
    } finally {
      setSubmitting(false);
      setSubmitted(true);
    }
  }

  function handleClose() {
    onClose();
    setTimeout(() => {
      setStep(1);
      setForm(EMPTY);
      setErrors({});
      setSubmitted(false);
    }, 300);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="fbm-bd"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            key="fbm-panel"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            className="fixed inset-0 z-[71] flex items-center justify-center p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

              {/* ── Header ── */}
              <div className="bg-gradient-to-br from-primary to-primary/80 px-6 py-5 flex items-start justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Rocket className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-white text-lg leading-tight">Pilot Program Başvurusu</h2>
                    <p className="text-white/70 text-xs mt-0.5">Şişli bölgesi · 24 firma kontenjanı</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* ── Step indicator ── */}
              {!submitted && (
                <div className="flex items-center px-6 py-3 border-b border-border bg-secondary/30 flex-shrink-0">
                  {[1, 2].map(s => (
                    <div key={s} className="flex items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        step === s ? "bg-primary text-white" : step > s ? "bg-emerald-500 text-white" : "bg-border text-muted-foreground"
                      }`}>
                        {step > s ? <CheckCircle2 className="w-3.5 h-3.5" /> : s}
                      </div>
                      <span className={`ml-2 text-xs font-medium ${step === s ? "text-foreground" : "text-muted-foreground"}`}>
                        {s === 1 ? "İletişim Bilgileri" : "Hizmet Detayları"}
                      </span>
                      {s < 2 && <div className="mx-3 h-px w-8 bg-border" />}
                    </div>
                  ))}
                </div>
              )}

              {/* ── Content ── */}
              <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">

                  {/* SUCCESS */}
                  {submitted && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center justify-center text-center px-8 py-12"
                    >
                      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-5">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                      </div>
                      <h3 className="text-xl font-display font-bold text-foreground mb-2">Başvurunuz Alındı!</h3>
                      <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
                        Başvurunuz kayıt altına alındı. Ekibimiz en geç <strong>2 iş günü</strong> içinde sizinle iletişime geçecektir.
                      </p>
                      <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-left w-full">
                        <p className="text-xs font-bold text-amber-800 mb-1">Erken Başvuru Avantajı</p>
                        <p className="text-xs text-amber-700 leading-relaxed">
                          Kontenjan sınırlıdır. Erken onaylanan firmalar arama sonuçlarında öncelikli görünüm hakkı kazanır.
                        </p>
                      </div>
                      <button
                        onClick={handleClose}
                        className="mt-6 w-full bg-primary text-white font-bold py-3 rounded-2xl hover:bg-primary/90 transition-colors"
                      >
                        Tamam, Kapat
                      </button>
                    </motion.div>
                  )}

                  {/* STEP 1 */}
                  {!submitted && step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="px-6 py-5 space-y-4"
                    >
                      <Field icon={<Building2 className="w-4 h-4" />} label="Firma Adı" required error={errors.firmaAdi}>
                        <input
                          type="text"
                          value={form.firmaAdi}
                          onChange={e => set("firmaAdi", e.target.value)}
                          placeholder="Örn: Şişli Temizlik Hizmetleri"
                          className={inputCls(!!errors.firmaAdi)}
                        />
                      </Field>

                      <Field icon={<User className="w-4 h-4" />} label="Yetkili Kişi Adı" required error={errors.yetkiliAdi}>
                        <input
                          type="text"
                          value={form.yetkiliAdi}
                          onChange={e => set("yetkiliAdi", e.target.value)}
                          placeholder="Adınız ve soyadınız"
                          className={inputCls(!!errors.yetkiliAdi)}
                        />
                      </Field>

                      <Field icon={<Phone className="w-4 h-4" />} label="Telefon Numarası" required error={errors.telefon}>
                        <input
                          type="tel"
                          value={form.telefon}
                          onChange={e => set("telefon", e.target.value)}
                          placeholder="0 5__ ___ __ __"
                          className={inputCls(!!errors.telefon)}
                        />
                      </Field>

                      <Field icon={<Mail className="w-4 h-4" />} label="E-posta Adresi" required error={errors.email}>
                        <input
                          type="email"
                          value={form.email}
                          onChange={e => set("email", e.target.value)}
                          placeholder="firma@example.com"
                          className={inputCls(!!errors.email)}
                        />
                      </Field>
                    </motion.div>
                  )}

                  {/* STEP 2 */}
                  {!submitted && step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="px-6 py-5 space-y-5"
                    >
                      {/* Deneyim */}
                      <Field icon={<Clock className="w-4 h-4" />} label="Sektördeki Deneyim Süresi" required error={errors.deneyim}>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          {DENEYIM_SURESI.map(d => (
                            <button
                              key={d.value}
                              type="button"
                              onClick={() => set("deneyim", d.value)}
                              className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors ${
                                form.deneyim === d.value
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border bg-white text-muted-foreground hover:border-primary/40"
                              }`}
                            >
                              {d.label}
                            </button>
                          ))}
                        </div>
                      </Field>

                      {/* Hizmet kategorileri */}
                      <Field icon={<Layers className="w-4 h-4" />} label="Hizmet Kategorileri" required error={errors.hizmetler}>
                        <div className="space-y-2 mt-1">
                          {HIZMET_KATEGORILERI.map(h => (
                            <button
                              key={h}
                              type="button"
                              onClick={() => toggleHizmet(h)}
                              className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                                form.hizmetler.includes(h)
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border bg-white text-muted-foreground hover:border-primary/40"
                              }`}
                            >
                              <div className={`w-4 h-4 rounded flex items-center justify-center border-2 flex-shrink-0 ${
                                form.hizmetler.includes(h) ? "border-primary bg-primary" : "border-border"
                              }`}>
                                {form.hizmetler.includes(h) && (
                                  <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 text-white fill-current">
                                    <path d="M2 5l2.5 2.5 3.5-4" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </div>
                              {h}
                            </button>
                          ))}
                        </div>
                      </Field>

                      {/* Ekipman */}
                      <Field icon={<Wrench className="w-4 h-4" />} label="Ekipman Durumu" required error={errors.ekipman}>
                        <div className="space-y-2 mt-1">
                          {EKIPMAN.map(e => (
                            <button
                              key={e.value}
                              type="button"
                              onClick={() => set("ekipman", e.value)}
                              className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                                form.ekipman === e.value
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border bg-white text-muted-foreground hover:border-primary/40"
                              }`}
                            >
                              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                                form.ekipman === e.value ? "border-primary bg-primary" : "border-border"
                              }`}>
                                {form.ekipman === e.value && <div className="w-full h-full rounded-full scale-50 bg-white" />}
                              </div>
                              {e.label}
                            </button>
                          ))}
                        </div>
                      </Field>

                      {/* Google Link */}
                      <Field icon={<Star className="w-4 h-4" />} label="Google Haritalar Yorum Linki" error={undefined}>
                        <input
                          type="url"
                          value={form.googleLink}
                          onChange={e => set("googleLink", e.target.value)}
                          placeholder="https://maps.google.com/..."
                          className={inputCls(false)}
                        />
                        <p className="text-[11px] text-muted-foreground mt-1">İsteğe bağlı — müşteri memnuniyetinizi gösterir</p>
                      </Field>

                      {/* Notlar */}
                      <Field icon={<MessageSquare className="w-4 h-4" />} label="Ek Notlar / Kısa Tanıtım" error={undefined}>
                        <textarea
                          value={form.notlar}
                          onChange={e => set("notlar", e.target.value)}
                          placeholder="Ekibiniz, çalışma bölgeleriniz veya kendinizi öne çıkaran özelliklerinizi kısaca anlatın..."
                          rows={3}
                          className={`${inputCls(false)} resize-none`}
                        />
                      </Field>

                      {/* ── Zorunlu Pilot Şartları Checkbox ── */}
                      <PilotSartlariCheckbox
                        checked={form.sartlariOkudum}
                        error={errors.sartlariOkudum}
                        onChange={v => set("sartlariOkudum", v)}
                      />
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

              {/* ── Footer Actions ── */}
              {!submitted && (
                <div className="px-6 py-4 border-t border-border bg-secondary/20 flex items-center gap-3 flex-shrink-0">
                  {step === 2 && (
                    <button
                      onClick={() => setStep(1)}
                      className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" /> Geri
                    </button>
                  )}
                  <div className="flex-1" />
                  {step === 1 ? (
                    <button
                      onClick={handleNext}
                      className="flex items-center gap-2 bg-primary text-white font-bold px-6 py-2.5 rounded-2xl hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
                    >
                      Devam Et <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={!form.sartlariOkudum || submitting}
                      className="flex items-center gap-2 bg-primary text-white font-bold px-6 py-2.5 rounded-2xl hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : (
                        <ExternalLink className="w-4 h-4" />
                      )}
                      {submitting ? "Gönderiliyor..." : "Başvuruyu Gönder"}
                    </button>
                  )}
                </div>
              )}

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── Pilot Şartları Maddeler (v1.0-20260501) ── */
const PILOT_MADDELER = [
  {
    baslik: "Pilot Süresi",
    metin:
      "CleanLink Pilot Çalışma süreci toplam 3 ay (90 gün) olarak belirlenmiştir. Bu süre zarfında firma, platformda aktif olarak hizmet verebilir ve müşteri siparişlerini alabilir.",
  },
  {
    baslik: "Öğrenme Evresi",
    metin:
      "İlk 30 gün Google Ads ve sistem algoritmalarının 'Öğrenme ve Optimizasyon' sürecidir. Bu süre zarfında doğrudan müşteri trafiği garantisi verilmemektedir. Algoritmalar optimize edildikçe görünürlük artacaktır.",
  },
  {
    baslik: "Bütçe Dağılımı",
    metin:
      "Hedeflenen verimliliğe ulaşılamadığı durumlarda, sponsorluk bedelinin %60'ı doğrudan reklam havuzuna aktarılacak, kalan %40'lık kısım operasyonel maliyetler (platform altyapısı, teknik destek, raporlama) için kullanılacaktır.",
  },
];

export const PILOT_SARTLAR_VERSIYON = "v1.0-20260501";

function PilotSartlariCheckbox({
  checked,
  error,
  onChange,
}: {
  checked: boolean;
  error?: string;
  onChange: (v: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`rounded-2xl border-2 transition-colors ${
      error ? "border-red-300 bg-red-50" : checked ? "border-primary bg-primary/5" : "border-border bg-secondary/30"
    }`}>
      {/* Başlık + Toggle */}
      <div className="p-4">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <div
            role="checkbox"
            aria-checked={checked}
            tabIndex={0}
            onClick={() => onChange(!checked)}
            onKeyDown={e => e.key === " " && onChange(!checked)}
            className={`mt-0.5 w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-colors cursor-pointer ${
              checked ? "border-primary bg-primary" : error ? "border-red-400" : "border-border bg-white"
            }`}
          >
            {checked && (
              <svg viewBox="0 0 10 10" className="w-3 h-3 fill-none">
                <path d="M2 5l2.5 2.5 3.5-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-foreground flex items-center gap-1.5 flex-wrap">
              <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
              Pilot Çalışma Şartlarını Okudum ve Kabul Ediyorum
            </span>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              90 gün pilot süre · 30 gün öğrenme evresi · %60/%40 bütçe dağılımı ·{" "}
              <span className="font-mono">{PILOT_SARTLAR_VERSIYON}</span>
            </p>
          </div>
        </label>

        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="mt-3 ml-8 flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? "Şartları Gizle" : "Tüm Şartları Görüntüle"}
        </button>
      </div>

      {/* Şartlar Detayı */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/60 mx-4 mb-4 pt-4 space-y-4">
              {PILOT_MADDELER.map((m, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{m.baslik}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{m.metin}</p>
                  </div>
                </div>
              ))}
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                <p className="text-[10px] text-amber-700 font-medium">
                  Bu şartları kabul ederek imzaladığınız beyan elektronik ortamda kayıt altına alınmakta ve hukuki geçerlilik taşımaktadır.
                  Belge versiyonu: <span className="font-mono">{PILOT_SARTLAR_VERSIYON}</span>
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="text-red-500 text-xs px-4 pb-3 ml-8">{error}</p>}
    </div>
  );
}

function inputCls(hasError: boolean) {
  return `w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors outline-none focus:ring-2 focus:ring-primary/30 ${
    hasError
      ? "border-red-300 bg-red-50 focus:border-red-400"
      : "border-border bg-white focus:border-primary"
  }`;
}

interface FieldProps {
  icon: React.ReactNode;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

function Field({ icon, label, required, error, children }: FieldProps) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-1.5">
        <span className="text-muted-foreground">{icon}</span>
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
