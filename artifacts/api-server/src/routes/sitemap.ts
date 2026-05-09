import { Router } from "express";
import { db, usersTable, vendorProfilesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

const BASE_URL = "https://cleanlinktr.com";

const CITIES = [
  "İstanbul", "Ankara", "İzmir", "Bursa", "Antalya",
  "Adana", "Konya", "Gaziantep", "Kocaeli", "Mersin",
];

const SERVICES = ["ev-temizligi", "koltuk-yikama", "hali-yikama", "arac-sandalye", "yatak-yorgan"];

const BLOG_SLUGS = [
  "istanbul-hali-yikama-fiyatlari-2026",
  "profesyonel-koltuk-yikama-nasil-yapilir",
  "ankara-ev-temizligi-daire-tipine-gore",
  "yatak-yorgan-temizligi-akar-koruma",
  "izmir-arac-ici-detayli-temizlik",
  "dogru-temizlik-firmasi-secimi",
  "bursa-hali-yikama-fabrika-mi-yerinde-mi",
  "ev-temizliginde-dogal-urunler",
  "antalya-tatil-sonrasi-ev-temizligi",
];

const STATIC_PAGES: Array<[string, string, string]> = [
  ["/",                   "1.0", "weekly"],
  ["/firmalar",           "0.9", "daily"],
  ["/hakkimizda",         "0.7", "monthly"],
  ["/kariyer",            "0.6", "weekly"],
  ["/blog",               "0.8", "weekly"],
  ["/iletisim",           "0.6", "monthly"],
  ["/kullanim-kosullari", "0.3", "yearly"],
  ["/gizlilik-politikasi","0.3", "yearly"],
  ["/kvkk",               "0.3", "yearly"],
  ["/cerez-politikasi",   "0.3", "yearly"],
];

function toSlug(name: string): string {
  return name
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i").replace(/İ/g, "i")
    .replace(/ş/g, "s").replace(/Ş/g, "s")
    .replace(/ç/g, "c").replace(/Ç/g, "c")
    .replace(/ğ/g, "g").replace(/Ğ/g, "g")
    .replace(/ü/g, "u").replace(/Ü/g, "u")
    .replace(/ö/g, "o").replace(/Ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, c => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;",
  }[c]!));
}

router.get("/sitemap.xml", async (_req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const urls: Array<{ loc: string; priority: string; changefreq: string }> = [];

  /* Static pages */
  for (const [path, p, f] of STATIC_PAGES) {
    urls.push({ loc: `${BASE_URL}${path}`, priority: p, changefreq: f });
  }

  /* City × Service landing pages (50 URLs) */
  for (const city of CITIES) {
    for (const svc of SERVICES) {
      urls.push({
        loc: `${BASE_URL}/hizmet/${toSlug(city)}/${svc}`,
        priority: "0.8",
        changefreq: "weekly",
      });
    }
  }

  /* Blog post pages */
  for (const slug of BLOG_SLUGS) {
    urls.push({ loc: `${BASE_URL}/blog/${slug}`, priority: "0.7", changefreq: "monthly" });
  }

  /* Vendor profile pages (dynamic) */
  try {
    const vendors = await db
      .select({ name: usersTable.name })
      .from(vendorProfilesTable)
      .innerJoin(usersTable, eq(vendorProfilesTable.userId, usersTable.id))
      .where(and(
        eq(vendorProfilesTable.isPublished, true),
        eq(vendorProfilesTable.isAdminHidden, false),
      ));

    for (const v of vendors) {
      if (!v.name) continue;
      urls.push({
        loc: `${BASE_URL}/firma/${toSlug(v.name)}`,
        priority: "0.7",
        changefreq: "weekly",
      });
    }
  } catch {
    /* if DB fails, still serve static + landing pages */
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

  res.set("Content-Type", "application/xml; charset=utf-8");
  res.set("Cache-Control", "public, max-age=3600");
  res.send(xml);
});

export default router;
