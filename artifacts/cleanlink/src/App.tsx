import { useState, useEffect, lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from "@/context/AppContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { GoogleConsentModal } from "@/components/auth/GoogleConsentModal";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { KvkkConsent } from "@/components/kvkk/KvkkConsent";
import Home from "@/pages/Home";
const FirmaDashboard    = lazy(() => import("@/pages/FirmaDashboard"));
const AllVendors        = lazy(() => import("@/pages/AllVendors"));
const NotFound          = lazy(() => import("@/pages/not-found"));
const Hakkimizda        = lazy(() => import("@/pages/Hakkimizda"));
const Kariyer           = lazy(() => import("@/pages/Kariyer"));
const Blog              = lazy(() => import("@/pages/Blog"));
const Iletisim          = lazy(() => import("@/pages/Iletisim"));
const KullanimKosullari = lazy(() => import("@/pages/KullanimKosullari"));
const GizlilikPolitikasi= lazy(() => import("@/pages/GizlilikPolitikasi"));
const Kvkk              = lazy(() => import("@/pages/Kvkk"));
const CerezPolitikasi   = lazy(() => import("@/pages/CerezPolitikasi"));
const PilotSartlari     = lazy(() => import("@/pages/PilotSartlari"));
const AdminDashboard    = lazy(() => import("@/pages/AdminDashboard"));
const SifreSifirla      = lazy(() => import("@/pages/SifreSifirla"));
const FirmaProfil       = lazy(() => import("@/pages/FirmaProfil"));
const HizmetSehir       = lazy(() => import("@/pages/HizmetSehir"));
const BlogPost          = lazy(() => import("@/pages/BlogPost"));
const BayiDashboard     = lazy(() => import("@/pages/BayiDashboard"));
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, CheckCircle2, ShoppingBag, Bell, AlertTriangle, Lock, CalendarCheck, ListOrdered, ChevronRight, Phone, LogIn, Search } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  beklemede:    { label: "Beklemede",     color: "bg-yellow-100 text-yellow-700" },
  onayBekliyor: { label: "Onay Bekliyor", color: "bg-blue-100 text-blue-700" },
  onaylandi:    { label: "Onaylandı",     color: "bg-teal-100 text-teal-700" },
  kesinlesti:   { label: "Kesinleşti",    color: "bg-green-100 text-green-700" },
  tamamlandi:   { label: "Tamamlandı",    color: "bg-gray-100 text-gray-600" },
  reddedildi:   { label: "Reddedildi",    color: "bg-red-100 text-red-600" },
  zamanAsimi:   { label: "Zaman Aşımı",  color: "bg-orange-100 text-orange-700" },
};

