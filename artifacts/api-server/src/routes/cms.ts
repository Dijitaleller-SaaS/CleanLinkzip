import { Router } from "express";
import { db, cmsBlogPostsTable, cmsPageContentTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import { requireAuth } from "../lib/authMiddleware";
import { requireAdmin } from "../lib/adminMiddleware";

const router = Router();

/* ── helpers ── */
function makeSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 200);
}

/* ──────────────────────────────────────────
   Blog Routes
   ────────────────────────────────────────── */

/* GET /api/cms/blog — public, returns published posts sorted */
router.get("/cms/blog", async (_req, res) => {
  try {
    const posts = await db
      .select()
      .from(cmsBlogPostsTable)
      .where(eq(cmsBlogPostsTable.published, true))
      .orderBy(asc(cmsBlogPostsTable.sortOrder), asc(cmsBlogPostsTable.createdAt));
    res.json({ posts });
  } catch {
    res.status(500).json({ error: "Blog yazıları yüklenemedi" });
  }
});

/* GET /api/cms/blog/all — admin only, returns all posts (draft+published) */
router.get("/cms/blog/all", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const posts = await db
      .select()
      .from(cmsBlogPostsTable)
      .orderBy(asc(cmsBlogPostsTable.sortOrder), asc(cmsBlogPostsTable.createdAt));
    res.json({ posts });
  } catch {
    res.status(500).json({ error: "Blog yazıları yüklenemedi" });
  }
});

/* GET /api/cms/blog/:slug — public, get single published post by slug */
router.get("/cms/blog/:slug", async (req, res) => {
  const slug = String(req.params.slug);
  try {
    const [post] = await db
      .select()
      .from(cmsBlogPostsTable)
      .where(and(eq(cmsBlogPostsTable.slug, slug), eq(cmsBlogPostsTable.published, true)))
      .limit(1);
    if (!post) { res.status(404).json({ error: "Yazı bulunamadı" }); return; }
    res.json({ post });
  } catch {
    res.status(500).json({ error: "Blog yazısı yüklenemedi" });
  }
});

/* POST /api/cms/blog — admin only, create post */
router.post("/cms/blog", requireAuth, requireAdmin, async (req, res) => {
  const { title, category, postDate, readTime, excerpt, sortOrder, slug, content, faq, published } = req.body as {
    title?: string; category?: string; postDate?: string;
    readTime?: string; excerpt?: string; sortOrder?: number;
    slug?: string; content?: unknown[]; faq?: unknown[]; published?: boolean;
  };

  if (!title) { res.status(400).json({ error: "Başlık zorunludur" }); return; }

  const finalSlug = (slug?.trim() || makeSlug(title)) || null;

  try {
    const [post] = await db
      .insert(cmsBlogPostsTable)
      .values({
        title,
        category:  category  ?? "",
        postDate:  postDate  ?? "",
        readTime:  readTime  ?? "",
        excerpt:   excerpt   ?? "",
        sortOrder: sortOrder ?? 0,
        slug:      finalSlug,
        content:   (content  ?? []) as never,
        faq:       (faq      ?? []) as never,
        published: published ?? false,
      })
      .returning();
    res.status(201).json({ post });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      res.status(409).json({ error: "Bu slug zaten kullanımda, farklı bir slug girin." });
    } else {
      res.status(500).json({ error: "Blog yazısı oluşturulamadı" });
    }
  }
});

/* PUT /api/cms/blog/:id — admin only, update post */
router.put("/cms/blog/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "Geçersiz ID" }); return; }

  const { title, category, postDate, readTime, excerpt, sortOrder, slug, content, faq, published } = req.body;

  try {
    const [updated] = await db
      .update(cmsBlogPostsTable)
      .set({
        ...(title     !== undefined && { title }),
        ...(category  !== undefined && { category }),
        ...(postDate  !== undefined && { postDate }),
        ...(readTime  !== undefined && { readTime }),
        ...(excerpt   !== undefined && { excerpt }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(slug      !== undefined && { slug: slug?.trim() || null }),
        ...(content   !== undefined && { content: content as never }),
        ...(faq       !== undefined && { faq: faq as never }),
        ...(published !== undefined && { published }),
        updatedAt: new Date(),
      })
      .where(eq(cmsBlogPostsTable.id, id))
      .returning();

    if (!updated) { res.status(404).json({ error: "Yazı bulunamadı" }); return; }
    res.json({ post: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      res.status(409).json({ error: "Bu slug zaten kullanımda, farklı bir slug girin." });
    } else {
      res.status(500).json({ error: "Güncelleme sırasında hata oluştu" });
    }
  }
});

/* DELETE /api/cms/blog/:id — admin only */
router.delete("/cms/blog/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "Geçersiz ID" }); return; }

  try {
    await db.delete(cmsBlogPostsTable).where(eq(cmsBlogPostsTable.id, id));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Silme sırasında hata oluştu" });
  }
});

/* ──────────────────────────────────────────
   Page Content Routes
   ────────────────────────────────────────── */

/* GET /api/cms/pages/:pageKey — public, returns all fields for a page */
router.get("/cms/pages/:pageKey", async (req, res) => {
  const pageKey = String(req.params.pageKey);
  try {
    const rows = await db
      .select()
      .from(cmsPageContentTable)
      .where(eq(cmsPageContentTable.pageKey, pageKey));

    const content: Record<string, string> = {};
    rows.forEach(r => { content[r.fieldKey] = r.content; });
    res.json({ content });
  } catch {
    res.status(500).json({ error: "Sayfa içeriği yüklenemedi" });
  }
});

/* PUT /api/cms/pages/:pageKey — admin only, upsert fields */
router.put("/cms/pages/:pageKey", requireAuth, requireAdmin, async (req, res) => {
  const pageKey = String(req.params.pageKey);
  const fields = req.body as Record<string, string>;

  try {
    for (const [fieldKey, content] of Object.entries(fields)) {
      const existing = await db
        .select({ id: cmsPageContentTable.id })
        .from(cmsPageContentTable)
        .where(
          and(
            eq(cmsPageContentTable.pageKey, pageKey),
            eq(cmsPageContentTable.fieldKey, fieldKey),
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(cmsPageContentTable)
          .set({ content, updatedAt: new Date() })
          .where(eq(cmsPageContentTable.id, existing[0].id));
      } else {
        await db
          .insert(cmsPageContentTable)
          .values({ pageKey, fieldKey, content });
      }
    }

    const rows = await db
      .select()
      .from(cmsPageContentTable)
      .where(eq(cmsPageContentTable.pageKey, pageKey));

    const result: Record<string, string> = {};
    rows.forEach(r => { result[r.fieldKey] = r.content; });
    res.json({ content: result });
  } catch {
    res.status(500).json({ error: "İçerik kaydedilirken hata oluştu" });
  }
});

export default router;
