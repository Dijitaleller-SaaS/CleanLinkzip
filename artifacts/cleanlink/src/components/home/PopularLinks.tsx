import { Link } from "wouter";
import { MapPin, Sparkles } from "lucide-react";
import { SERVICE_GROUP_LANDINGS } from "@/pages/HizmetSehir";
import { toSlug } from "@/lib/analytics";

const ACTIVE_CITIES = ["İstanbul", "Bursa", "İzmir", "Ankara"];

export function PopularLinks() {
  return (
    <section className="bg-secondary/30 border-t border-border py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2">
            <Sparkles className="w-3 h-3" /> POPÜLER ARAMALAR
          </span>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Şehrinizdeki Temizlik Hizmetleri
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">
            İstanbul, Ankara, İzmir ve Bursa'da onaylı firmalar ve güncel fiyatlar.
          </p>
        </div>

        {/* Per-service grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICE_GROUP_LANDINGS.map(svc => (
            <div key={svc.slug} className="bg-white rounded-2xl border border-border p-5">
              <h3 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                {svc.label}
              </h3>
              <ul className="space-y-1.5">
                {ACTIVE_CITIES.map(city => (
                  <li key={city}>
                    <Link
                      href={`/hizmet/${toSlug(city)}/${svc.slug}`}
                      className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1.5 transition"
                    >
                      <MapPin className="w-3 h-3" />
                      {city} {svc.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Cities row */}
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3 text-center">
            Hizmet Verdiğimiz Şehirler
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {ACTIVE_CITIES.map(city => (
              <Link
                key={city}
                href={`/hizmet/${toSlug(city)}/ev-temizligi`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-border text-xs text-foreground hover:border-primary hover:text-primary transition"
              >
                <MapPin className="w-3 h-3" /> {city}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
