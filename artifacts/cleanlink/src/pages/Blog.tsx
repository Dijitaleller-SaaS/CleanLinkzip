import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useSEO } from "@/hooks/useSEO";
import { PageLayout } from "@/components/layout/PageLayout";
import { BookOpen, Clock, Tag, ArrowRight } from "lucide-react";
import { apiGetBlogPosts, type CmsBlogPost } from "@/lib/api";

const GRADIENTS = [
  { gradient: "from-emerald-50 to-teal-50",  border: "border-emerald-200", dot: "bg-emerald-500" },
  { gradient: "from-blue-50 to-indigo-50",   border: "border-blue-200",    dot: "bg-blue-500" },
  { gradient: "from-purple-50 to-violet-50", border: "border-purple-200",  dot: "bg-purple-500" },
  { gradient: "from-rose-50 to-pink-50",     border: "border-rose-200",    dot: "bg-rose-500" },
  { gradient: "from-amber-50 to-orange-50",  border: "border-amber-200",   dot: "bg-amber-500" },
];

interface DisplayPost {
  title: string;
  category: string;
  postDate: string;
  readTime: string;
  excerpt: string;
  link?: string;
  gradient: string;
  border: string;
  dot: string;
}

import { ALL_BLOG_POSTS } from "@/pages/BlogPost";
const DEFAULT_POSTS: Omit<DisplayPost, keyof typeof GRADIENTS[number]>[] = ALL_BLOG_POSTS.map(p => ({
  title: p.title,
  category: p.category,
  postDate: p.postDate,
  readTime: p.readTime,
  excerpt: p.excerpt,
  link: `/blog/${p.slug}`,
} as DisplayPost));

function withColors(p: Omit<DisplayPost, "gradient" | "border" | "dot">, i: number): DisplayPost {
  const g = GRADIENTS[i % GRADIENTS.length];
  return { ...p, ...g };
}

function toDisplay(p: CmsBlogPost, i: number): DisplayPost {
  const g = GRADIENTS[i % GRADIENTS.length];
  return { title: p.title, category: p.category, postDate: p.postDate, readTime: p.readTime, excerpt: p.excerpt, ...g };
}

export default function Blog() {
  useSEO({
    title: "Blog — Temizlik Rehberi, Fiyatlar ve Sektör İpuçları",
    description: "Ev temizliği, koltuk yıkama, halı bakımı, araç içi temizlik ve yatak hijyeni hakkında uzman rehberleri. Şehir bazlı fiyatlar ve karşılaştırmalı analizler.",
    canonical: "/blog",
  });
  const [posts, setPosts] = useState<DisplayPost[]>(() => DEFAULT_POSTS.map((p, i) => withColors(p, i)));

  useEffect(() => {
    apiGetBlogPosts()
      .then(dbPosts => { if (dbPosts.length > 0) setPosts(dbPosts.map((p, i) => toDisplay(p, i))); })
      .catch(() => { /* keep defaults */ });
  }, []);

  return (
    <PageLayout breadcrumbs={[{ label: "Blog" }]}>
      <div className="max-w-4xl mx-auto">

        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
            CleanLink <span className="text-primary">Blog</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Şehir bazlı fiyat rehberleri, hizmet karşılaştırmaları ve uzman temizlik ipuçları.
          </p>
        </div>

        <div className="space-y-6 mb-16">
          {posts.map(post => {
            const Wrapper: React.ElementType = post.link ? Link : "div";
            const wrapperProps = post.link ? { href: post.link } : {};
            return (
              <Wrapper key={post.title} {...wrapperProps}>
                <article
                  className={`bg-gradient-to-br ${post.gradient} border ${post.border} rounded-2xl p-6 md:p-8 hover:shadow-md transition-shadow cursor-pointer group block`}
                >
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <span className={`w-2 h-2 rounded-full ${post.dot}`} />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{post.category}</span>
                    <span className="text-muted-foreground/50">·</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {post.readTime} okuma
                    </span>
                    <span className="text-muted-foreground/50">·</span>
                    <span className="text-xs text-muted-foreground">{post.postDate}</span>
                  </div>
                  <h2 className="text-xl font-display font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">{post.excerpt}</p>
                  <div className="mt-4 flex items-center gap-1 text-primary text-sm font-semibold group-hover:gap-2 transition-all">
                    <BookOpen className="w-4 h-4" />
                    Devamını Oku
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </article>
              </Wrapper>
            );
          })}
        </div>

        <div className="bg-foreground text-white rounded-3xl p-8 text-center mb-16">
          <Tag className="w-8 h-8 text-primary mx-auto mb-3" />
          <h2 className="text-xl font-display font-bold mb-2">Daha Fazla İçerik Yolda</h2>
          <p className="text-white/60 text-sm max-w-md mx-auto">
            Her hafta yeni içerikler yayınlıyoruz. Bültenimize abone olun, temizlik dünyasındaki son gelişmeleri kaçırmayın.
          </p>
          <div className="mt-5 flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
            <input
              type="email"
              placeholder="E-posta adresiniz"
              className="flex-1 px-4 py-2.5 rounded-xl text-sm text-foreground bg-white focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
              Abone Ol
            </button>
          </div>
        </div>

      </div>
    </PageLayout>
  );
}
