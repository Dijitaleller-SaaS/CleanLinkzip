const BASE = "/api";

function getToken(): string | null {
  return localStorage.getItem("cleanlink_jwt");
}

function setToken(t: string) {
  localStorage.setItem("cleanlink_jwt", t);
}

function clearToken() {
  localStorage.removeItem("cleanlink_jwt");
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  auth = false,
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Sunucu hatası");
  return data as T;
}

/* ── Types ── */
export interface ApiUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: ApiUser;
}

/* ── Auth ── */
export async function apiRegister(
  email: string,
  name: string,
  password: string,
  role: "musteri" | "firma",
): Promise<AuthResponse> {
  const data = await request<AuthResponse>("POST", "/auth/register", { email, name, password, role });
  setToken(data.token);
  return data;
}

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  const data = await request<AuthResponse>("POST", "/auth/login", { email, password });
  setToken(data.token);
  return data;
}

export async function apiMe(): Promise<ApiUser | null> {
  try {
    const data = await request<{ user: ApiUser }>("GET", "/auth/me", undefined, true);
    return data.user;
  } catch {
    clearToken();
    return null;
  }
}

export function apiLogout() {
  clearToken();
}

export async function apiForgotPassword(email: string): Promise<void> {
  await request<{ success: boolean }>("POST", "/auth/forgot-password", { email });
}

export async function apiResetPassword(token: string, password: string): Promise<void> {
  await request<{ success: boolean }>("POST", "/auth/reset-password", { token, password });
}

/* ── Admin Orders ── */
export interface AdminOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  vendorName: string;
  service: string;
  total: number;
  status: string;
  ilce: string;
  mahalle: string;
  adres: string;
  requestedDate: string;
  requestedTimeSlot: string;
  ecoOption: boolean;
  unlockedAt: string | null;
  createdAt: string;
}

export async function apiAdminGetOrders(): Promise<AdminOrder[]> {
  const data = await request<{ orders: AdminOrder[] }>("GET", "/admin/orders", undefined, true);
  return data.orders;
}

export async function apiAdminUpdateOrderStatus(id: string, status: string): Promise<AdminOrder> {
  const data = await request<{ order: AdminOrder }>("PATCH", `/admin/orders/${id}/status`, { status }, true);
  return data.order;
}

/* ── Vendor Profile ── */
export interface VendorProfileApi {
  id: number;
  userId: number;
  bio: string;
  phone: string;
  whatsappPhone: string;
  regions: string[];
  isSubscribed: boolean;
  isSponsor: boolean;
  isPublished: boolean;
  subscriptionPending: boolean;
  havaleRefCode: string | null;
  havalePkg: string | null;
  paket: string | null;
  yayinaGirisTarihi: number | null;
  prices: Record<string, number>;
  serviceScopes: Record<string, string>;
  galleryUrls: string[];
  certUrls: string[];
  city?: string;
  district?: string;
  hasPati?: boolean;
  isNatureFriendly?: boolean;
}

export interface PublicVendorApi {
  id: number;
  userId: number;
  name: string;
  bio: string;
  phone: string;
  whatsappPhone: string;
  regions: string[];
  isSubscribed: boolean;
  isSponsor: boolean;
  isPublished: boolean;
  yayinaGirisTarihi: number | null;
  prices: Record<string, number>;
  serviceScopes: Record<string, string>;
  galleryUrls: string[];
  certUrls: string[];
  city?: string;
  district?: string;
  hasPati?: boolean;
  isNatureFriendly?: boolean;
}

export async function apiGetVendors(): Promise<PublicVendorApi[]> {
  const data = await request<{ vendors: PublicVendorApi[] }>("GET", "/vendors");
  return data.vendors;
}

export async function apiGetMyVendorProfile(): Promise<VendorProfileApi> {
  const data = await request<{ profile: VendorProfileApi }>("GET", "/vendors/me", undefined, true);
  return data.profile;
}

