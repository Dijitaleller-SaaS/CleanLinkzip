import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiMe, apiLogout, apiGetMyVendorProfile, apiUpdateVendorProfile, apiAdminApproveByName, apiAdminExtendByName, apiGetOrders, apiCreateOrder, apiUpdateOrderStatus, apiUnlockOrder, apiGetVendors, type AdminVendor, type OrderApi } from "@/lib/api";

export type UserType = "musteri" | "firma";
export interface AppUser { type: UserType; name: string; email?: string; }

export const ADMIN_EMAIL = "serkan@dijitaleller.com";
export const ADMIN_REMOVED_KEY = "cleanlink_admin_removed_sponsors";
export const MUSTERI_EMAILS_KEY = "cleanlink_musteri_emails";

export function getMusteriEmail(name: string): string {
  try {
    const map: Record<string, string> = JSON.parse(localStorage.getItem(MUSTERI_EMAILS_KEY) || "{}");
    return map[name] ?? "";
  } catch { return ""; }
}

export function saveMusteriEmail(name: string, email: string) {
  if (!name || !email) return;
  try {
    const map: Record<string, string> = JSON.parse(localStorage.getItem(MUSTERI_EMAILS_KEY) || "{}");
    map[name] = email;
    localStorage.setItem(MUSTERI_EMAILS_KEY, JSON.stringify(map));
  } catch {}
}

/* ── Service Key Registry ── */
export const SERVICE_KEYS = [
  "ev1p1", "ev2p1", "ev3p1", "ofis",
  "koltukL", "koltuk3lu", "koltuk2li", "koltukTekli",
  "koltuk2p1", "koltukTakim", "koltukLStd", "berjer", "minderliTakim", "cekyat",
  "aracKoltuk", "sandalye",
  "haliStandart", "haliShaggy", "haliIpek",
  "haliBambuOrijinal", "haliBambuSentetik",
  "haliYun", "haliKilim", "haliMakine",
  "yatak", "yorgan2kisi", "yorgan1kisi", "battaniye",
] as const;

export type ServiceKey = (typeof SERVICE_KEYS)[number];
export type FirmaPrices = Record<ServiceKey, number>;
export type ServiceScopes = Record<ServiceKey, string>;

export interface ServiceMeta {
  label: string;
  unit: string;
  desc: string;
  placeholder: string;
  group: string;
}

