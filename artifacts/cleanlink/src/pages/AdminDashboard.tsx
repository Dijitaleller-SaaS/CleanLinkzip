import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, TrendingUp, FileText, Bell,
  CheckCircle2, CalendarClock, EyeOff, Eye,
  LogOut, AlertTriangle, Clock, Crown, BadgeCheck,
  Plus, Trash2, Edit3, Save, X, BookOpen,
  FileEdit, Package, Sparkles, RefreshCw, Loader2,
  ClipboardList, Phone, Mail, Star, Layers,
  ShieldCheck, ScrollText, Scale, Search, ChevronDown, ExternalLink,
  ShieldAlert, Hash, Wifi, Activity,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { useApp, ADMIN_EMAIL } from "@/context/AppContext";
import {
  apiAdminGetVendors, apiAdminGetFinancial, apiAdminGetNotifications,
  apiAdminApprove, apiAdminExtend, apiAdminSetVisibility, apiAdminRemoveSubscription, apiAdminSetPackage,
  apiGetBlogPosts, apiCreateBlogPost, apiUpdateBlogPost, apiDeleteBlogPost,
  apiGetPageContent, apiUpdatePageContent,
  apiAdminGetPilotApplications, apiAdminDeletePilotApplication,
  apiAdminGetOrders, apiAdminUpdateOrderStatus,
  apiAdminGetTransactionAuditLog,
  type AdminVendor, type AdminFinancial, type AdminNotifications, type CmsBlogPost, type PilotApplicationApi, type AdminOrder, type TransactionAuditLogEntry,
} from "@/lib/api";

/* ─────────────────────────────────────
   Types
──────────────────────────────────────*/
type AdminTab = "firmalar" | "siparisler" | "finansal" | "cms" | "bildirimler" | "guvenlik";
type CMSSubTab =
  | "blog"
  | "hakkimizda"
  | "pilot"
  | "pilot-sartlari"
  | "basvurular"
  | "kvkk"
  | "gizlilik"
  | "kosullar"
  | "cerez"
  | "kariyer"
  | "iletisim";

/* ─────────────────────────────────────
   Status helper
──────────────────────────────────────*/
const SUB_MS  = 30 * 24 * 60 * 60 * 1000;
const DAY5_MS =  5 * 24 * 60 * 60 * 1000;

function isExpired(v: AdminVendor): boolean {
  if (!v.yayinaGirisTarihi) return false;
  return Date.now() - v.yayinaGirisTarihi > SUB_MS;
}

function isExpiringSoon(v: AdminVendor): boolean {
  if (!v.yayinaGirisTarihi || isExpired(v)) return false;
  const expiresAt = v.yayinaGirisTarihi + SUB_MS;
  return expiresAt - Date.now() <= DAY5_MS;
}

function vendorDurum(v: AdminVendor): { label: string; color: string } {
  const exp = isExpired(v);
  if (v.isSponsor && !exp)                         return { label: "Elite",          color: "bg-amber-100 text-amber-700" };
  if (v.isSubscribed && !v.isSponsor && !exp)      return { label: "Standart",       color: "bg-teal-100 text-teal-700" };
  if (v.subscriptionPending && !v.isSubscribed)    return { label: "Onay Bekliyor",  color: "bg-blue-100 text-blue-700" };
  if (exp)                                         return { label: "Süresi Doldu",   color: "bg-red-100 text-red-600" };
  return { label: "Pasif", color: "bg-gray-100 text-gray-500" };
}

function subEndDate(v: AdminVendor): string | null {
  if (!v.yayinaGirisTarihi) return null;
  const endMs = v.yayinaGirisTarihi + SUB_MS;
  return new Date(endMs).toLocaleDateString("tr-TR");
}

/* ─────────────────────────────────────
   Loading / Error helpers
──────────────────────────────────────*/
function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