export async function apiUpdateVendorProfile(
  updates: Partial<Omit<VendorProfileApi, "id" | "userId">>,
): Promise<VendorProfileApi> {
  const data = await request<{ profile: VendorProfileApi }>("PUT", "/vendors/me", updates, true);
  return data.profile;
}

export async function apiSubmitHavale(refCode: string, paket: "standart" | "elite"): Promise<VendorProfileApi> {
  const data = await request<{ profile: VendorProfileApi }>("POST", "/vendors/havale", { refCode, paket }, true);
  return data.profile;
}

/* ── Pilot Applications ── */
export interface PilotApplicationApi {
  id: number;
  firmaAdi: string;
  yetkiliAdi: string;
  telefon: string;
  email: string;
  deneyim: string;
  hizmetler: string[];
  ekipman: string;
  googleLink: string | null;
  notlar: string | null;
  sartlariOkudum: boolean;
  onaylananVersiyon: string;
  onayIp: string;
  onayTarihi: string | null;
  createdAt: string;
}

export async function apiSubmitPilotApplication(data: {
  firmaAdi: string; yetkiliAdi: string; telefon: string; email: string;
  deneyim: string; hizmetler: string[]; ekipman: string;
  googleLink?: string; notlar?: string; sartlariOkudum: boolean;
}): Promise<PilotApplicationApi> {
  const res = await request<{ application: PilotApplicationApi }>("POST", "/pilot-applications", data);
  return res.application;
}

export async function apiAdminGetPilotApplications(): Promise<PilotApplicationApi[]> {
  const data = await request<{ applications: PilotApplicationApi[] }>("GET", "/admin/pilot-applications", undefined, true);
  return data.applications;
}

export async function apiAdminDeletePilotApplication(id: number): Promise<void> {
  await request<{ ok: boolean }>("DELETE", `/admin/pilot-applications/${id}`, undefined, true);
}

export async function apiAdminDeleteUser(userId: number): Promise<{ id: number; email: string }> {
  const data = await request<{ ok: boolean; deleted: { id: number; email: string } }>("DELETE", `/admin/users/${userId}`, undefined, true);
  return data.deleted;
}

export async function apiAdminDeleteUserByEmail(email: string): Promise<{ id: number; email: string }> {
  const data = await request<{ ok: boolean; deleted: { id: number; email: string } }>("DELETE", `/admin/users/by-email`, { email }, true);
  return data.deleted;
}

export async function apiAdminRemoveSubscription(vendorId: number): Promise<AdminVendor> {
  const data = await request<{ vendor: AdminVendor }>("DELETE", `/admin/vendors/${vendorId}/subscription`, {}, true);
  return data.vendor;
}

export async function apiAdminSetPackage(
  vendorId: number,
  updates: { isSubscribed?: boolean; isSponsor?: boolean },
): Promise<AdminVendor> {
  const data = await request<{ vendor: AdminVendor }>("PATCH", `/admin/vendors/${vendorId}/set-package`, updates, true);
  return data.vendor;
}

/* ── Orders ── */
export interface OrderApi {
  id: string;
  customerName: string;
  customerPhone: string;
  vendorName: string;
  service: string;
  total: number;
  status: string;
  ilce: string;
  mahalle: string;
  adres: string;
  requestedDate: string;
  requestedTimeSlot: string;
  visitTime: string;
  ecoOption: boolean;
  treesPlanted: number;
  proposedAt: string | null;
  musteriYeniSaatIstedi: boolean;
  unlockedAt: string | null;
  isContactUnlocked: boolean;
  createdAt: string;
}

export interface OrdersResponse {
  orders: OrderApi[];
  isPaid: boolean | null;
  quotaUsed: number | null;
  quotaTotal: number | null;
}

export async function apiGetOrders(): Promise<OrdersResponse> {
  return request<OrdersResponse>("GET", "/orders", undefined, true);
}

export async function apiUnlockOrder(orderId: string): Promise<OrderApi> {
  const data = await request<{ order: OrderApi }>("POST", `/orders/${orderId}/unlock`, {}, true);
  return data.order;
}