export const SERVICE_META: Record<ServiceKey, ServiceMeta> = {
  ev1p1:            { group: "Ev Temizliği",       label: "1+1 Ev Temizliği",         unit: "TL / ziyaret", desc: "Küçük daire standart temizlik", placeholder: "Örn: 1 oda, salon, mutfak, banyo temizliği..." },
  ev2p1:            { group: "Ev Temizliği",       label: "2+1 Ev Temizliği",         unit: "TL / ziyaret", desc: "Standart genel temizlik hizmeti", placeholder: "Örn: Tüm odalar, mutfak tezgahı ve ocak temizliği, banyo dezenfeksiyonu, cam silme..." },
  ev3p1:            { group: "Ev Temizliği",       label: "3+1 Ev Temizliği",         unit: "TL / ziyaret", desc: "Büyük daire, balkon dahil", placeholder: "Örn: Tüm odalar, balkon, dolap içleri ve fırın temizliği dahil..." },
  ofis:             { group: "Ev Temizliği",       label: "Ofis Temizliği",           unit: "TL / gün",    desc: "50m²'ye kadar ofis temizliği", placeholder: "Örn: Açık ofis, ortak alan, mutfak ve tuvalet temizliği..." },
  koltukL:          { group: "Koltuk Yıkama",      label: "L Koltuk / Köşe Takımı Yıkama",   unit: "TL / set",    desc: "L ve köşe koltuk derin temizlik", placeholder: "Örn: Buharlı derin temizlik, leke çıkarma, koku giderme, kolçaklar dahil..." },
  koltuk3lu:        { group: "Koltuk Yıkama",      label: "Üçlü Koltuk Yıkama",              unit: "TL / adet",   desc: "3 kişilik koltuk yıkama", placeholder: "Örn: Kumaş veya deri, buharlı temizlik, hızlı kuruma..." },
  koltuk2li:        { group: "Koltuk Yıkama",      label: "İkili Koltuk Yıkama",              unit: "TL / adet",   desc: "2 kişilik koltuk yıkama", placeholder: "Örn: Kumaş veya deri, buharlı temizlik..." },
  koltukTekli:      { group: "Koltuk Yıkama",      label: "Tekli Koltuk Yıkama",              unit: "TL / adet",   desc: "Tek kişilik koltuk yıkama", placeholder: "Örn: Standart yıkama, köşe koltuğu hariç..." },
  koltuk2p1:        { group: "Koltuk Yıkama",      label: "2+1 Koltuk Yıkama",                unit: "TL / set",    desc: "2+1 koltuk seti komple yıkama", placeholder: "Örn: 2+1 koltuk seti buharlı yıkama, leke çıkarma..." },
  koltukTakim:      { group: "Koltuk Yıkama",      label: "Koltuk Takımı Yıkama",             unit: "TL / set",    desc: "Standart koltuk takımı yıkama", placeholder: "Örn: Komple koltuk takımı derin temizlik..." },
  koltukLStd:       { group: "Koltuk Yıkama",      label: "Standart L Koltuk Yıkama",         unit: "TL / set",    desc: "Standart L koltuk buharlı yıkama", placeholder: "Örn: Standart ölçü L koltuk, buharlı yıkama, hızlı kuruma..." },
  berjer:           { group: "Koltuk Yıkama",      label: "Berjer Yıkama",                    unit: "TL / adet",   desc: "Berjer sandalye buharlı temizlik", placeholder: "Örn: Berjer koltuk derin yıkama, leke çıkarma, koku giderme..." },
  minderliTakim:    { group: "Koltuk Yıkama",      label: "Minderli Koltuk Takımı Yıkama",    unit: "TL / set",    desc: "Minderli koltuk takımı temizliği", placeholder: "Örn: Minder ve oturma birimi buharlı yıkama..." },
  cekyat:           { group: "Koltuk Yıkama",      label: "Çekyat / Kanepe Yıkama",           unit: "TL / adet",   desc: "Çekyat ve kanepe derin yıkama", placeholder: "Örn: Çekyat, kanepe, yataklı koltuk buharlı temizlik..." },
  aracKoltuk:       { group: "Araç Koltuk Yıkama",  label: "Araç Koltuk Yıkama",               unit: "TL / araç",   desc: "Araç içi derin yıkama", placeholder: "Örn: Koltuk ve tavan buharlı yıkama, koku giderme..." },
  sandalye:         { group: "Koltuk Yıkama",       label: "Puf ve Sandalye Yıkama",           unit: "TL / adet",   desc: "Cafe, restoran ve kurumsal", placeholder: "Örn: Toplu yıkama, kuru teslim garantisi..." },
  haliStandart:     { group: "Halı Yıkama",        label: "Makine Halısı (Standart)", unit: "TL / m²",   desc: "Standart makine halısı", placeholder: "Örn: Endüstriyel yıkama, organik deterjan, kuru teslim..." },
  haliShaggy:       { group: "Halı Yıkama",        label: "Shaggy Halı",             unit: "TL / m²",    desc: "Uzun tüylü halı yıkama", placeholder: "Örn: Özel şampuan, yumuşatıcı, uzun tüy derin yıkama..." },
  haliIpek:         { group: "Halı Yıkama",        label: "İpek Halı",               unit: "TL / m²",    desc: "El yapımı ipeğe özel bakım", placeholder: "Örn: El yıkama, özel ipek bakım ürünleri, şekil koruma..." },
  haliBambuOrijinal:{ group: "Halı Yıkama",        label: "Bambu Halı (Orijinal)",   unit: "TL / m²",    desc: "Orijinal bambu halı bakımı", placeholder: "Örn: Bambu özelliklerine uygun özel yıkama prosedürü..." },
  haliBambuSentetik:{ group: "Halı Yıkama",        label: "Bambu Halı (Sentetik)",   unit: "TL / m²",    desc: "Sentetik bambu halı yıkama", placeholder: "Örn: Sentetik bambu için uygun yıkama, hızlı kuruma..." },
  haliYun:          { group: "Halı Yıkama",        label: "Yün Halı",                unit: "TL / m²",    desc: "Yün ve el dokuma halı yıkama", placeholder: "Örn: Yün özelliğine uygun nötr deterjan, düşük ısıda kurutma..." },
  haliKilim:        { group: "Halı Yıkama",        label: "Kilim Yıkama",            unit: "TL / m²",    desc: "El yapımı kilim bakımı", placeholder: "Örn: El yıkama, renk koruma, doğal kuruma..." },
  haliMakine:       { group: "Halı Yıkama",        label: "Makine Halısı (Yün/Pamuk)", unit: "TL / m²", desc: "Yün veya pamuk makine halısı", placeholder: "Örn: Özel yün-pamuk şampuanı, renk canlılaştırma..." },
  yatak:            { group: "Yatak & Yorgan",     label: "Yatak Yıkama",            unit: "TL / adet",  desc: "Çift veya tek kişilik yatak", placeholder: "Örn: Buharlı derin temizlik, akar ısıtma, koku giderme..." },
  yorgan2kisi:      { group: "Yatak & Yorgan",     label: "Yorgan Yıkama (2 Kişilik)", unit: "TL / adet", desc: "Çift kişilik yorgan yıkama", placeholder: "Örn: Özel yorgan yıkama, dolgu koruma, hızlı kuruma..." },
  yorgan1kisi:      { group: "Yatak & Yorgan",     label: "Yorgan Yıkama (1 Kişilik)", unit: "TL / adet", desc: "Tek kişilik yorgan yıkama", placeholder: "Örn: Özel yorgan yıkama, dolgu koruma..." },
  battaniye:        { group: "Yatak & Yorgan",     label: "Battaniye / Yorgan (Tek Kişilik)", unit: "TL / adet", desc: "Battaniye veya ince yorgan", placeholder: "Örn: Çift kişilik 600 TL, tek kişilik bu fiyat..." },
};

