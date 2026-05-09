import {
  pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, uniqueIndex
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/* ── Users ── */
export const usersTable = pgTable("users", {
  id:           serial("id").primaryKey(),
  email:        varchar("email", { length: 255 }).notNull().unique(),
  name:         varchar("name",  { length: 255 }).notNull(),
  passwordHash: text("password_hash"),
  googleId:     varchar("google_id", { length: 128 }).unique(),
  role:         varchar("role", { length: 20 }).notNull().default("musteri"),
  tokenVersion: integer("token_version").notNull().default(1),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

/* ── Vendor Profiles ── */
export const vendorProfilesTable = pgTable("vendor_profiles", {
  id:                  serial("id").primaryKey(),
  userId:              integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  bio:                 text("bio").default("").notNull(),
  phone:               varchar("phone", { length: 30 }).default("").notNull(),
  whatsappPhone:       varchar("whatsapp_phone", { length: 30 }).default("").notNull(),
  regions:             jsonb("regions").$type<string[]>().default([]).notNull(),
  isSubscribed:        boolean("is_subscribed").default(false).notNull(),
  isSponsor:           boolean("is_sponsor").default(false).notNull(),
  isPublished:         boolean("is_published").default(false).notNull(),
  isAdminHidden:       boolean("is_admin_hidden").default(false).notNull(),
  prices:              jsonb("prices").$type<Record<string, number>>().default({}).notNull(),
  serviceScopes:       jsonb("service_scopes").$type<Record<string, string>>().default({}).notNull(),
  galleryUrls:         jsonb("gallery_urls").$type<string[]>().default([]).notNull(),
  certUrls:            jsonb("cert_urls").$type<string[]>().default([]).notNull(),
  subscriptionPending: boolean("subscription_pending").default(false).notNull(),
  havaleRefCode:       varchar("havale_ref_code", { length: 50 }),
  havalePkg:           varchar("havale_pkg", { length: 20 }),
  paket:               varchar("paket", { length: 20 }),
  yayinaGirisTarihi:   timestamp("yayina_giris_tarihi"),
  activatedAt:         timestamp("activated_at"),
  city:                varchar("city", { length: 100 }).default("İstanbul").notNull(),
  district:            varchar("district", { length: 100 }).default("").notNull(),
  hasPati:             boolean("has_pati").default(false).notNull(),
  isNatureFriendly:    boolean("is_nature_friendly").default(false).notNull(),
  updatedAt:           timestamp("updated_at").defaultNow().notNull(),
});

export const insertVendorProfileSchema = createInsertSchema(vendorProfilesTable).omit({ id: true, updatedAt: true });
export type InsertVendorProfile = z.infer<typeof insertVendorProfileSchema>;
export type VendorProfile = typeof vendorProfilesTable.$inferSelect;

/* ── Orders ── */
export const ordersTable = pgTable("orders", {
  id:                    text("id").primaryKey(),
  customerId:            integer("customer_id").references(() => usersTable.id, { onDelete: "set null" }),
  vendorId:              integer("vendor_id").references(() => usersTable.id, { onDelete: "set null" }),
  customerName:          varchar("customer_name", { length: 255 }).notNull(),
  customerPhone:         varchar("customer_phone", { length: 30 }).default("").notNull(),
  vendorName:            varchar("vendor_name", { length: 255 }).notNull(),
  service:               varchar("service", { length: 255 }).notNull(),
  total:                 integer("total").notNull(),
  status:                varchar("status", { length: 50 }).notNull().default("beklemede"),
  ilce:                  varchar("ilce", { length: 100 }).default("").notNull(),
  mahalle:               varchar("mahalle", { length: 100 }).default("").notNull(),
  adres:                 text("adres").default("").notNull(),
  requestedDate:         varchar("requested_date", { length: 50 }).default("").notNull(),
  requestedTimeSlot:     varchar("requested_time_slot", { length: 50 }).default("").notNull(),
  visitTime:             varchar("visit_time", { length: 50 }).default("").notNull(),
  ecoOption:             boolean("eco_option").default(false).notNull(),
  treesPlanted:          integer("trees_planted").default(0).notNull(),
  proposedAt:            timestamp("proposed_at"),
  musteriYeniSaatIstedi: boolean("musteri_yeni_saat_istedi").default(false).notNull(),
  unlockedAt:            timestamp("unlocked_at"),
  couponCode:            varchar("coupon_code", { length: 40 }).default("").notNull(),
  discountAmount:        integer("discount_amount").default(0).notNull(),
  createdAt:             timestamp("created_at").defaultNow().notNull(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ createdAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderRow = typeof ordersTable.$inferSelect;

/* ── CMS Blog Posts ── */
export const cmsBlogPostsTable = pgTable("cms_blog_posts", {
  id:        serial("id").primaryKey(),
  title:     text("title").notNull(),
  category:  varchar("category", { length: 100 }).notNull().default(""),
  postDate:  varchar("post_date", { length: 50 }).notNull().default(""),
  readTime:  varchar("read_time", { length: 30 }).notNull().default(""),
  excerpt:   text("excerpt").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type CmsBlogPost = typeof cmsBlogPostsTable.$inferSelect;

/* ── CMS Page Content ── */
export const cmsPageContentTable = pgTable("cms_page_content", {
  id:        serial("id").primaryKey(),
  pageKey:   varchar("page_key", { length: 50 }).notNull(),
  fieldKey:  varchar("field_key", { length: 50 }).notNull(),
  content:   text("content").notNull().default(""),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("cms_page_content_page_key_field_key_unique").on(t.pageKey, t.fieldKey),
]);

export type CmsPageContent = typeof cmsPageContentTable.$inferSelect;

/* ── Pilot Applications ── */
export const pilotApplicationsTable = pgTable("pilot_applications", {
  id:             serial("id").primaryKey(),
  firmaAdi:       varchar("firma_adi",    { length: 255 }).notNull(),
  yetkiliAdi:     varchar("yetkili_adi",  { length: 255 }).notNull(),
  telefon:        varchar("telefon",      { length: 30  }).notNull(),
  email:          varchar("email",        { length: 255 }).notNull(),
  deneyim:        varchar("deneyim",      { length: 20  }).notNull().default(""),
  hizmetler:      jsonb("hizmetler").$type<string[]>().default([]).notNull(),
  ekipman:        varchar("ekipman",      { length: 30  }).notNull().default(""),
  googleLink:     varchar("google_link",  { length: 500 }).default(""),
  notlar:         text("notlar").default(""),
  sartlariOkudum:    boolean("sartlari_okudum").notNull().default(false),
  onaylananVersiyon: varchar("onaylanan_versiyon", { length: 50 }).notNull().default(""),
  onayIp:            varchar("onay_ip", { length: 64 }).notNull().default(""),
  onayTarihi:        timestamp("onay_tarihi"),
  createdAt:         timestamp("created_at").defaultNow().notNull(),
});

export const insertPilotApplicationSchema = createInsertSchema(pilotApplicationsTable).omit({ id: true, createdAt: true });
export type InsertPilotApplication = z.infer<typeof insertPilotApplicationSchema>;
export type PilotApplication = typeof pilotApplicationsTable.$inferSelect;

/* ── Reviews ── */
export const reviewsTable = pgTable("reviews", {
  id:           serial("id").primaryKey(),
  vendorId:     integer("vendor_id").references(() => usersTable.id, { onDelete: "set null" }),
  vendorName:   varchar("vendor_name", { length: 255 }).notNull(),
  customerId:   integer("customer_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  orderId:      text("order_id"),
  puan:         integer("puan").notNull(),
  yorum:        text("yorum").notNull(),
  hasPhoto:     boolean("has_photo").default(false).notNull(),
  isApproved:   boolean("is_approved").default(true).notNull(),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
});
export type Review = typeof reviewsTable.$inferSelect;

/* ── Password Reset Tokens ── */
export const passwordResetTokensTable = pgTable("password_reset_tokens", {
  id:        serial("id").primaryKey(),
  token:     varchar("token", { length: 128 }).notNull().unique(),
  userId:    integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type PasswordResetToken = typeof passwordResetTokensTable.$inferSelect;

/* ── Coupons (indirim kodları) ── */
export const couponsTable = pgTable("coupons", {
  id:            serial("id").primaryKey(),
  code:          varchar("code", { length: 40 }).notNull().unique(),
  description:   varchar("description", { length: 255 }).default("").notNull(),
  discountType:  varchar("discount_type", { length: 10 }).notNull().default("percent"), // 'percent' | 'fixed'
  discountValue: integer("discount_value").notNull(), // % veya TL
  minOrderTotal: integer("min_order_total").default(0).notNull(),
  maxUses:       integer("max_uses").default(0).notNull(), // 0 = limitsiz
  usedCount:     integer("used_count").default(0).notNull(),
  validFrom:     timestamp("valid_from"),
  validUntil:    timestamp("valid_until"),
  isActive:      boolean("is_active").default(true).notNull(),
  createdAt:     timestamp("created_at").defaultNow().notNull(),
});
export type Coupon = typeof couponsTable.$inferSelect;
export const insertCouponSchema = createInsertSchema(couponsTable).omit({ id: true, createdAt: true, usedCount: true });
export type InsertCoupon = z.infer<typeof insertCouponSchema>;

/* ── Audit Log (admin aksiyonları) ── */
export const auditLogTable = pgTable("audit_log", {
  id:        serial("id").primaryKey(),
  actorId:   integer("actor_id").references(() => usersTable.id, { onDelete: "set null" }),
  actorEmail: varchar("actor_email", { length: 255 }).default("").notNull(),
  action:    varchar("action", { length: 100 }).notNull(),
  target:    varchar("target", { length: 255 }).default("").notNull(),
  meta:      jsonb("meta").$type<Record<string, unknown>>().default({}).notNull(),
  ip:        varchar("ip", { length: 64 }).default("").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type AuditLog = typeof auditLogTable.$inferSelect;

/* ── Bayi (Franchise) Profilleri ── */
export const bayiProfilesTable = pgTable("bayi_profiles", {
  id:           serial("id").primaryKey(),
  userId:       integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }).unique(),
  bayiKodu:     varchar("bayi_kodu", { length: 20 }).notNull().unique(), // referrer code
  bolge:        varchar("bolge", { length: 100 }).default("").notNull(), // şehir/ilçe
  komisyonOrani: integer("komisyon_orani").default(15).notNull(), // %
  girisUcreti:   integer("giris_ucreti").default(0).notNull(),    // TL (ödediği)
  iban:         varchar("iban", { length: 40 }).default("").notNull(),
  notlar:       text("notlar").default("").notNull(),
  isActive:     boolean("is_active").default(true).notNull(),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
});
export type BayiProfile = typeof bayiProfilesTable.$inferSelect;

/* ── Bayi → Firma Atamaları (referrer takibi) ── */
export const bayiVendorAssignmentsTable = pgTable("bayi_vendor_assignments", {
  id:        serial("id").primaryKey(),
  bayiId:    integer("bayi_id").notNull().references(() => bayiProfilesTable.id, { onDelete: "cascade" }),
  vendorId:  integer("vendor_id").notNull().references(() => vendorProfilesTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [uniqueIndex("bayi_vendor_unique").on(t.bayiId, t.vendorId)]);
export type BayiVendorAssignment = typeof bayiVendorAssignmentsTable.$inferSelect;

/* ── PayTR İşlem Kayıtları (firma abonelik ödemeleri) ── */
export const paytrTransactionsTable = pgTable("paytr_transactions", {
  id:           serial("id").primaryKey(),
  merchantOid:  varchar("merchant_oid", { length: 64 }).notNull().unique(),
  userId:       integer("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  amount:       integer("amount").notNull(),       // kuruş
  paket:        varchar("paket", { length: 20 }).notNull(),
  status:       varchar("status", { length: 20 }).default("pending").notNull(), // pending|success|failed
  paytrToken:   text("paytr_token").default("").notNull(),
  rawCallback:  jsonb("raw_callback").$type<Record<string, unknown>>(),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
  completedAt:  timestamp("completed_at"),
});
export type PaytrTransaction = typeof paytrTransactionsTable.$inferSelect;

/* ── Notifications (in-app) ── */
export const notificationsTable = pgTable("notifications", {
  id:        serial("id").primaryKey(),
  userId:    integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  type:      varchar("type", { length: 50 }).notNull(),
  title:     varchar("title", { length: 255 }).notNull(),
  body:      text("body").default("").notNull(),
  link:      varchar("link", { length: 500 }).default("").notNull(),
  isRead:    boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type Notification = typeof notificationsTable.$inferSelect;