/* ── Coupons ── */
export interface CouponValidation {
  code: string;
  description: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  discountAmount: number;
}
export async function apiValidateCoupon(code: string, orderTotal: number): Promise<CouponValidation> {
  return request<CouponValidation>("POST", "/coupons/validate", { code, orderTotal });
}

export interface AdminCoupon {
  id: number;
  code: string;
  description: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  minOrderTotal: number;
  maxUses: number;
  usedCount: number;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
  createdAt: string;
}
export async function apiAdminListCoupons(): Promise<AdminCoupon[]> {
  const data = await request<{ coupons: AdminCoupon[] }>("GET", "/admin/coupons", undefined, true);
  return data.coupons;
}
export async function apiAdminCreateCoupon(c: {
  code: string; description?: string; discountType: "percent" | "fixed";
  discountValue: number; minOrderTotal?: number; maxUses?: number;
  validFrom?: string | null; validUntil?: string | null;
}): Promise<AdminCoupon> {
  const data = await request<{ coupon: AdminCoupon }>("POST", "/admin/coupons", c, true);
  return data.coupon;
}
export async function apiAdminToggleCoupon(id: number, isActive: boolean): Promise<AdminCoupon> {
  const data = await request<{ coupon: AdminCoupon }>("PATCH", `/admin/coupons/${id}`, { isActive }, true);
  return data.coupon;
}
export async function apiAdminDeleteCoupon(id: number): Promise<void> {
  await request("DELETE", `/admin/coupons/${id}`, undefined, true);
}

/* ── PayTR ── */
export async function apiPaytrStatus(): Promise<{ enabled: boolean; testMode: boolean }> {
  return request("GET", "/paytr/status");
}
export async function apiPaytrInit(paket: "standart" | "elite"): Promise<{ token: string; merchantOid: string; iframeUrl: string }> {
  return request("POST", "/paytr/init", { paket }, true);
}

/* ── Bayi ── */
export interface BayiAssignment {
  vendorId: number; name: string; email: string;
  isSubscribed: boolean; paket: string | null; activatedAt: string | null;
}
export interface BayiMeResponse {
  bayi: {
    id: number; bayiKodu: string; bolge: string;
    komisyonOrani: number; girisUcreti: number; iban: string; isActive: boolean;
  };
  assignments: BayiAssignment[];
  monthlyOrders: { total: number; count: number };
  monthlyCommission: number;
  referralLink: string;
}
export async function apiBayiMe(): Promise<BayiMeResponse> {
  return request("GET", "/bayi/me", undefined, true);
}
export interface AdminBayi {
  id: number; userId: number; name: string; email: string;
  bayiKodu: string; bolge: string; komisyonOrani: number;
  girisUcreti: number; iban: string; isActive: boolean; createdAt: string;
}
export async function apiAdminListBayiler(): Promise<AdminBayi[]> {
  const data = await request<{ bayiler: AdminBayi[] }>("GET", "/admin/bayiler", undefined, true);
  return data.bayiler;
}
export async function apiAdminCreateBayi(b: {
  email: string; bolge?: string; komisyonOrani?: number; girisUcreti?: number; iban?: string;
}): Promise<AdminBayi> {
  const data = await request<{ bayi: AdminBayi }>("POST", "/admin/bayiler", b, true);
  return data.bayi;
}
export async function apiAdminAssignVendorToBayi(bayiId: number, vendorId: number): Promise<void> {
  await request("POST", `/admin/bayiler/${bayiId}/assign`, { vendorId }, true);
}
export async function apiAdminDeleteBayi(id: number): Promise<void> {
  await request("DELETE", `/admin/bayiler/${id}`, undefined, true);
}

export async function apiCreateOrder(order: {
  vendorId?: number;
  service: string;
  total: number;
  customerPhone?: string;
  ilce?: string;
  mahalle?: string;
  adres?: string;
  requestedDate?: string;
  requestedTimeSlot?: string;
  ecoOption?: boolean;
  couponCode?: string;
}): Promise<OrderApi> {
  const data = await request<{ order: OrderApi }>("POST", "/orders", order, true);
  return data.order;
}