function ErrorBox({ msg, onRetry }: { msg: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <AlertTriangle className="w-8 h-8 text-rose-500" />
      <p className="text-sm text-rose-600">{msg}</p>
      <button onClick={onRetry}
        className="text-xs font-bold text-primary hover:underline">
        Tekrar Dene
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Firma Yönetimi Tab
═══════════════════════════════════════════ */
type FirmaFilter = "tümü" | "crm" | "yeni" | "sponsor";

function FirmaTab() {
  const [vendors, setVendors] = useState<AdminVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [filter, setFilter] = useState<FirmaFilter>("tümü");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setVendors(await apiAdminGetVendors());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const [search, setSearch] = useState("");

  const filtered = vendors.filter(v => {
    const exp = isExpired(v);
    const matchFilter =
      filter === "crm"     ? (v.isSubscribed && !v.isSponsor) && !exp :
      filter === "sponsor" ? v.isSponsor && !exp :
      filter === "yeni"    ? (!v.isPublished && !v.isSubscribed && !v.isSponsor) :
      true;
    const q = search.toLowerCase().trim();
    const matchSearch = !q || v.name.toLowerCase().includes(q) || v.email.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const handleApprove = async (id: number) => {
    setBusy(id);
    try {
      const updated = await apiAdminApprove(id);
      setVendors(vs => vs.map(v => v.id === id ? { ...v, ...updated } : v));
    } catch (e) { alert((e as Error).message); }
    finally { setBusy(null); }
  };

  const handleExtend = async (id: number) => {
    setBusy(id);
    try {
      const updated = await apiAdminExtend(id);
      setVendors(vs => vs.map(v => v.id === id ? { ...v, ...updated } : v));
    } catch (e) { alert((e as Error).message); }
    finally { setBusy(null); }
  };

  const handleVisibility = async (v: AdminVendor) => {
    setBusy(v.id);
    const willHide = !v.isAdminHidden;
    try {
      const updated = await apiAdminSetVisibility(v.id, willHide);
      setVendors(vs => vs.map(x => x.id === v.id ? { ...x, ...updated } : x));
    } catch (e) { alert((e as Error).message); }
    finally { setBusy(null); }
  };

  const handleRemoveSubscription = async (v: AdminVendor) => {
    if (!confirm(`"${v.name}" firmasının sponsor/CRM üyeliği kaldırılsın mı? Bu işlem geri alınamaz.`)) return;
    setBusy(v.id);
    try {
      const updated = await apiAdminRemoveSubscription(v.id);
      setVendors(vs => vs.map(x => x.id === v.id ? { ...x, ...updated } : x));
    } catch (e) { alert((e as Error).message); }
    finally { setBusy(null); }
  };

  const handleSetPackage = async (id: number, updates: { isSubscribed?: boolean; isSponsor?: boolean }) => {
    setBusy(id);
    try {
      const updated = await apiAdminSetPackage(id, updates);
      setVendors(vs => vs.map(x => x.id === id ? { ...x, ...updated } : x));
    } catch (e) { alert((e as Error).message); }
    finally { setBusy(null); }
  };

  const filterTabs: { key: FirmaFilter; label: string }[] = [
    { key: "tümü",   label: `Tümü (${vendors.length})` },
    { key: "yeni",   label: `Pasif / Onay Bekliyor (${vendors.filter(v => !v.isPublished && !v.isSubscribed && !v.isSponsor).length})` },
    { key: "crm",    label: `CRM Üye (${vendors.filter(v => v.isSubscribed && !v.isSponsor && !isExpired(v)).length})` },
    { key: "sponsor", label: `Sponsor (${vendors.filter(v => v.isSponsor && !isExpired(v)).length})` },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-foreground">Firma Yönetimi</h2>
        <button onClick={load}
          className="p-2 rounded-xl hover:bg-secondary text-muted-foreground transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Arama kutusu */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="İsim veya e-posta ile ara…"
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl outline-none focus:border-primary transition-colors bg-white"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {filterTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              filter === tab.key
                ? "bg-primary text-white border-primary"
                : "bg-white text-muted-foreground border-border hover:border-primary/40"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : error ? <ErrorBox msg={error} onRetry={load} /> : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-white rounded-2xl border border-border">
          <Building2 className="w-10 h-10 mx-auto text-border mb-3" />
          <p>Bu filtre için kayıtlı firma yok.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(v => {
            const hidden      = v.isAdminHidden;
            const st          = vendorDurum(v);
            const endDate     = subEndDate(v);
            const isNew       = Date.now() - v.joinedAt < 24 * 60 * 60 * 1000;
            const exp         = isExpired(v);
            const expSoon     = isExpiringSoon(v);
            const isBusy      = busy === v.id;

            return (
              <div key={v.id}
                className={`bg-white border rounded-2xl p-5 shadow-sm transition-opacity ${
                  hidden ? "opacity-50" : ""
                } ${v.subscriptionPending ? "border-blue-200" : expSoon ? "border-amber-300" : exp ? "border-red-100" : "border-border"}`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      v.isSponsor ? "bg-amber-100" : "bg-primary/10"
                    }`}>
                      {v.isSponsor
                        ? <Crown className="w-5 h-5 text-amber-600" />
                        : <Building2 className="w-5 h-5 text-primary" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground truncate">{v.name}</p>
                        <span className="text-xs text-muted-foreground">{v.email}</span>
                        {isNew && (
                          <span className="text-[10px] font-bold bg-primary text-white px-1.5 py-0.5 rounded-full">YENİ</span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                        {hidden && (
                          <span className="text-[10px] font-bold bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">GİZLİ</span>
                        )}
                        {expSoon && !exp && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" /> 5 gün kaldı
                          </span>
                        )}
                        {v.havaleRefCode && (
                          <span className="text-[10px] font-mono bg-secondary px-1.5 py-0.5 rounded">
                            Havale: {v.havaleRefCode}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Paket: <span className="font-medium">{v.paket ?? v.havalePkg ?? "—"}</span>
                        {endDate && <span className="ml-2">· Bitiş: <span className={`font-medium ${expSoon && !exp ? "text-amber-600" : ""}`}>{endDate}</span></span>}
                        {exp && <span className="ml-2 text-red-500 font-medium">· Süresi dolmuş!</span>}
                        {v.activatedAt && <span className="ml-2">· Aktif: <span className="font-medium">{new Date(v.activatedAt).toLocaleDateString("tr-TR")}</span></span>}
                        <span className="ml-2">· Katıldı: {new Date(v.joinedAt).toLocaleDateString("tr-TR")}</span>
                      </p>
                      {(v.city || v.district) && (
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          📍 <span className="font-medium">{[v.city, v.district].filter(Boolean).join(" / ")}</span>
                          {v.hasPati && <span className="ml-1">🐾 Pati</span>}
                          {v.isNatureFriendly && <span className="ml-1">🌳 Doğa Dostu</span>}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 flex-shrink-0">
                    {/* Profil/Ödeme Onayla — pasif ya da onay bekleyen tüm firmalar için */}
                    {!v.isPublished && !v.isSubscribed && !v.isSponsor && (
                      <button disabled={isBusy} onClick={() => handleApprove(v.id)}
                        className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 rounded-xl px-3 py-2 transition-colors">
                        {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        {v.havaleRefCode ? "Ödeme Onayla" : "Profil Onayla"}
                      </button>
                    )}
                    {(v.isSubscribed || v.isSponsor) && (
                      <button disabled={isBusy} onClick={() => handleExtend(v.id)}
                        className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl px-3 py-2 transition-colors">
                        {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CalendarClock className="w-3.5 h-3.5" />}
                        +30 Gün Uzat
                      </button>
                    )}
                    {/* Yayından Kaldır / Gizle — sadece yayındaki firmalar için göster */}
                    {v.isPublished && (
                      <button disabled={isBusy} onClick={() => handleVisibility(v)}
                        className={`flex items-center gap-1.5 text-xs font-bold rounded-xl px-3 py-2 transition-colors disabled:opacity-60 ${
                          hidden
                            ? "text-white bg-teal-600 hover:bg-teal-700"
                            : "text-white bg-rose-500 hover:bg-rose-600"
                        }`}>
                        {isBusy
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        {hidden ? "Gizlemeyi Kaldır" : "Yayından Kaldır"}
                      </button>
                    )}
                    {(v.isSubscribed || v.isSponsor || v.subscriptionPending) && (
                      <button disabled={isBusy} onClick={() => handleRemoveSubscription(v)}
                        className="flex items-center gap-1.5 text-xs font-bold text-white bg-gray-500 hover:bg-gray-600 disabled:opacity-60 rounded-xl px-3 py-2 transition-colors">
                        {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        Üyelik Kaldır
                      </button>
                    )}
                  </div>

                  {/* ── Master Test Paneli — yalnızca "Cleanlink Temizlik" profili için ── */}
                  {v.email === "merhaba@dijitaleller.com" && (
                    <div className="w-full mt-3 pt-3 border-t border-dashed border-amber-200">
                      <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" /> Master Test Paneli
                      </p>
                      <div className="flex gap-6">
                        {/* CRM Paketi toggle */}
                        <div className="flex items-center gap-2.5">
                          <button
                            disabled={!!isBusy}
                            onClick={() => handleSetPackage(v.id, {
                              isSubscribed: !v.isSubscribed,
                              ...(v.isSubscribed ? { isSponsor: false } : {}),
                            })}
                            className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 disabled:opacity-50 ${
                              v.isSubscribed ? "bg-primary" : "bg-gray-300"
                            }`}
                          >
                            {isBusy
                              ? <Loader2 className="absolute inset-0 m-auto w-3 h-3 animate-spin text-white" />
                              : <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${v.isSubscribed ? "translate-x-5" : "translate-x-0.5"}`} />
                            }
                          </button>
                          <div>
                            <p className="text-xs font-semibold text-foreground leading-tight">CRM Paketi</p>
                            <p className="text-[10px] text-muted-foreground">Standart · 999 TL/Ay</p>
                          </div>
                        </div>
                        {/* Elite Vitrin toggle */}
                        <div className="flex items-center gap-2.5">
                          <button
                            disabled={!!isBusy || (!v.isSubscribed && !v.isSponsor)}
                            onClick={() => handleSetPackage(v.id, { isSponsor: !v.isSponsor })}
                            title={!v.isSubscribed && !v.isSponsor ? "Önce CRM aktif edilmeli" : undefined}
                            className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 disabled:opacity-40 ${
                              v.isSponsor ? "bg-amber-500" : "bg-gray-300"
                            }`}
                          >
                            {isBusy
                              ? <Loader2 className="absolute inset-0 m-auto w-3 h-3 animate-spin text-white" />
                              : <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${v.isSponsor ? "translate-x-5" : "translate-x-0.5"}`} />
                            }
                          </button>
                          <div>
                            <p className="text-xs font-semibold text-foreground leading-tight">Elite Vitrin</p>
                            <p className={`text-[10px] ${!v.isSubscribed && !v.isSponsor ? "text-rose-400" : "text-muted-foreground"}`}>
                              {!v.isSubscribed && !v.isSponsor ? "CRM önce gerekli" : "5.000 TL/Ay"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   Finansal Dashboard Tab
═══════════════════════════════════════════ */
function FinansalTab() {
  const [fin, setFin] = useState<AdminFinancial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setFin(await apiAdminGetFinancial()); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner />;
  if (error || !fin) return <ErrorBox msg={error ?? "Yüklenemedi"} onRetry={load} />;

  const stats = [
    { label: "Aylık Toplam Gelir",   value: `${fin.totalRevenue.toLocaleString("tr-TR")} TL`, icon: TrendingUp, color: "from-primary to-teal-600" },
    { label: "Standart Üye",         value: String(fin.standart),  icon: Package, color: "from-teal-400 to-emerald-500" },
    { label: "Elite Üye",            value: String(fin.elite),     icon: Crown,   color: "from-amber-400 to-orange-500" },
    { label: "Reklam Havuzu (%60)",  value: `${fin.reklamHavuzu.toLocaleString("tr-TR")} TL`, icon: Sparkles, color: "from-violet-500 to-purple-600" },
  ];

  const chartData = [
    { name: "Standart",      gelir: fin.standartRevenue, color: "#14b8a6" },
    { name: "Elite",         gelir: fin.eliteRevenue,    color: "#f59e0b" },
    { name: "Reklam (%60)",  gelir: fin.reklamHavuzu,    color: "#8b5cf6" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="text-2xl font-bold text-foreground mb-6">Finansal Dashboard</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl border border-border p-5 shadow-sm">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-md`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-border p-6 shadow-sm mb-6">
        <h3 className="font-semibold text-foreground mb-5">Gelir Dağılımı (TL)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
            <Tooltip formatter={(v: number) => [`${v.toLocaleString("tr-TR")} TL`]} />
            <Bar dataKey="gelir" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-5 h-5 text-teal-700" />
            <h3 className="font-semibold text-teal-900">Standart Paket</h3>
          </div>
          <p className="text-3xl font-black text-teal-700">999 <span className="text-base font-semibold">TL/ay</span></p>
          <p className="text-xs text-teal-600 mt-1">{fin.standart} aktif · {fin.standartRevenue.toLocaleString("tr-TR")} TL/ay</p>
          {fin.pending > 0 && <p className="text-xs text-amber-600 mt-2 font-medium">{fin.pending} onay bekleyen</p>}
          {fin.expired > 0 && <p className="text-xs text-red-500 mt-1 font-medium">{fin.expired} süresi dolmuş</p>}
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Crown className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-amber-900">Elite (VIP) Paket</h3>
          </div>
          <p className="text-3xl font-black text-amber-600">5.000 <span className="text-base font-semibold">TL/ay</span></p>
          <p className="text-xs text-amber-700 mt-1">{fin.elite} aktif · {fin.eliteRevenue.toLocaleString("tr-TR")} TL/ay</p>
          <p className="text-xs text-violet-600 mt-2 font-medium">
            Reklam havuzu: {fin.reklamHavuzu.toLocaleString("tr-TR")} TL (%60)
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   CMS — Blog Editor
═══════════════════════════════════════════ */
const POST_GRADIENTS = [
  { gradient: "from-emerald-50 to-teal-50",  border: "border-emerald-200", dot: "bg-emerald-500" },
  { gradient: "from-blue-50 to-indigo-50",   border: "border-blue-200",    dot: "bg-blue-500" },
  { gradient: "from-purple-50 to-violet-50", border: "border-purple-200",  dot: "bg-purple-500" },
  { gradient: "from-rose-50 to-pink-50",     border: "border-rose-200",    dot: "bg-rose-500" },
  { gradient: "from-amber-50 to-orange-50",  border: "border-amber-200",   dot: "bg-amber-500" },
];

type BlogDraft = { id?: number; title: string; category: string; postDate: string; readTime: string; excerpt: string; sortOrder: number };
const EMPTY_DRAFT: BlogDraft = { title: "", category: "", postDate: "", readTime: "", excerpt: "", sortOrder: 0 };

const DRAFT_LABELS: Partial<Record<keyof BlogDraft, string>> = {
  title: "Başlık", category: "Kategori", postDate: "Tarih",
  readTime: "Okuma Süresi", excerpt: "Özet",
};

function BlogEditor() {
  const [posts, setPosts] = useState<CmsBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<BlogDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setPosts(await apiGetBlogPosts()); }
    catch { /* keep current */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      if (draft.id) {
        const updated = await apiUpdateBlogPost(draft.id, draft);
        setPosts(ps => ps.map(p => p.id === draft.id ? updated : p));
      } else {
        const created = await apiCreateBlogPost(draft);
        setPosts(ps => [...ps, created]);
      }
      setDraft(null);
    } catch (e) { alert((e as Error).message); }
    finally { setSaving(false); }
  };

  const del = async (id: number) => {
    setDeleting(id);
    try {
      await apiDeleteBlogPost(id);
      setPosts(ps => ps.filter(p => p.id !== id));
    } catch (e) { alert((e as Error).message); }
    finally { setDeleting(null); }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" /> Blog Yazıları
        </h3>
        <button onClick={() => setDraft({ ...EMPTY_DRAFT })}
          className="flex items-center gap-1.5 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-xl px-3 py-2 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Yeni Yazı
        </button>
      </div>

      <div className="space-y-3 mb-4">
        {posts.length === 0 && !draft && (
          <p className="text-sm text-muted-foreground text-center py-8 bg-secondary/30 rounded-2xl border border-border">
            Henüz blog yazısı yok. Yeni ekleyin.
          </p>
        )}
        {posts.map((post, i) => {
          const g = POST_GRADIENTS[i % POST_GRADIENTS.length];
          return (
            <div key={post.id} className={`bg-gradient-to-br ${g.gradient} border ${g.border} rounded-xl p-4 flex items-start gap-3`}>
              <span className={`w-2 h-2 rounded-full ${g.dot} mt-1.5 flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm">{post.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{post.category} · {post.postDate} · {post.readTime} okuma</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{post.excerpt}</p>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button onClick={() => setDraft({ ...post })}
                  className="p-1.5 rounded-lg hover:bg-white/60 text-muted-foreground hover:text-foreground transition-colors">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button disabled={deleting === post.id} onClick={() => del(post.id)}
                  className="p-1.5 rounded-lg hover:bg-rose-100 text-muted-foreground hover:text-rose-600 disabled:opacity-60 transition-colors">
                  {deleting === post.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {draft && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-white border border-primary/30 rounded-2xl p-5 shadow-sm">
            <p className="font-semibold text-foreground mb-4">{draft.id ? "Yazıyı Düzenle" : "Yeni Yazı"}</p>
            <div className="space-y-3">
              {(["title","category","postDate","readTime","excerpt"] as const).map(field => (
                <div key={field}>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{DRAFT_LABELS[field]}</label>
                  {field === "excerpt" ? (
                    <textarea rows={3} value={draft[field]}
                      onChange={e => setDraft(d => d ? { ...d, [field]: e.target.value } : d)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                  ) : (
                    <input type="text" value={draft[field]}
                      onChange={e => setDraft(d => d ? { ...d, [field]: e.target.value } : d)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button disabled={saving} onClick={save}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-primary hover:bg-primary/90 disabled:opacity-60 rounded-xl px-4 py-2 transition-colors">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Kaydet
              </button>
              <button onClick={() => setDraft(null)}
                className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border rounded-xl px-4 py-2 transition-colors">
                <X className="w-3.5 h-3.5" /> Vazgeç
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── PageContentEditor ─── */
function PageContentEditor({
  pageKey,
  fields,
}: {
  pageKey: string;
  fields: { key: string; label: string; placeholder: string }[];
}) {
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiGetPageContent(pageKey)
      .then(c => setContent(c))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [pageKey]);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await apiUpdatePageContent(pageKey, content);
      setContent(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { alert((e as Error).message); }
    finally { setSaving(false); }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-5">Boş bırakırsanız varsayılan içerik gösterilir.</p>
      <div className="space-y-4">
        {fields.map(f => (
          <div key={f.key}>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">{f.label}</label>
            <textarea rows={4} value={content[f.key] ?? ""}
              onChange={e => setContent(c => ({ ...c, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
          </div>
        ))}
      </div>
      <button disabled={saving} onClick={save}
        className={`mt-4 flex items-center gap-1.5 text-xs font-bold rounded-xl px-4 py-2 transition-colors disabled:opacity-60 ${
          saved ? "bg-emerald-600 text-white" : "bg-primary hover:bg-primary/90 text-white"
        }`}>
        {saving
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
        {saved ? "Kaydedildi!" : "Kaydet"}
      </button>
    </div>
  );
}

/* ─── Pilot Applications Tab ─── */
function PilotBasvurulariTab() {
  const [items, setItems]   = useState<PilotApplicationApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setItems(await apiAdminGetPilotApplications()); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: number) => {
    if (!confirm("Bu başvuru silinsin mi?")) return;
    setDeleting(id);
    try {
      await apiAdminDeletePilotApplication(id);
      setItems(prev => prev.filter(x => x.id !== id));
    } catch (e) { alert((e as Error).message); }
    finally { setDeleting(null); }
  };

  if (loading) return <Spinner />;
  if (error)   return <ErrorBox msg={error} onRetry={load} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-foreground">{items.length} başvuru</p>
        <button onClick={load} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Yenile
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Henüz pilot başvurusu yok.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(app => (
            <div key={app.id} className="rounded-2xl border border-border bg-secondary/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-foreground truncate">{app.firmaAdi}</p>
                  <p className="text-xs text-muted-foreground">{app.yetkiliAdi}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(app.createdAt).toLocaleDateString("tr-TR")}
                  </span>
                  <button
                    onClick={() => handleDelete(app.id)}
                    disabled={deleting === app.id}
                    className="w-7 h-7 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    {deleting === app.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Phone className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{app.telefon}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Mail className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{app.email}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <span>Deneyim: {app.deneyim} yıl</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Layers className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{app.ekipman}</span>
                </div>
              </div>

              {app.hizmetler.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {app.hizmetler.map(h => (
                    <span key={h} className="text-[10px] bg-primary/10 text-primary rounded-full px-2 py-0.5">{h}</span>
                  ))}
                </div>
              )}

              {app.googleLink && (
                <a href={app.googleLink} target="_blank" rel="noreferrer"
                  className="mt-2 flex items-center gap-1 text-[10px] text-blue-600 hover:underline">
                  <Star className="w-3 h-3" /> Google Yorum Linki
                </a>
              )}

              {app.notlar && (
                <p className="mt-2 text-[11px] text-muted-foreground bg-white rounded-xl px-3 py-2 border border-border">
                  {app.notlar}
                </p>
              )}

              {/* ── Hukuki Onay Geçmişi ── */}
              <div className={`mt-3 rounded-xl px-3 py-2.5 border ${
                app.sartlariOkudum
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-red-50 border-red-200"
              }`}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Scale className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                  <span className="text-[11px] font-bold text-emerald-800">Hukuki Onay Geçmişi</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                  <div>
                    <span className="text-muted-foreground">Şart Onayı:</span>{" "}
                    <span className={`font-semibold ${app.sartlariOkudum ? "text-emerald-700" : "text-red-600"}`}>
                      {app.sartlariOkudum ? "✓ Kabul Edildi" : "✗ Kabul Edilmedi"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Belge Versiyonu:</span>{" "}
                    <span className="font-mono font-semibold text-foreground">
                      {app.onaylananVersiyon || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Kabul Tarihi:</span>{" "}
                    <span className="font-semibold text-foreground">
                      {app.onayTarihi
                        ? new Date(app.onayTarihi).toLocaleString("tr-TR", {
                            day: "numeric", month: "long", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })
                        : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">IP Adresi:</span>{" "}
                    <span className="font-mono text-foreground">{app.onayIp || "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── CMS Tab ─── */
function CMSTab() {
  const [sub, setSub] = useState<CMSSubTab>("blog");

  const subTabs: { key: CMSSubTab; label: string; icon: typeof BookOpen; group: string }[] = [
    { key: "blog",        label: "Blog",             icon: BookOpen,      group: "İçerik" },
    { key: "hakkimizda",  label: "Hakkımızda",       icon: FileEdit,      group: "İçerik" },
    { key: "kariyer",     label: "Kariyer",           icon: Sparkles,      group: "İçerik" },
    { key: "iletisim",    label: "İletişim",          icon: Mail,          group: "İçerik" },
    { key: "pilot",         label: "Pilot Sayfası",     icon: FileText,      group: "Hukuki" },
    { key: "pilot-sartlari", label: "Pilot Şart Maddeler", icon: ShieldCheck, group: "Hukuki" },
    { key: "kvkk",        label: "KVKK",             icon: ShieldCheck,   group: "Hukuki" },
    { key: "gizlilik",    label: "Gizlilik",          icon: ShieldCheck,   group: "Hukuki" },
    { key: "kosullar",    label: "Kullanım Koşulları", icon: ScrollText,   group: "Hukuki" },
    { key: "cerez",       label: "Çerez Politikası", icon: Package,       group: "Hukuki" },
    { key: "basvurular",  label: "Pilot Başvuruları", icon: ClipboardList, group: "Yönetim" },
  ];

  const groups = ["İçerik", "Hukuki", "Yönetim"];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="text-2xl font-bold text-foreground mb-6">İçerik Yönetimi (CMS)</h2>

      <div className="space-y-2 mb-6">
        {groups.map(group => (
          <div key={group} className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-16 flex-shrink-0">{group}</span>
            {subTabs.filter(t => t.group === group).map(t => {
              const Icon = t.icon;
              return (
                <button key={t.key} onClick={() => setSub(t.key)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all border ${
                    sub === t.key
                      ? "bg-primary text-white border-primary shadow"
                      : "bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}>
                  <Icon className="w-3.5 h-3.5" /> {t.label}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
        {sub === "blog" && <BlogEditor />}

        {sub === "hakkimizda" && (
          <PageContentEditor pageKey="hakkimizda" fields={[
            { key: "metaTitle",       label: "Meta Başlık (SEO)",       placeholder: "Hakkımızda | CleanLink" },
            { key: "metaDescription", label: "Meta Açıklama (SEO)",     placeholder: "CleanLink hakkında..." },
            { key: "h1",              label: "Ana Başlık",              placeholder: "Temizlikte Yeni Standart" },
            { key: "h2",              label: "Giriş Açıklaması",        placeholder: "CleanLink, güvenilir temizlik..." },
            { key: "vizyon",          label: "Vizyonumuz Metni",        placeholder: "Türkiye'nin her şehrinde..." },
            { key: "yesil",           label: "Yeşil Misyon Metni",      placeholder: "Her 2.500 TL üzeri hizmette..." },
          ]} />
        )}

        {sub === "kariyer" && (
          <PageContentEditor pageKey="kariyer" fields={[
            { key: "metaTitle",       label: "Meta Başlık (SEO)",       placeholder: "Kariyer | CleanLink" },
            { key: "metaDescription", label: "Meta Açıklama (SEO)",     placeholder: "CleanLink'te kariyer fırsatları..." },
            { key: "h1",              label: "Ana Başlık",              placeholder: "CleanLink Ailesine Katılın" },
            { key: "h2",              label: "Giriş Açıklaması",        placeholder: "Temizlik sektörünü dönüştürme..." },
            { key: "pos1",            label: "Pozisyon 1 (ad|birim|konum|tür)", placeholder: "Ürün Müdürü|Ürün|İstanbul (Hibrit)|Tam Zamanlı" },
            { key: "pos2",            label: "Pozisyon 2 (ad|birim|konum|tür)", placeholder: "Frontend Geliştirici|Mühendislik|Uzaktan|Tam Zamanlı" },
            { key: "pos3",            label: "Pozisyon 3 (ad|birim|konum|tür)", placeholder: "Müşteri Başarı Uzmanı|Müşteri Deneyimi|İstanbul|Tam Zamanlı" },
            { key: "pos4",            label: "Pozisyon 4 (ad|birim|konum|tür)", placeholder: "Satış Geliştirme|Satış|İstanbul|Tam Zamanlı" },
          ]} />
        )}

        {sub === "iletisim" && (
          <PageContentEditor pageKey="iletisim" fields={[
            { key: "metaTitle",       label: "Meta Başlık (SEO)",       placeholder: "İletişim | CleanLink" },
            { key: "metaDescription", label: "Meta Açıklama (SEO)",     placeholder: "CleanLink ile iletişime geçin..." },
            { key: "h1",              label: "Ana Başlık",              placeholder: "Bize Ulaşın" },
            { key: "h2",              label: "Giriş Açıklaması",        placeholder: "Sorularınız için ekibimiz..." },
            { key: "email",           label: "E-posta Adresi",          placeholder: "destek@cleanlink.com.tr" },
            { key: "telefon",         label: "Telefon Numarası",        placeholder: "0850 333 44 55" },
            { key: "adres1",          label: "Adres Satır 1",           placeholder: "Maslak Mah. Büyükdere Cad." },
            { key: "adres2",          label: "Adres Satır 2",           placeholder: "No: 255 Sarıyer / İstanbul" },
            { key: "mesaiSaatleri",   label: "Mesai Saatleri",          placeholder: "Hft–Cts: 09:00 – 18:00" },
          ]} />
        )}

        {sub === "pilot" && (
          <PageContentEditor pageKey="pilot" fields={[
            { key: "metaTitle",       label: "Meta Başlık (SEO)",       placeholder: "Pilot Program | CleanLink" },
            { key: "metaDescription", label: "Meta Açıklama (SEO)",     placeholder: "CleanLink pilot program..." },
            { key: "h1",              label: "Ana Başlık",              placeholder: "Pilot Çalışma Programı" },
            { key: "h2",              label: "Alt Başlık",              placeholder: "Şişli bölgesi için özel fırsat" },
            { key: "kontenjan",       label: "Kontenjan Metni",         placeholder: "Şişli bölgesi pilot programı..." },
          ]} />
        )}

        {sub === "pilot-sartlari" && (
          <PageContentEditor pageKey="pilot-sartlari" fields={[
            { key: "versiyon",        label: "Belge Versiyonu",          placeholder: "v1.0-20260501" },
            { key: "gecerlilikTarihi", label: "Geçerlilik Tarihi",       placeholder: "1 Mayıs 2026" },
            { key: "madde1Baslik",    label: "1. Madde Başlığı",         placeholder: "Pilot Süresi" },
            { key: "madde1Metin",     label: "1. Madde Metni",           placeholder: "CleanLink Pilot Çalışma süreci toplam 3 ay (90 gün)..." },
            { key: "madde2Baslik",    label: "2. Madde Başlığı",         placeholder: "Öğrenme Evresi" },
            { key: "madde2Metin",     label: "2. Madde Metni",           placeholder: "İlk 30 gün Google Ads ve sistem algoritmalarının..." },
            { key: "madde3Baslik",    label: "3. Madde Başlığı",         placeholder: "Bütçe Dağılımı" },
            { key: "madde3Metin",     label: "3. Madde Metni",           placeholder: "Sponsorluk bedelinin %80'i doğrudan reklam havuzuna..." },
            { key: "hukukiNot",       label: "Hukuki Not (Alt Uyarı)",   placeholder: "Bu şartları kabul ederek imzaladığınız beyan..." },
          ]} />
        )}

        {sub === "kvkk" && (
          <PageContentEditor pageKey="kvkk" fields={[
            { key: "metaTitle",       label: "Meta Başlık (SEO)",                    placeholder: "KVKK Aydınlatma Metni | CleanLink" },
            { key: "sonGuncelleme",   label: "Son Güncelleme Tarihi",               placeholder: "1 Ocak 2026" },
            { key: "uyari",           label: "Uyarı Kutusu Metni",                  placeholder: "Bu belge taslak niteliğinde..." },
            { key: "s1",              label: "1 — Aydınlatma Metninin Amacı",       placeholder: "Bu metin, 6698 sayılı..." },
            { key: "s2",              label: "2 — Veri Sorumlusunun Kimliği",       placeholder: "Unvan: CleanLink..." },
            { key: "s3",              label: "3 — İşlenen Kişisel Veri Kategorileri", placeholder: "Kimlik bilgileri..." },
            { key: "s4",              label: "4 — Verilerin İşlenme Amaçları",      placeholder: "KVKK madde 5/2 kapsamında..." },
            { key: "s5",              label: "5 — Verilerin Aktarıldığı Taraflar",  placeholder: "Kişisel verileriniz..." },
            { key: "s6",              label: "6 — Verilerin Toplanma Yöntemi",      placeholder: "Kişisel verileriniz..." },
            { key: "s7",              label: "7 — Veri Sahibinin Hakları",          placeholder: "Veri sorumlusuna başvurarak..." },
            { key: "s8",              label: "8 — Başvuru Hakkı ve Yöntemi",        placeholder: "KVKK kapsamındaki haklarınızı..." },
          ]} />
        )}

        {sub === "gizlilik" && (
          <PageContentEditor pageKey="gizlilik" fields={[
            { key: "metaTitle",       label: "Meta Başlık (SEO)",         placeholder: "Gizlilik Politikası | CleanLink" },
            { key: "sonGuncelleme",   label: "Son Güncelleme Tarihi",     placeholder: "1 Ocak 2026" },
            { key: "uyari",           label: "Uyarı Kutusu Metni",        placeholder: "Bu belge taslak niteliğinde..." },
            { key: "s1",              label: "1 — Veri Sorumlusu",        placeholder: "CleanLink Teknoloji A.Ş..." },
            { key: "s2",              label: "2 — Toplanan Veriler",      placeholder: "Platformu kullanırken..." },
            { key: "s3",              label: "3 — Verilerin Kullanım Amaçları", placeholder: "Kişisel verileriniz..." },
            { key: "s4",              label: "4 — Verilerin Paylaşımı",   placeholder: "Verileriniz..." },
            { key: "s5",              label: "5 — Saklanma Süresi",       placeholder: "Kişisel verileriniz..." },
            { key: "s6",              label: "6 — Güvenlik Önlemleri",    placeholder: "Verileriniz SSL/TLS..." },
            { key: "s7",              label: "7 — Çerezler",              placeholder: "Platformumuz çerezler..." },
            { key: "s8",              label: "8 — Haklarınız",            placeholder: "KVKK'nın 11. maddesi..." },
          ]} />
        )}

        {sub === "kosullar" && (
          <PageContentEditor pageKey="kosullar" fields={[
            { key: "metaTitle",       label: "Meta Başlık (SEO)",           placeholder: "Kullanım Koşulları | CleanLink" },
            { key: "sonGuncelleme",   label: "Son Güncelleme Tarihi",       placeholder: "1 Ocak 2026" },
            { key: "uyari",           label: "Uyarı Kutusu Metni",          placeholder: "Bu belge taslak niteliğinde..." },
            { key: "s1",              label: "1 — Taraflar ve Kapsam",      placeholder: "Bu Kullanım Koşulları..." },
            { key: "s2",              label: "2 — Hizmetin Tanımı",         placeholder: "CleanLink, temizlik..." },
            { key: "s3",              label: "3 — Üyelik ve Hesap Güvenliği", placeholder: "Platforma üye olmak..." },
            { key: "s4",              label: "4 — Ödemeler ve İptal Politikası", placeholder: "Ödemeler güvenli..." },
            { key: "s5",              label: "5 — Yasaklı Kullanımlar",    placeholder: "Platformu yasa dışı..." },
            { key: "s6",              label: "6 — Sorumluluk Sınırlaması", placeholder: "CleanLink, firmalar..." },
            { key: "s7",              label: "7 — Fikri Mülkiyet",         placeholder: "CleanLink platformu..." },
            { key: "s8",              label: "8 — Koşulların Değiştirilmesi", placeholder: "CleanLink, bu Koşulları..." },
            { key: "s9",              label: "9 — Uygulanacak Hukuk",      placeholder: "Bu Koşullar Türk hukukuna..." },
          ]} />
        )}

        {sub === "cerez" && (
          <PageContentEditor pageKey="cerez" fields={[
            { key: "metaTitle",       label: "Meta Başlık (SEO)",            placeholder: "Çerez Politikası | CleanLink" },
            { key: "sonGuncelleme",   label: "Son Güncelleme Tarihi",        placeholder: "1 Ocak 2026" },
            { key: "uyari",           label: "Uyarı Kutusu Metni",           placeholder: "Bu belge taslak niteliğinde..." },
            { key: "giris",           label: "Giriş Paragrafı",              placeholder: "CleanLink olarak, platformumuzu..." },
            { key: "zorunlu",         label: "Zorunlu Çerezler Açıklaması",  placeholder: "Platformun temel işlevleri için..." },
            { key: "islevsel",        label: "İşlevsel Çerezler Açıklaması", placeholder: "Dil tercihleri, tema ayarları..." },
            { key: "analitik",        label: "Analitik Çerezler Açıklaması", placeholder: "Ziyaretçilerin platformu nasıl..." },
            { key: "pazarlama",       label: "Pazarlama Çerezleri Açıklaması", placeholder: "Yalnızca açık rızanız..." },
            { key: "yonetme",         label: "Çerez Tercihlerini Yönetme",   placeholder: "Tarayıcınızın ayarlar menüsünden..." },
            { key: "ucuncu_taraf",    label: "Üçüncü Taraf Çerezler",        placeholder: "Ödeme işlemleri ve analitik..." },
            { key: "iletisim_text",   label: "İletişim Metni",               placeholder: "Çerez politikamıza ilişkin..." },
          ]} />
        )}

        {sub === "basvurular" && <PilotBasvurulariTab />}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   Siparişler Tab
═══════════════════════════════════════════ */
const ORDER_STATUS_MAP: Record<string, { label: string; color: string }> = {
  beklemede:    { label: "Beklemede",    color: "bg-yellow-100 text-yellow-700" },
  onaylandi:    { label: "Onaylandı",    color: "bg-teal-100 text-teal-700" },
  tamamlandi:   { label: "Tamamlandı",   color: "bg-gray-100 text-gray-600" },
  iptal:        { label: "İptal",        color: "bg-red-100 text-red-600" },
  onayBekliyor: { label: "Onay Bekliyor", color: "bg-blue-100 text-blue-700" },
  kesinlesti:   { label: "Kesinleşti",   color: "bg-green-100 text-green-700" },
  reddedildi:   { label: "Reddedildi",   color: "bg-red-100 text-red-600" },
  zamanAsimi:   { label: "Zaman Aşımı", color: "bg-orange-100 text-orange-700" },
};

type OrderFilter = "tümü" | "beklemede" | "onaylandi" | "tamamlandi" | "iptal";

function SiparislerTab() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderFilter>("tümü");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setOrders(await apiAdminGetOrders()); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStatus = async (id: string, status: string) => {
    setBusy(id);
    try {
      const updated = await apiAdminUpdateOrderStatus(id, status);
      setOrders(os => os.map(o => o.id === id ? { ...o, ...updated } : o));
    } catch (e) { alert((e as Error).message); }
    finally { setBusy(null); }
  };

  const filterCounts = {
    tümü:       orders.length,
    beklemede:  orders.filter(o => o.status === "beklemede").length,
    onaylandi:  orders.filter(o => ["onaylandi", "onayBekliyor", "kesinlesti"].includes(o.status)).length,
    tamamlandi: orders.filter(o => o.status === "tamamlandi").length,
    iptal:      orders.filter(o => ["iptal", "reddedildi", "zamanAsimi"].includes(o.status)).length,
  };

  const filterTabs: { key: OrderFilter; label: string }[] = [
    { key: "tümü",       label: `Tümü (${filterCounts.tümü})` },
    { key: "beklemede",  label: `Beklemede (${filterCounts.beklemede})` },
    { key: "onaylandi",  label: `Aktif (${filterCounts.onaylandi})` },
    { key: "tamamlandi", label: `Tamamlanan (${filterCounts.tamamlandi})` },
    { key: "iptal",      label: `İptal (${filterCounts.iptal})` },
  ];

  const filtered = orders.filter(o => {
    const matchFilter =
      filter === "beklemede"  ? o.status === "beklemede" :
      filter === "onaylandi"  ? ["onaylandi", "onayBekliyor", "kesinlesti"].includes(o.status) :
      filter === "tamamlandi" ? o.status === "tamamlandi" :
      filter === "iptal"      ? ["iptal", "reddedildi", "zamanAsimi"].includes(o.status) :
      true;
    const q = search.toLowerCase().trim();
    const matchSearch = !q ||
      o.customerName.toLowerCase().includes(q) ||
      o.vendorName.toLowerCase().includes(q) ||
      o.service.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-foreground">Tüm Siparişler</h2>
        <button onClick={load} className="p-2 rounded-xl hover:bg-secondary text-muted-foreground transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Arama */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Müşteri, firma, hizmet veya sipariş no…"
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl outline-none focus:border-primary transition-colors bg-white"
        />
      </div>

      {/* Filtre sekmeleri */}
      <div className="flex flex-wrap gap-2 mb-5">
        {filterTabs.map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              filter === tab.key
                ? "bg-primary text-white border-primary"
                : "bg-white text-muted-foreground border-border hover:border-primary/40"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : error ? <ErrorBox msg={error} onRetry={load} /> : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-white rounded-2xl border border-border">
          <ClipboardList className="w-10 h-10 mx-auto text-border mb-3" />
          <p>Bu filtre için sipariş yok.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(o => {
            const st = ORDER_STATUS_MAP[o.status] ?? { label: o.status, color: "bg-gray-100 text-gray-600" };
            const isExpanded = expanded === o.id;
            const isBusy = busy === o.id;
            return (
              <div key={o.id} className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
                {/* Header row */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : o.id)}
                  className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground truncate">{o.customerName}</span>
                      <span className="text-xs text-muted-foreground">→ {o.vendorName}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                      {o.ecoOption && (
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full">🌱 Eko</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {o.service} · <span className="font-semibold text-foreground">{o.total.toLocaleString("tr-TR")} TL</span>
                      {o.requestedDate && <> · {o.requestedDate} {o.requestedTimeSlot}</>}
                      <span className="ml-2 font-mono text-[10px]">#{o.id.slice(-8)}</span>
                    </p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-border px-5 py-4 space-y-3 bg-secondary/20">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                      <div><span className="text-muted-foreground">Telefon:</span> <span className="font-medium">{o.customerPhone || "—"}</span></div>
                      <div><span className="text-muted-foreground">İlçe/Mahalle:</span> <span className="font-medium">{o.ilce} / {o.mahalle}</span></div>
                      <div className="col-span-2"><span className="text-muted-foreground">Adres:</span> <span className="font-medium">{o.adres || "—"}</span></div>
                      <div><span className="text-muted-foreground">Oluşturuldu:</span> <span className="font-medium">{new Date(o.createdAt).toLocaleString("tr-TR")}</span></div>
                      <div><span className="text-muted-foreground">Kilit:</span> <span className="font-medium">{o.unlockedAt ? "Açıldı" : "Kilitli"}</span></div>
                    </div>

                    {/* Durum güncelle */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="text-xs text-muted-foreground self-center font-semibold">Durum:</span>
                      {["beklemede", "onaylandi", "tamamlandi", "iptal"].map(s => (
                        <button key={s}
                          disabled={isBusy || o.status === s}
                          onClick={() => handleStatus(o.id, s)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors disabled:opacity-50 ${
                            o.status === s
                              ? "bg-primary text-white border-primary"
                              : "bg-white text-muted-foreground border-border hover:border-primary/50"
                          }`}>
                          {isBusy && o.status !== s ? <Loader2 className="w-3 h-3 animate-spin" /> : (ORDER_STATUS_MAP[s]?.label ?? s)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   Bildirimler Tab
═══════════════════════════════════════════ */
function BildirimlerTab() {
  const [notifs, setNotifs] = useState<AdminNotifications | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setNotifs(await apiAdminGetNotifications()); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner />;
  if (error || !notifs) return <ErrorBox msg={error ?? "Yüklenemedi"} onRetry={load} />;

  const total = notifs.newFirms.length + notifs.pendingFirms.length + notifs.expiredFirms.length;

  const sections = [
    {
      label: "Yeni Kayıtlar",
      icon: BadgeCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50 border-emerald-200",
      items: notifs.newFirms,
      sub: (it: { joinedAt: string }) => `Katıldı: ${new Date(it.joinedAt).toLocaleDateString("tr-TR")}`,
    },
    {
      label: "Ödeme Bekleyenler",
      icon: Clock,
      color: "text-blue-600",
      bg: "bg-blue-50 border-blue-200",
      items: notifs.pendingFirms,
      sub: (it: { joinedAt: string }) => `Katıldı: ${new Date(it.joinedAt).toLocaleDateString("tr-TR")}`,
    },
    {
      label: "Süresi Dolmuş",
      icon: AlertTriangle,
      color: "text-red-500",
      bg: "bg-red-50 border-red-200",
      items: notifs.expiredFirms,
      sub: (it: { joinedAt: string }) => `Katıldı: ${new Date(it.joinedAt).toLocaleDateString("tr-TR")}`,
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Bildirimler</h2>
        <button onClick={load}
          className="p-2 rounded-xl hover:bg-secondary text-muted-foreground transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {total === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-white rounded-2xl border border-border">
          <Bell className="w-10 h-10 mx-auto text-border mb-3" />
          <p>Bekleyen bildirim yok.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sections.map(s => {
            if (s.items.length === 0) return null;
            const Icon = s.icon;
            return (
              <div key={s.label}>
                <div className={`flex items-center gap-2 mb-3`}>
                  <Icon className={`w-4 h-4 ${s.color}`} />
                  <h3 className="font-semibold text-foreground text-sm">{s.label}</h3>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.color} bg-opacity-10`}>
                    {s.items.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {s.items.map(item => (
                    <div key={item.id} className={`${s.bg} border rounded-xl px-4 py-3 flex items-center gap-3`}>
                      <Icon className={`w-4 h-4 ${s.color} flex-shrink-0`} />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{s.sub(item)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   Güvenlik Kanıtı Tab
═══════════════════════════════════════════ */
const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  order_created:    { label: "Sipariş Oluşturuldu",  color: "bg-blue-100 text-blue-700" },
  order_tamamlandi: { label: "Tamamlandı",            color: "bg-green-100 text-green-700" },
  order_onaylandi:  { label: "Onaylandı",             color: "bg-teal-100 text-teal-700" },
  order_iptal:      { label: "İptal Edildi",          color: "bg-rose-100 text-rose-700" },
};

function GuvenlikTab() {
  const [logs, setLogs] = useState<TransactionAuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setLogs(await apiAdminGetTransactionAuditLog()); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = logs.filter(l => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      l.transactionId.toLowerCase().includes(q) ||
      l.actionType.toLowerCase().includes(q) ||
      l.ipAddress.includes(q) ||
      JSON.stringify(l.meta).toLowerCase().includes(q)
    );
  });

  return (
    <motion.div key="guvenlik" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Güvenlik Kanıtı</h2>
            <p className="text-[11px] text-muted-foreground">Tüm sipariş ve sözleşme işlemlerinin değiştirilemez kaydı</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground bg-secondary px-2.5 py-1 rounded-lg">
            {filtered.length} kayıt
          </span>
          <button onClick={load} className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-primary/5 border border-primary/20 rounded-lg px-3 py-1.5 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Yenile
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="İşlem ID, IP adresi, aksiyon türü ile ara..."
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {Object.entries(ACTION_LABELS).map(([key, cfg]) => {
          const count = logs.filter(l => l.actionType === key).length;
          return (
            <div key={key} className="bg-white border border-border rounded-xl p-3 text-center">
              <p className="text-xl font-extrabold text-foreground">{count}</p>
              <p className={`text-[10px] font-bold mt-0.5 px-1.5 py-0.5 rounded-full inline-block ${cfg.color}`}>{cfg.label}</p>
            </div>
          );
        })}
      </div>

      {loading ? <Spinner /> : error ? <ErrorBox msg={error} onRetry={load} /> : filtered.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl py-16 text-center text-muted-foreground text-sm">
          Henüz kayıt yok
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(log => {
            const cfg = ACTION_LABELS[log.actionType] ?? { label: log.actionType, color: "bg-gray-100 text-gray-600" };
            const meta = log.meta as Record<string, unknown>;
            return (
              <div key={log.id} className="bg-white border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-start gap-3">
                {/* Left: action badge */}
                <div className="flex-shrink-0 flex items-center gap-2 sm:w-44">
                  <Activity className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${cfg.color}`}>{cfg.label}</span>
                </div>
                {/* Middle: details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
                      <Hash className="w-3 h-3" />{log.transactionId}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Wifi className="w-3 h-3" />{log.ipAddress || "—"}
                    </span>
                    <span className="text-[10px] text-muted-foreground border border-border rounded-md px-1.5 py-0.5">
                      v{log.documentVersion}
                    </span>
                  </div>
                  {Object.keys(meta).length > 0 && (
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                      {meta.service && <span>Hizmet: <strong className="text-foreground">{String(meta.service)}</strong></span>}
                      {meta.total !== undefined && <span>Tutar: <strong className="text-foreground">{Number(meta.total).toLocaleString("tr-TR")} TL</strong></span>}
                      {meta.vendorName && <span>Firma: <strong className="text-foreground">{String(meta.vendorName)}</strong></span>}
                      {meta.customerName && <span>Müşteri: <strong className="text-foreground">{String(meta.customerName)}</strong></span>}
                      {meta.actorRole && <span>İşlemi Yapan: <strong className="text-foreground">{String(meta.actorRole)}</strong></span>}
                    </div>
                  )}
                </div>
                {/* Right: timestamp */}
                <div className="flex-shrink-0 text-right">
                  <p className="text-[11px] font-semibold text-foreground">
                    {new Date(log.timestamp).toLocaleDateString("tr-TR")}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(log.timestamp).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </p>
                  {log.userId && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">UID: {log.userId}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   Main AdminDashboard
═══════════════════════════════════════════ */
export default function AdminDashboard() {
  const { user, logout } = useApp();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<AdminTab>("firmalar");
  const [notifCount, setNotifCount] = useState(0);

  const isAdmin = user?.role === "admin" || user?.email === ADMIN_EMAIL || user?.email === "serkcel@gmail.com";

  /* Redirect if not admin */
  useEffect(() => {
    if (user !== undefined && !isAdmin) {
      navigate("/");
    }
  }, [user, navigate, isAdmin]);

  /* Notification badge */
  useEffect(() => {
    if (!isAdmin) return;
    apiAdminGetNotifications()
      .then(n => setNotifCount(n.newFirms.length + n.pendingFirms.length + n.expiredFirms.length))
      .catch(() => {});
  }, [user]);

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const navTabs: { key: AdminTab; label: string; icon: typeof Building2 }[] = [
    { key: "firmalar",    label: "Firmalar",    icon: Building2 },
    { key: "siparisler",  label: "Siparişler",  icon: ClipboardList },
    { key: "finansal",    label: "Finansal",    icon: TrendingUp },
    { key: "cms",         label: "CMS",         icon: FileText },
    { key: "bildirimler", label: "Bildirimler", icon: Bell },
    { key: "guvenlik",    label: "Güvenlik",    icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center shadow">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground leading-none">CleanLink Admin</p>
              <p className="text-[10px] text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.open("/?mode=site", "_blank")}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary border border-border rounded-xl px-3 py-2 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" /> CleanLink Site
            </button>
            <button onClick={() => { logout(); navigate("/"); }}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border rounded-xl px-3 py-2 transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Çıkış
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <aside className="lg:w-52 flex-shrink-0">
          <nav className="bg-white rounded-2xl border border-border shadow-sm p-2 flex flex-row lg:flex-col gap-1">
            {navTabs.map(t => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`relative flex items-center gap-2.5 text-sm font-semibold px-3 py-2.5 rounded-xl w-full transition-all ${
                    active
                      ? "bg-primary text-white shadow-md"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}>
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden lg:block">{t.label}</span>
                  {t.key === "bildirimler" && notifCount > 0 && (
                    <span className={`absolute top-1.5 right-1.5 min-w-[18px] h-[18px] text-[10px] font-black rounded-full flex items-center justify-center px-1 ${
                      active ? "bg-white text-primary" : "bg-rose-500 text-white"
                    }`}>
                      {notifCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div key={tab}>
              {tab === "firmalar"    && <FirmaTab />}
              {tab === "siparisler"  && <SiparislerTab />}
              {tab === "finansal"    && <FinansalTab />}
              {tab === "cms"         && <CMSTab />}
              {tab === "bildirimler" && <BildirimlerTab />}
              {tab === "guvenlik"    && <GuvenlikTab />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
