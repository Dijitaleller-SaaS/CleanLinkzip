import { useSEO } from "@/hooks/useSEO";
import { Header } from "@/components/layout/Header";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { FeaturedCompanies } from "@/components/home/FeaturedCompanies";
import { PopularLinks } from "@/components/home/PopularLinks";

export default function Home() {
  useSEO({
    title: "Profesyonel Ev, Ofis, Koltuk ve Halı Temizliği",
    description: "CleanLink ile eviniz, ofisiniz, koltuğunuz ve halınız için en iyi temizlik firmalarını bulun. İstanbul, Ankara, İzmir'de onaylı profesyoneller, şeffaf fiyatlar, anında rezervasyon.",
    canonical: "/",
  });
  return (
    <div className="min-h-screen flex flex-col w-full selection:bg-primary/20 selection:text-primary">
      <AnnouncementBar />
      <Header />
      <main className="flex-grow">
        <div id="hizmetler">
          <Hero />
        </div>
        <HowItWorks />
        <FeaturedCompanies />
        <PopularLinks />
      </main>
      <Footer />
    </div>
  );
}
