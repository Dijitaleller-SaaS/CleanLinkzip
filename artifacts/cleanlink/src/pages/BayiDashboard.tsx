import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useApp } from "@/context/AppContext";
import { PageLayout } from "@/components/layout/PageLayout";
import { apiBayiMe, type BayiMeResponse } from "@/lib/api";
import { Building2, TrendingUp, Users, Copy, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

export default function BayiDashboard() {
  const { user } = useApp();
  const [, setLocation] = useLocation();
  const [data, setData] = useState<BayiMeResponse | null>(null);
  const [err, setErr] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) { setLocation("/"); return; }
    apiBayiMe()
      .then(setData)
      .catch((e: Error) => setErr(e.message));
  }, [user, setLocation]);

  if (!user) return null;

  if (err) {
    return (
      <PageLayout breadcrumbs={[{ label: "Bayi Paneli" }]}>
        <div className="max-w-2xl mx-auto text-center py-16 px-4">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Bayi Paneline Erişim Yok</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Bu sayfayı sadece CleanLink bayileri görüntüleyebilir. Bayi olmak isterseniz iletişime geçin.
          </p>
          <p className="text-xs text-muted-foreground">{err}</p>
        </div>
      </PageLayout>
    );
  }

  if (!data) {
    return (
      <PageLayout breadcrumbs={[{ label: "Bayi Paneli" }]}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  const fullReferralLink = window.location.origin + data.referralLink;

  return (
    <PageLayout breadcrumbs={[{ label: "Bayi Paneli" }]}>
      <div className="max-w-5xl mx-auto px-4">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">Bayi Paneli</h1>
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">{user.name}</span> · Bölge: {data.bayi.bolge || "—"} · Komisyon Oranı: %{data.bayi.komisyonOrani}
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wide mb-2">
              <Users className="w-4 h-4" /> Atanan Firmalar
            </div>
            <div className="text-3xl font-bold">{data.assignments.length}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {data.assignments.filter(a => a.isSubscribed).length} aktif abonelikli
            </div>
          </div>
          <div className="bg-white border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wide mb-2">
              <Building2 className="w-4 h-4" /> Bu Ay Sipariş
            </div>
            <div className="text-3xl font-bold">{data.monthlyOrders.count}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Toplam ciro: {data.monthlyOrders.total.toLocaleString("tr-TR")} TL
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold uppercase tracking-wide mb-2">
              <TrendingUp className="w-4 h-4" /> Bu Ay Komisyon (Tahmini)
            </div>
            <div className="text-3xl font-bold text-emerald-700">
              {data.monthlyCommission.toLocaleString("tr-TR")} TL
            </div>
            <div className="text-xs text-emerald-700/70 mt-1">
              Hak ediş ay sonu IBAN'ınıza havale edilir
            </div>
          </div>
        </div>

        {/* Referral Link */}
        <div className="bg-white border border-border rounded-2xl p-6 mb-8">
          <h2 className="font-display font-bold text-lg mb-2">Bayi Davet Linkin</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Bu link üzerinden CleanLink'e firma kaydı yapan her işletme otomatik olarak senin portföyüne eklenir ve gelirlerinden komisyon kazanırsın.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={fullReferralLink}
              readOnly
              className="flex-1 px-4 py-2.5 border border-border rounded-xl bg-muted/30 text-sm font-mono"
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(fullReferralLink);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-primary/90"
            >
              {copied ? <><CheckCircle2 className="w-4 h-4" /> Kopyalandı</> : <><Copy className="w-4 h-4" /> Kopyala</>}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Bayi kodun: <span className="font-mono font-semibold text-foreground">{data.bayi.bayiKodu}</span>
          </p>
        </div>

        {/* Vendor List */}
        <div className="bg-white border border-border rounded-2xl p-6 mb-8">
          <h2 className="font-display font-bold text-lg mb-4">Portföyündeki Firmalar</h2>
          {data.assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Henüz atanmış firmanız yok. Davet linkini paylaşmaya başlayın!
            </p>
          ) : (
            <div className="space-y-2">
              {data.assignments.map(a => (
                <div key={a.vendorId} className="flex items-center justify-between p-3 border border-border rounded-xl">
                  <div>
                    <div className="font-semibold text-sm">{a.name}</div>
                    <div className="text-xs text-muted-foreground">{a.email}</div>
                  </div>
                  <div className="text-right">
                    {a.isSubscribed ? (
                      <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                        {a.paket === "elite" ? "Elite" : "Standart"}
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                        Pasif
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Banking Info */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-12">
          <h3 className="font-semibold text-sm mb-2">IBAN Bilgisi</h3>
          <p className="text-xs text-muted-foreground mb-2">
            Hak ediş ödemelerinin yatırılacağı IBAN: {data.bayi.iban || <span className="text-amber-700">Henüz girilmemiş — admin ile iletişime geçin</span>}
          </p>
        </div>

      </div>
    </PageLayout>
  );
}
