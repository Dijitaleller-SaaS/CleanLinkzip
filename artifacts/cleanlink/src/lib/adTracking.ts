export interface AdEntry { timestamp: number; orderId?: string; }
export interface AdConversionsData {
  calls: AdEntry[];
  quotes: AdEntry[];
  adOrders: AdEntry[];
}

const KEY = "ad_conversions";

export function loadAdConversions(): AdConversionsData {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : { calls: [], quotes: [], adOrders: [] };
  } catch {
    return { calls: [], quotes: [], adOrders: [] };
  }
}

function saveAdConversions(data: AdConversionsData) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function trackAdCall() {
  const d = loadAdConversions();
  d.calls.push({ timestamp: Date.now() });
  saveAdConversions(d);
  window.dispatchEvent(new Event("ad_conversions_updated"));
}

export function trackAdQuote() {
  const d = loadAdConversions();
  d.quotes.push({ timestamp: Date.now() });
  saveAdConversions(d);
  window.dispatchEvent(new Event("ad_conversions_updated"));
}

export function trackAdOrder(orderId: string) {
  const d = loadAdConversions();
  d.adOrders.push({ timestamp: Date.now(), orderId });
  saveAdConversions(d);
  window.dispatchEvent(new Event("ad_conversions_updated"));
}

export function isAdSession(): boolean {
  return sessionStorage.getItem("cleanlink_ref") === "ads";
}

export interface AdBudgetInfo {
  toplamHavuz: number;
  harcananButce: number;
  kalanBakiye: number;
  kullanimYuzdesi: number;
}

export function exportAdConversionsJson(firmName: string, budget?: AdBudgetInfo) {
  const data = loadAdConversions();
  const payload: Record<string, unknown> = {
    firma: firmName,
    exportedAt: new Date().toISOString(),
    summary: {
      telefonTiklamalari: data.calls.length,
      alinanTeklifler: data.quotes.length,
      reklamSiparisleri: data.adOrders.length,
    },
    ...(budget ? { butceDurumu: budget } : {}),
    rawData: data,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cleanlink_reklam_raporu_${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function filterByPeriod<T extends { timestamp: number }>(
  entries: T[],
  period: "week" | "month"
): T[] {
  const cutoff = Date.now() - (period === "week" ? 7 : 30) * 24 * 60 * 60 * 1000;
  return entries.filter(e => e.timestamp > cutoff);
}