export const SERVICE_GROUPS = ["Ev Temizliği", "Koltuk Yıkama", "Araç Koltuk Yıkama", "Halı Yıkama", "Yatak & Yorgan"] as const;

export const TR_REGIONS = [
  "Beşiktaş","Şişli","Kadıköy","Üsküdar","Bakırköy","Beyoğlu","Sarıyer",
  "Ataşehir","Maltepe","Pendik","Bağcılar","Bahçelievler","Gaziosmanpaşa",
  "Küçükçekmece","Avcılar","Fatih","Zeytinburnu","Eyüpsultan","Kartal","Tuzla",
] as const;
export type TRRegion = typeof TR_REGIONS[number];

export const SUB_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export interface FirmaProfileData {
  bio: string;
  phone: string;
  whatsappPhone: string;
  regions: string[];
  isSponsor: boolean;
  isSubscribed: boolean;
  subscriptionPending?: boolean;
  havaleRefCode?: string;
  havalePkg?: "standart" | "elite";
  paket?: "standart" | "elite";
  yayinaGirisTarihi?: number;
  prices: FirmaPrices;
  serviceScopes: ServiceScopes;
  city?: string;
  district?: string;
}

export function isSubExpired(profile: Pick<FirmaProfileData, "yayinaGirisTarihi" | "isSubscribed">): boolean {
  if (!profile.yayinaGirisTarihi) return false;
  return Date.now() - profile.yayinaGirisTarihi > SUB_DURATION_MS;
}

export async function approveFirmaHavale(firmaName: string): Promise<AdminVendor> {
  return apiAdminApproveByName(firmaName);
}

export async function extendFirmaSubscription(firmaName: string): Promise<AdminVendor> {
  return apiAdminExtendByName(firmaName);
}

/* ── Global Vendor Registry ── */
export interface VendorEntry {
  name: string;
  userId?: number;
  isPublished: boolean;
  joinedAt: number;
  isSponsor?: boolean;
  isSubscribed?: boolean;
  yayinaGirisTarihi?: number;
  bio?: string;
  phone?: string;
  regions?: string[];
  prices?: Partial<FirmaPrices>;
  serviceScopes?: Partial<ServiceScopes>;
  galleryUrls?: string[];
  certUrls?: string[];
  city?: string;
  district?: string;
  hasPati?: boolean;
  isNatureFriendly?: boolean;
}