export async function apiUpdateOrderStatus(
  orderId: string,
  update: { status?: string; visitTime?: string; proposedAt?: number; musteriYeniSaatIstedi?: boolean },
): Promise<OrderApi> {
  const data = await request<{ order: OrderApi }>("PATCH", `/orders/${orderId}/status`, update, true);
  return data.order;
}

/* ── Admin ── */
export interface AdminVendor {
  id: number;
  userId: number;
  name: string;
  email: string;
  bio: string;
  regions: string[];
  isSubscribed: boolean;
  isSponsor: boolean;
  isPublished: boolean;
  isAdminHidden: boolean;
  subscriptionPending: boolean;
  havaleRefCode: string | null;
  havalePkg: string | null;
  paket: string | null;
  yayinaGirisTarihi: number | null;
  activatedAt: number | null;
  updatedAt: number;
  joinedAt: number;
  city: string;
  district: string;
  hasPati: boolean;
  isNatureFriendly: boolean;
}

export async function apiNotifyDekont(payload: {
  firmaAdi: string;
  paket: string;
  refCode: string;
  tarih: string;
  banka: string;
  dosyaAdi?: string;
  dosyaBase64?: string;
}): Promise<void> {
  await request<{ ok: boolean }>("POST", "/vendors/notify-dekont", payload, true);
}

export interface AdminFinancial {
  standart: number;
  elite: number;
  pending: number;
  expired: number;
  standartRevenue: number;
  eliteRevenue: number;
  totalRevenue: number;
  reklamHavuzu: number;
}

export interface AdminNotifications {
  newFirms:     { id: number; name: string; joinedAt: string }[];
  pendingFirms: { id: number; name: string; joinedAt: string }[];
  expiredFirms: { id: number; name: string; joinedAt: string }[];
}

export async function apiAdminGetVendors(): Promise<AdminVendor[]> {
  const data = await request<{ vendors: AdminVendor[] }>("GET", "/admin/vendors", undefined, true);
  return data.vendors;
}

export async function apiAdminGetFinancial(): Promise<AdminFinancial> {
  return request<AdminFinancial>("GET", "/admin/financial", undefined, true);
}

export async function apiAdminGetNotifications(): Promise<AdminNotifications> {
  return request<AdminNotifications>("GET", "/admin/notifications", undefined, true);
}

export async function apiAdminApprove(vendorId: number): Promise<AdminVendor> {
  const data = await request<{ vendor: AdminVendor }>("PATCH", `/admin/vendors/${vendorId}/approve`, {}, true);
  return data.vendor;
}

export async function apiAdminExtend(vendorId: number): Promise<AdminVendor> {
  const data = await request<{ vendor: AdminVendor }>("PATCH", `/admin/vendors/${vendorId}/extend`, {}, true);
  return data.vendor;
}

export async function apiAdminApproveByName(name: string): Promise<AdminVendor> {
  const data = await request<{ vendor: AdminVendor }>("PATCH", `/admin/vendors/by-name/${encodeURIComponent(name)}/approve`, {}, true);
  return data.vendor;
}

export async function apiAdminExtendByName(name: string): Promise<AdminVendor> {
  const data = await request<{ vendor: AdminVendor }>("PATCH", `/admin/vendors/by-name/${encodeURIComponent(name)}/extend`, {}, true);
  return data.vendor;
}

export async function apiAdminSetVisibility(vendorId: number, hidden: boolean): Promise<AdminVendor> {
  const data = await request<{ vendor: AdminVendor }>("PATCH", `/admin/vendors/${vendorId}/visibility`, { hidden }, true);
  return data.vendor;
}

export async function apiAdminSetVisibilityByName(name: string, hidden: boolean): Promise<AdminVendor> {
  const data = await request<{ vendor: AdminVendor }>("PATCH", `/admin/vendors/by-name/${encodeURIComponent(name)}/visibility`, { hidden }, true);
  return data.vendor;
}