function CustomerOrdersPanel() {
  const { user, myOrders, showMyOrders, setShowMyOrders, respondToOrder, requestNewTime, setShowAuthModal, setAuthMode } = useApp();
  const [activeTab, setActiveTab] = useState<"aktif" | "tumü">("aktif");

  /* Aktif: beklemede (müşteri talep gönderdi), onayBekliyor (firma karşı teklif verdi), zamanAsimi */
  const aktifRandevular = myOrders.filter(
    o => o.durum === "beklemede" || o.durum === "onayBekliyor" || o.durum === "zamanAsimi"
  );
  const onayBekleyen = myOrders.filter(o => o.durum === "onayBekliyor" && o.visitTime);

  /* Reset to "aktif" tab when panel opens and there are active appointments */
  const handleOpen = () => {
    if (aktifRandevular.length > 0) setActiveTab("aktif");
  };

  const displayList = activeTab === "aktif" ? aktifRandevular : myOrders;

  return (
    <AnimatePresence>
      {showMyOrders && (
        <>
          <motion.div
            key="cop-bd"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[65] bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMyOrders(false)}
          />
          <motion.div
            key="cop-panel"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            onAnimationStart={handleOpen}
            className="fixed right-0 top-0 bottom-0 z-[66] bg-white w-full max-w-sm shadow-2xl flex flex-col"
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-lg text-foreground">Siparişlerim</h2>
                {onayBekleyen.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                    {onayBekleyen.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowMyOrders(false)}
                className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Tab Bar (only shown when logged in) ── */}
            {user && (
            <div className="flex border-b border-border flex-shrink-0">
              <button
                onClick={() => setActiveTab("aktif")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === "aktif"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <CalendarCheck className="w-4 h-4" />
                Aktif Randevular
                {aktifRandevular.length > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    activeTab === "aktif" ? "bg-primary text-white" : "bg-secondary text-muted-foreground"
                  }`}>
                    {aktifRandevular.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("tumü")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === "tumü"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <ListOrdered className="w-4 h-4" />
                Tüm Siparişler
              </button>
            </div>
            )}

            {/* ── Hatırlatıcı Banner ── */}
            <AnimatePresence>
              {activeTab === "aktif" && onayBekleyen.length > 0 && (
                <motion.div
                  key="reminder"
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden flex-shrink-0"
                >
                  <div className="mx-4 mt-4 flex items-start gap-3 bg-primary text-white rounded-2xl px-4 py-3.5">
                    <Bell className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-sm leading-tight">
                        Randevu Saatinizi Onaylayın, Hizmetinizi Garantiye Alın
                      </p>
                      <p className="text-xs text-white/80 mt-0.5">
                        Onaylamazsanız saat 2 saat içinde otomatik iptal olur.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── List ── */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">

              {/* Unauthenticated empty state */}
              {!user && (
                <div className="flex flex-col items-center justify-center text-center py-16 px-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <LogIn className="w-8 h-8 text-primary" />
                  </div>
                  <p className="font-bold text-base text-foreground mb-1">Siparişlerinizi Görüntüleyin</p>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                    Geçmiş ve aktif randevularınızı görmek için lütfen giriş yapın.
                  </p>
                  <button
                    onClick={() => {
                      setShowMyOrders(false);
                      setTimeout(() => { setAuthMode("musteri"); setShowAuthModal(true); }, 200);
                    }}
                    className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    Giriş Yap
                  </button>
                </div>
              )}

              {/* Authenticated empty state */}
              {user && displayList.length === 0 && (
                <div className="text-center text-muted-foreground py-12 text-sm">
                  {activeTab === "aktif" ? (
                    <>
                      <CalendarCheck className="w-10 h-10 mx-auto text-border mb-3" />
                      <p className="font-medium text-foreground">Aktif randevu bulunmuyor.</p>
                      {myOrders.length === 0 ? (
                        <>
                          <p className="text-xs mt-1 mb-5">Henüz hiç sipariş vermediniz. Firma profillerine göz atarak ilk randevunuzu alabilirsiniz.</p>
                          <button
                            onClick={() => setShowMyOrders(false)}
                            className="inline-flex items-center gap-2 bg-primary text-white text-xs font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
                          >
                            <Search className="w-3.5 h-3.5" />
                            Firmaları Keşfet
                          </button>
                        </>
                      ) : (
                        <p className="text-xs mt-1">Randevu aldığınızda veya firma onayladığında burada görünür.</p>
                      )}
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-10 h-10 mx-auto text-border mb-3" />
                      <p className="font-medium text-foreground">Henüz sipariş bulunmuyor.</p>
                      <p className="text-xs mt-1 mb-5">Temizlik veya bakım hizmetleri için firma profillerine göz atın.</p>
                      <button
                        onClick={() => setShowMyOrders(false)}
                        className="inline-flex items-center gap-2 bg-primary text-white text-xs font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
                      >
                        <Search className="w-3.5 h-3.5" />
                        Firmaları Keşfet
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Order cards */}
              {displayList.map(order => {
                const st = ORDER_STATUS[order.durum] ?? ORDER_STATUS.beklemede;
                const isAktif = order.durum === "onayBekliyor" && order.visitTime;
                const isZamanAsimi = order.durum === "zamanAsimi";
                const isKesinlesti = order.durum === "kesinlesti";
                return (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-white border rounded-2xl shadow-sm overflow-hidden ${
                      isAktif ? "border-primary/40 ring-1 ring-primary/20" :
                      isZamanAsimi ? "border-orange-200" :
                      isKesinlesti ? "border-green-200" :
                      "border-border"
                    }`}
                  >
                    {/* Card Header */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-semibold text-sm text-foreground leading-snug">{order.hizmet}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${st.color}`}>
                          {st.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{order.firmaName} · {order.tarih}</p>
                      <p className="font-bold text-primary text-sm mt-1">{order.toplam.toLocaleString("tr-TR")} TL</p>

                      {/* Adres — müşteri kendi adresini her zaman görür */}
                      {order.ilce && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          {isKesinlesti || order.durum === "tamamlandi"
                            ? order.adres ?? order.ilce
                            : order.ilce}
                        </p>
                      )}
                    </div>

                    {/* ── BEKLEMEDE — müşterinin istediği tarih/saat dilimi ── */}
                    {order.durum === "beklemede" && order.istenenTarih && (
                      <div className="border-t border-border bg-secondary/30 px-4 py-3 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">İstenen Tarih & Saat</p>
                          <p className="text-xs font-semibold text-foreground">
                            {order.istenenTarih} · {order.istenenSaatDilimi}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Firma onayı bekleniyor…</p>
                        </div>
                      </div>
                    )}

                    {/* ── AKTİF RANDEVU onay bloğu ── */}
                    {isAktif && (
                      <div className="border-t border-primary/20 bg-primary/5 px-4 py-4">
                        {/* Proposed time — büyük ve belirgin */}
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/30">
                            <Clock className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">Firma Önerilen Saat Aralığı</p>
                            <p className="text-xl font-black text-primary tracking-tight">{order.visitTime}</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">
                          Onaylamazsanız 2 saat içinde otomatik iptal olur.
                        </p>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => respondToOrder(order.id, "onayla")}
                            className="w-full flex items-center justify-center gap-1.5 bg-primary text-white text-sm font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Onayla — Randevuyu Garantile
                          </button>
                          <button
                            onClick={() => requestNewTime(order.id)}
                            className="w-full flex items-center justify-center gap-1.5 border-2 border-orange-300 text-orange-700 text-sm font-semibold py-2.5 rounded-xl hover:bg-orange-50 transition-colors"
                          >
                            <Clock className="w-4 h-4" /> Yeni Saat İste
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Zaman aşımı */}
                    {isZamanAsimi && (
                      <div className="border-t border-orange-200 bg-orange-50 px-4 py-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                        <p className="text-xs text-orange-700 font-semibold">
                          Saat onaylanmadı — firma yeni saat önerecek.
                        </p>
                      </div>
                    )}

                    {/* Kesinleşti — Adres Kilidi Açıldı */}
                    {isKesinlesti && (
                      <div className="border-t border-green-200 bg-green-50 px-4 py-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-green-800 font-bold">Randevu Kesinleşti</p>
                            {order.visitTime && (
                              <p className="text-xs text-green-700 font-semibold">{order.visitTime}</p>
                            )}
                          </div>
                        </div>
                        {order.adres && (
                          <div className="bg-green-100 border border-green-200 rounded-xl px-3 py-2 flex items-start gap-2">
                            <Lock className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" style={{ transform: "rotate(180deg)" }} />
                            <div>
                              <p className="text-[10px] text-green-700 font-semibold uppercase tracking-wide">Adres Kilidi Açıldı</p>
                              <p className="text-xs text-green-900 font-semibold mt-0.5">{order.adres}</p>
                              {order.ilce && <p className="text-[11px] text-green-700">{order.ilce}{order.mahalle ? ` / ${order.mahalle}` : ""}</p>}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── TAMAMLANDI — Fidan Bağış Sertifikası ── */}
                    {order.durum === "tamamlandi" && order.fidanSayisi && (
                      <div className="border-t border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3">
                        <div className="flex items-start gap-3">
                          <div className="text-2xl flex-shrink-0">🌳</div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-green-800">Fidan Bağış Sertifikası</p>
                            <p className="text-[11px] text-green-700 mt-0.5 leading-relaxed">
                              Bu hizmet sayesinde adınıza <strong>{order.fidanSayisi} fidan</strong> dikildi.
                              CleanLink Yeşil Dönüşüm programı kapsamında tescillenmiştir.
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-[10px] bg-green-700 text-white px-2 py-0.5 rounded-full font-semibold">
                                #{order.id} · {order.tarih}
                              </span>
                              {order.ecoOption && (
                                <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-semibold">
                                  🌱 Çevreci Seçenek
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Reddedildi */}
                    {order.durum === "reddedildi" && (
                      <div className="border-t border-red-100 bg-red-50 px-4 py-3">
                        <p className="text-xs text-red-600 font-medium">Randevu reddedildi.</p>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

function Router() {
  const { user } = useApp();
  const [viewFrontend, setViewFrontend] = useState(false);
  const [location] = useLocation();

  // ?mode=site URL parametresi varsa firma redirect'ini bypass et (state'e bağlı değil — auth yüklenince sıfırlanmaz)
  const isSiteMode = new URLSearchParams(window.location.search).get("mode") === "site";

  // Sadece çıkış yapıldığında ön yüz modunu sıfırla (kullanıcı adı değiştiğinde değil)
  useEffect(() => { if (!user) setViewFrontend(false); }, [user]);

  // /firma/:slug gibi halka açık profil sayfalarında firma dashboard'u gösterme
  const isPublicFirmaPage = location.startsWith("/firma/");

  if (user?.type === "firma" && !viewFrontend && !isSiteMode && !isPublicFirmaPage) {
    return (
      <Suspense fallback={<PageLoader />}>
        <FirmaDashboard onGoHome={() => setViewFrontend(true)} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/firmalar" component={AllVendors} />
        <Route path="/firma/:slug" component={FirmaProfil} />
        <Route path="/hizmet/:city/:service" component={HizmetSehir} />
        <Route path="/hakkimizda" component={Hakkimizda} />
        <Route path="/kariyer" component={Kariyer} />
        <Route path="/blog" component={Blog} />
        <Route path="/blog/:slug" component={BlogPost} />
        <Route path="/bayi-dashboard" component={BayiDashboard} />
        <Route path="/iletisim" component={Iletisim} />
        <Route path="/kullanim-kosullari" component={KullanimKosullari} />
        <Route path="/gizlilik-politikasi" component={GizlilikPolitikasi} />
        <Route path="/kvkk" component={Kvkk} />
        <Route path="/cerez-politikasi" component={CerezPolitikasi} />
        <Route path="/pilot-sartlari" component={PilotSartlari} />
        <Route path="/sifre-sifirla" component={SifreSifirla} />
        <Route path="/admin-dashboard" component={AdminDashboard} />
        {/* /firma-dashboard: eğer firma değilse ana sayfaya yönlendir;
            firma kullanıcısı zaten yukarıdaki erken return ile yakalanır */}
        <Route path="/firma-dashboard" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function AppInner() {
  useApp();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("ref") === "ads") {
      sessionStorage.setItem("cleanlink_ref", "ads");
    }
    /* Google OAuth token + URL temizleme AppContext startup verify'da yapılıyor */
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <ScrollToTop />
          <Router />
        </WouterRouter>
        <AuthModal />
        <GoogleConsentModal />
        <CustomerOrdersPanel />
        <KvkkConsent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}

export default App;