export type OrderDurum =
  | "beklemede"
  | "onayBekliyor"
  | "onaylandi"
  | "kesinlesti"
  | "tamamlandi"
  | "reddedildi"
  | "zamanAsimi";

export interface Order {
  id: string;
  musteri: string;
  musteriEmail?: string;
  telefon?: string;
  firmaName: string;
  vendorUserId?: number;
  hizmet: string;
  toplam: number;
  durum: OrderDurum;
  tarih: string;
  istenenTarih?: string;
  istenenSaatDilimi?: string;
  visitTime?: string;
  proposedAt?: number;
  ilce?: string;
  mahalle?: string;
  adres?: string;
  ecoOption?: boolean;
  fidanSayisi?: number;
  musteriYeniSaatIstedi?: boolean;
  isContactUnlocked?: boolean;
}

const TIMEOUT_MS = 2 * 60 * 60 * 1000;

export interface PendingBookingData {
  firma: { name: string; services: { name: string; price: string; unit: string; scope: string }[] };
  preselectedService?: string;
  preselectedQty?: number;
  /** Giriş sırasında kaydedilen form durumu — giriş sonrası geri yüklenir */
  formState?: {
    checkedNames: string[];
    sqmMap: Record<string, string>;
    selectedDate: string;
    selectedSlot: string;
    ilce: string;
    mahalle: string;
    adres: string;
    telefon: string;
    ecoOption: boolean;
  };
}

interface AppContextValue {
  user: AppUser | null;
  setUser: (u: AppUser | null) => void;
  firmaProfile: FirmaProfileData;
  updateFirmaProfile: (updates: Partial<FirmaProfileData>) => void;
  refreshFirmaProfile: () => Promise<void>;
  firmaPrices: FirmaPrices;
  setFirmaPrices: (p: FirmaPrices) => void;
  serviceScopes: ServiceScopes;
  setServiceScopes: (s: ServiceScopes) => void;
  orders: Order[];
  addOrder: (o: Order & { couponCode?: string }) => void;
  setOrderVisitTime: (orderId: string, time: string) => void;
  approveOrderTime: (orderId: string) => void;
  respondToOrder: (orderId: string, action: "onayla" | "reddet") => void;
  requestNewTime: (orderId: string) => void;
  unlockOrder: (orderId: string) => Promise<void>;
  orderQuotaUsed: number;
  orderQuotaTotal: number;
  orderIsPaid: boolean;
  myOrders: Order[];
  vendors: VendorEntry[];
  refreshVendors: () => Promise<void>;
  isVendorPublished: boolean;
  publishVendorProfile: () => void;
  showAuthModal: boolean;
  setShowAuthModal: (v: boolean) => void;
  authMode: UserType;
  setAuthMode: (m: UserType) => void;
  showMyOrders: boolean;
  setShowMyOrders: (v: boolean) => void;
  logout: () => void;
  pendingBooking: PendingBookingData | null;
  setPendingBooking: (b: PendingBookingData | null) => void;
}