/* ── Reviews ── */
export interface ApiReview {
  id: number;
  vendorName: string;
  customerId: number;
  customerName: string;
  orderId: string | null;
  puan: number;
  yorum: string;
  hasPhoto: boolean;
  isApproved: boolean;
  createdAt: string;
}

export interface ReviewStats { count: number; average: number; }

export async function apiGetReviews(vendorId: number): Promise<{ reviews: ApiReview[]; stats: ReviewStats }> {
  return request<{ reviews: ApiReview[]; stats: ReviewStats }>(
    "GET", `/reviews?vendorId=${vendorId}`
  );
}

export async function apiGetReviewStats(vendors: string[]): Promise<Record<string, ReviewStats>> {
  if (vendors.length === 0) return {};
  const data = await request<{ stats: Record<string, ReviewStats> }>(
    "GET", `/reviews/stats?vendors=${encodeURIComponent(vendors.join(","))}`
  );
  return data.stats;
}

export async function apiSubmitReview(payload: {
  vendorId: number; puan: number; yorum: string; hasPhoto?: boolean; orderId?: string;
}): Promise<ApiReview> {
  const data = await request<{ review: ApiReview }>("POST", "/reviews", payload, true);
  return data.review;
}

/* ── Notifications ── */
export interface ApiNotification {
  id: number;
  userId: number;
  type: string;
  title: string;
  body: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

export async function apiGetNotifications(): Promise<{ notifications: ApiNotification[]; unreadCount: number }> {
  return request<{ notifications: ApiNotification[]; unreadCount: number }>(
    "GET", "/notifications", undefined, true
  );
}

export async function apiMarkNotificationRead(id: number): Promise<void> {
  await request<{ ok: boolean }>("PATCH", `/notifications/${id}/read`, {}, true);
}

export async function apiMarkAllNotificationsRead(): Promise<void> {
  await request<{ ok: boolean }>("POST", "/notifications/mark-all-read", {}, true);
}

/* ── CMS ── */
export interface CmsBlogPost {
  id: number;
  title: string;
  category: string;
  postDate: string;
  readTime: string;
  excerpt: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export async function apiGetBlogPosts(): Promise<CmsBlogPost[]> {
  const data = await request<{ posts: CmsBlogPost[] }>("GET", "/cms/blog");
  return data.posts;
}

export async function apiCreateBlogPost(post: Omit<CmsBlogPost, "id" | "createdAt" | "updatedAt">): Promise<CmsBlogPost> {
  const data = await request<{ post: CmsBlogPost }>("POST", "/cms/blog", post, true);
  return data.post;
}

export async function apiUpdateBlogPost(id: number, post: Partial<Omit<CmsBlogPost, "id" | "createdAt" | "updatedAt">>): Promise<CmsBlogPost> {
  const data = await request<{ post: CmsBlogPost }>("PUT", `/cms/blog/${id}`, post, true);
  return data.post;
}

export async function apiDeleteBlogPost(id: number): Promise<void> {
  await request<{ ok: boolean }>("DELETE", `/cms/blog/${id}`, undefined, true);
}

export async function apiGetPageContent(pageKey: string): Promise<Record<string, string>> {
  const data = await request<{ content: Record<string, string> }>("GET", `/cms/pages/${pageKey}`);
  return data.content;
}

export async function apiUpdatePageContent(pageKey: string, fields: Record<string, string>): Promise<Record<string, string>> {
  const data = await request<{ content: Record<string, string> }>("PUT", `/cms/pages/${pageKey}`, fields, true);
  return data.content;
}

/* ── Transaction Audit Log ── */
export interface TransactionAuditLogEntry {
  id: number;
  transactionId: string;
  userId: number | null;
  ipAddress: string;
  actionType: string;
  documentVersion: string;
  meta: Record<string, unknown>;
  timestamp: string;
}

export async function apiAdminGetTransactionAuditLog(): Promise<TransactionAuditLogEntry[]> {
  const data = await request<{ logs: TransactionAuditLogEntry[] }>("GET", "/admin/transaction-audit-log", undefined, true);
  return data.logs;
}