function orderApiToOrder(o: OrderApi): Order {
  return {
    id: o.id,
    musteri: o.customerName,
    telefon: o.customerPhone || undefined,
    firmaName: o.vendorName,
    hizmet: o.service,
    toplam: o.total,
    durum: o.status as OrderDurum,
    tarih: new Date(o.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" }),
    istenenTarih: o.requestedDate || undefined,
    istenenSaatDilimi: o.requestedTimeSlot || undefined,
    visitTime: o.visitTime || undefined,
    ilce: o.ilce || undefined,
    mahalle: o.mahalle || undefined,
    adres: o.adres || undefined,
    ecoOption: o.ecoOption || undefined,
    fidanSayisi: o.treesPlanted || undefined,
    proposedAt: o.proposedAt ? new Date(o.proposedAt).getTime() : undefined,
    musteriYeniSaatIstedi: o.musteriYeniSaatIstedi || undefined,
    isContactUnlocked: o.isContactUnlocked,
  };
}

const USER_KEY = "cleanlink_user";
export const firmaKey = (name: string) => `cleanlink_firma_${encodeURIComponent(name)}`;

export const defaultPrices: FirmaPrices = {
  ev1p1: 0, ev2p1: 0, ev3p1: 0, ofis: 0,
  koltukL: 0, koltuk3lu: 0, koltuk2li: 0, koltukTekli: 0,
  koltuk2p1: 0, koltukTakim: 0, koltukLStd: 0, berjer: 0, minderliTakim: 0, cekyat: 0,
  aracKoltuk: 0, sandalye: 0,
  haliStandart: 0, haliShaggy: 0, haliIpek: 0,
  haliBambuOrijinal: 0, haliBambuSentetik: 0,
  haliYun: 0, haliKilim: 0, haliMakine: 0,
  yatak: 0, yorgan2kisi: 0, yorgan1kisi: 0, battaniye: 0,
};

export const defaultScopes: ServiceScopes = SERVICE_KEYS.reduce((acc, k) => ({ ...acc, [k]: "" }), {} as ServiceScopes);

export const defaultFirmaProfile: FirmaProfileData = {
  bio: "", phone: "", whatsappPhone: "", regions: [], isSponsor: false, isSubscribed: false,
  prices: defaultPrices, serviceScopes: defaultScopes,
};

export function loadFirmaProfile(_name: string): FirmaProfileData {
  return defaultFirmaProfile;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AppUser | null>(() => {
    try { const s = localStorage.getItem(USER_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
  });

  /* Verify JWT on startup — sync server-side user state.
     Also handles #google_token=JWT from Google OAuth callback (URL fragment keeps token out of server logs). */
  useEffect(() => {
    /* If Google OAuth just redirected here, grab token from URL fragment first */
    const hash = window.location.hash.slice(1); // strip leading '#'
    const hashParams = new URLSearchParams(hash);
    const googleToken = hashParams.get("google_token");
    /* Also check query string for google_error (error redirects still use query param) */
    const urlParams = new URLSearchParams(window.location.search);
    const googleError = urlParams.get("google_error");
    if (googleToken) {
      localStorage.setItem("cleanlink_jwt", googleToken);
      /* Clear the fragment immediately so the token is not in browser history */
      window.history.replaceState({}, "", window.location.pathname + window.location.search);
    } else if (googleError) {
      const clean = new URL(window.location.href);
      clean.searchParams.delete("google_error");
      window.history.replaceState({}, "", clean.toString());
    }

    const jwt = localStorage.getItem("cleanlink_jwt");
    if (!jwt) return;
    apiMe().then(apiUser => {
      if (apiUser) {
        const mapped: AppUser = {
          type: apiUser.role as UserType,
          name: apiUser.name,
          email: apiUser.email,
        };
        setUserState(mapped);
        localStorage.setItem(USER_KEY, JSON.stringify(mapped));
      } else {
        /* Token geçersizse temizle — ama network hatası varsa dokunma */
        setUserState(null);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem("cleanlink_jwt");
      }
    }).catch(() => {
      /* Network hatası: mevcut state'i koru, sadece log */
    });
  }, []);

  const [firmaProfile, setFirmaProfileState] = useState<FirmaProfileData>(defaultFirmaProfile);

  const [orders, setOrdersState] = useState<Order[]>([]);
  const [orderQuotaUsed, setOrderQuotaUsed] = useState(0);
  const [orderQuotaTotal, setOrderQuotaTotal] = useState(1);
  const [orderIsPaid, setOrderIsPaid] = useState(false);

  const [vendors, setVendorsState] = useState<VendorEntry[]>([]);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<UserType>("musteri");
  const [showMyOrders, setShowMyOrders] = useState(false);
  const [pendingBooking, setPendingBookingState] = useState<PendingBookingData | null>(() => {
    try {
      const s = sessionStorage.getItem("cleanlink_pending_booking");
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });

  const setPendingBooking = (b: PendingBookingData | null) => {
    setPendingBookingState(b);
    try {
      if (b) sessionStorage.setItem("cleanlink_pending_booking", JSON.stringify(b));
      else sessionStorage.removeItem("cleanlink_pending_booking");
    } catch {}
  };

  useEffect(() => {
    if (user?.type === "firma") {
      const jwt = localStorage.getItem("cleanlink_jwt");
      if (jwt) {
        apiGetMyVendorProfile().then(vp => {
          const fromApi: FirmaProfileData = {
            ...defaultFirmaProfile,
            bio: vp.bio,
            phone: vp.phone ?? "",
            whatsappPhone: vp.whatsappPhone ?? "",
            regions: vp.regions,
            isSubscribed: vp.isSubscribed,
            isSponsor: vp.isSponsor,
            subscriptionPending: vp.subscriptionPending,
            havaleRefCode: vp.havaleRefCode ?? undefined,
            havalePkg: (vp.havalePkg as FirmaProfileData["havalePkg"]) ?? undefined,
            paket: (vp.paket as FirmaProfileData["paket"]) ?? undefined,
            yayinaGirisTarihi: vp.yayinaGirisTarihi != null
              ? (typeof vp.yayinaGirisTarihi === "number" ? vp.yayinaGirisTarihi : new Date(vp.yayinaGirisTarihi as unknown as string).getTime())
              : undefined,
            prices: Object.keys(vp.prices).length > 0 ? { ...defaultPrices, ...vp.prices } : defaultPrices,
            serviceScopes: Object.keys(vp.serviceScopes).length > 0 ? { ...defaultScopes, ...vp.serviceScopes } : defaultScopes,
            city: vp.city,
            district: vp.district,
          };
          setFirmaProfileState(fromApi);
        }).catch(() => {});
      }
    } else {
      setFirmaProfileState(defaultFirmaProfile);
    }
  }, [user?.name, user?.type]);

  /* ── Load orders from DB when user changes ── */
  useEffect(() => {
    const jwt = localStorage.getItem("cleanlink_jwt");
    if (!user || !jwt) { setOrdersState([]); setOrderQuotaUsed(0); setOrderIsPaid(false); return; }
    apiGetOrders()
      .then(resp => {
        setOrdersState([...resp.orders].reverse().map(orderApiToOrder));
        setOrderIsPaid(!!resp.isPaid);
        setOrderQuotaUsed(resp.quotaUsed ?? 0);
        setOrderQuotaTotal(resp.quotaTotal ?? 1);
      })
      .catch(() => {});
  }, [user?.name]);

  /* ── Load vendor list from API on mount ── */
  const refreshVendors = async () => {
    const list = await apiGetVendors();
    setVendorsState(list.map(v => ({
      name: v.name,
      userId: v.userId,
      isPublished: v.isPublished,
      joinedAt: Date.now(),
      isSponsor: v.isSponsor,
      isSubscribed: v.isSubscribed,
      yayinaGirisTarihi: v.yayinaGirisTarihi ?? undefined,
      bio: v.bio,
      phone: v.phone || undefined,
      regions: v.regions,
      prices: v.prices as Partial<FirmaPrices>,
      serviceScopes: v.serviceScopes as Partial<ServiceScopes>,
      galleryUrls: v.galleryUrls,
      certUrls: v.certUrls,
      city: v.city,
      district: v.district,
      hasPati: v.hasPati,
      isNatureFriendly: v.isNatureFriendly,
    })));
  };

  useEffect(() => {
    refreshVendors().catch(() => {});
  }, []);

  /* ── Timeout check — mark onayBekliyor as zamanAsimi and persist to DB ── */
  useEffect(() => {
    const check = () => {
      const now = Date.now();
      setOrdersState(prev => {
        const timedOut: string[] = [];
        const updated = prev.map(o => {
          if (o.durum === "onayBekliyor" && o.proposedAt !== undefined && now - o.proposedAt > TIMEOUT_MS) {
            timedOut.push(o.id);
            return { ...o, durum: "zamanAsimi" as const };
          }
          return o;
        });
        timedOut.forEach(id => apiUpdateOrderStatus(id, { status: "zamanAsimi" }).catch(() => {}));
        return timedOut.length ? updated : prev;
      });
    };
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, []);

  const setUser = (u: AppUser | null) => {
    setUserState(u);
    if (u) {
      localStorage.setItem(USER_KEY, JSON.stringify(u));
      if (u.type === "musteri" && u.email) {
        saveMusteriEmail(u.name, u.email);
      }
      if (u.type === "firma") {
        setVendorsState(prev => {
          if (prev.some(v => v.name === u.name)) return prev;
          return [...prev, { name: u.name, isPublished: false, joinedAt: Date.now() }];
        });
      }
    } else {
      localStorage.removeItem(USER_KEY);
    }
  };

  const publishVendorProfile = () => {
    if (!user || user.type !== "firma") return;
    setVendorsState(prev => {
      if (prev.some(v => v.name === user.name && v.isPublished)) return prev;
      return prev.map(v => v.name === user.name ? { ...v, isPublished: true } : v);
    });
    const jwt = localStorage.getItem("cleanlink_jwt");
    if (jwt) {
      apiUpdateVendorProfile({ isPublished: true }).catch(() => {});
    }
  };

  const isVendorPublished = vendors.some(v => v.name === user?.name && v.isPublished);

  const updateFirmaProfile = (updates: Partial<FirmaProfileData>) => {
    if (!user || user.type !== "firma") return;
    const next = { ...firmaProfile, ...updates };
    setFirmaProfileState(next);
    const jwt = localStorage.getItem("cleanlink_jwt");
    if (jwt) {
      const apiUpdates: Record<string, unknown> = {};
      if (updates.bio !== undefined) apiUpdates.bio = updates.bio;
      if (updates.regions !== undefined) apiUpdates.regions = updates.regions;
      if (updates.isSubscribed !== undefined) apiUpdates.isSubscribed = updates.isSubscribed;
      if (updates.isSponsor !== undefined) apiUpdates.isSponsor = updates.isSponsor;
      if (updates.prices !== undefined) apiUpdates.prices = updates.prices;
      if (updates.serviceScopes !== undefined) apiUpdates.serviceScopes = updates.serviceScopes;
      if (Object.keys(apiUpdates).length > 0) {
        apiUpdateVendorProfile(apiUpdates).catch(() => {});
      }
    }
  };

  const refreshFirmaProfile = async (): Promise<void> => {
    const jwt = localStorage.getItem("cleanlink_jwt");
    if (!jwt || !user || user.type !== "firma") return;
    const vp = await apiGetMyVendorProfile();
    const fromApi: FirmaProfileData = {
      ...defaultFirmaProfile,
      bio: vp.bio,
      phone: vp.phone ?? "",
      whatsappPhone: vp.whatsappPhone ?? "",
      regions: vp.regions,
      isSubscribed: vp.isSubscribed,
      isSponsor: vp.isSponsor,
      subscriptionPending: vp.subscriptionPending,
      havaleRefCode: vp.havaleRefCode ?? undefined,
      havalePkg: (vp.havalePkg as FirmaProfileData["havalePkg"]) ?? undefined,
      paket: (vp.paket as FirmaProfileData["paket"]) ?? undefined,
      yayinaGirisTarihi: vp.yayinaGirisTarihi != null
        ? (typeof vp.yayinaGirisTarihi === "number" ? vp.yayinaGirisTarihi : new Date(vp.yayinaGirisTarihi as unknown as string).getTime())
        : undefined,
      prices: Object.keys(vp.prices).length > 0 ? { ...defaultPrices, ...vp.prices } : defaultPrices,
      serviceScopes: Object.keys(vp.serviceScopes).length > 0 ? { ...defaultScopes, ...vp.serviceScopes } : defaultScopes,
      city: vp.city,
      district: vp.district,
    };
    setFirmaProfileState(fromApi);
  };

  /* ── Order mutations — optimistic UI + DB persist ── */
  const addOrder = (o: Order & { couponCode?: string }) => {
    setOrdersState(prev => [o, ...prev]);
    window.dispatchEvent(new Event("fidan_updated"));
    apiCreateOrder({
      vendorId: o.vendorUserId,
      service: o.hizmet,
      total: o.toplam,
      customerPhone: o.telefon,
      ilce: o.ilce,
      mahalle: o.mahalle,
      adres: o.adres,
      requestedDate: o.istenenTarih,
      requestedTimeSlot: o.istenenSaatDilimi,
      ecoOption: o.ecoOption,
      couponCode: o.couponCode,
    }).then(created => {
      setOrdersState(prev => prev.map(x => x.id === o.id ? orderApiToOrder(created) : x));
    }).catch(() => {});
  };

  const setOrderVisitTime = (orderId: string, time: string) => {
    const now = Date.now();
    setOrdersState(prev => prev.map(o =>
      o.id === orderId
        ? { ...o, visitTime: time, durum: "onayBekliyor" as const, proposedAt: now, musteriYeniSaatIstedi: false }
        : o
    ));
    apiUpdateOrderStatus(orderId, { status: "onayBekliyor", visitTime: time, proposedAt: now, musteriYeniSaatIstedi: false })
      .then(u => setOrdersState(prev => prev.map(o => o.id === orderId ? orderApiToOrder(u) : o)))
      .catch(() => {});
  };

  const approveOrderTime = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    const visitTime = order?.istenenSaatDilimi ?? order?.visitTime ?? "";
    setOrdersState(prev => prev.map(o =>
      o.id === orderId ? { ...o, visitTime, durum: "kesinlesti" as const } : o
    ));
    apiUpdateOrderStatus(orderId, { status: "kesinlesti", visitTime })
      .then(u => setOrdersState(prev => prev.map(o => o.id === orderId ? orderApiToOrder(u) : o)))
      .catch(() => {});
  };

  const respondToOrder = (orderId: string, action: "onayla" | "reddet") => {
    const newStatus = action === "onayla" ? "kesinlesti" : "reddedildi";
    setOrdersState(prev => prev.map(o =>
      o.id === orderId ? { ...o, durum: newStatus as OrderDurum } : o
    ));
    apiUpdateOrderStatus(orderId, { status: newStatus })
      .then(u => setOrdersState(prev => prev.map(o => o.id === orderId ? orderApiToOrder(u) : o)))
      .catch(() => {});
  };

  const requestNewTime = (orderId: string) => {
    setOrdersState(prev => prev.map(o =>
      o.id === orderId
        ? { ...o, durum: "beklemede" as const, musteriYeniSaatIstedi: true, visitTime: undefined, proposedAt: undefined }
        : o
    ));
    apiUpdateOrderStatus(orderId, { status: "beklemede", visitTime: "", musteriYeniSaatIstedi: true })
      .then(u => setOrdersState(prev => prev.map(o => o.id === orderId ? orderApiToOrder(u) : o)))
      .catch(() => {});
  };

  const firmaPrices = firmaProfile.prices;
  const setFirmaPrices = (p: FirmaPrices) => updateFirmaProfile({ prices: p });
  const serviceScopes = firmaProfile.serviceScopes;
  const setServiceScopes = (s: ServiceScopes) => updateFirmaProfile({ serviceScopes: s });

  const myOrders = user?.type === "musteri"
    ? orders.filter(o => o.musteri === user.name)
    : [];

  const unlockOrder = async (orderId: string) => {
    const updated = await apiUnlockOrder(orderId);
    setOrdersState(prev => prev.map(o => o.id === orderId ? orderApiToOrder(updated) : o));
    setOrderQuotaUsed(prev => prev + 1);
  };

  const logout = () => { apiLogout(); setUser(null); setShowMyOrders(false); };

  return (
    <AppContext.Provider value={{
      user, setUser,
      firmaProfile, updateFirmaProfile, refreshFirmaProfile,
      firmaPrices, setFirmaPrices,
      serviceScopes, setServiceScopes,
      orders, addOrder, setOrderVisitTime, approveOrderTime, respondToOrder, requestNewTime,
      unlockOrder, orderQuotaUsed, orderQuotaTotal, orderIsPaid,
      myOrders,
      vendors, refreshVendors, isVendorPublished, publishVendorProfile,
      showAuthModal, setShowAuthModal,
      authMode, setAuthMode,
      showMyOrders, setShowMyOrders,
      logout,
      pendingBooking, setPendingBooking,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
