import { useState, useEffect } from "react";
import { Sprout, TreePine, MapPin } from "lucide-react";
import { useApp } from "@/context/AppContext";

const BASE_FIDAN = 1237;

const MESSAGES = [
  "fidan",
  "operasyon",
] as const;

export function AnnouncementBar() {
  const { orders } = useApp();
  const fidanCount = BASE_FIDAN + orders.reduce((acc, o) => acc + (o.fidanSayisi ?? 0), 0);
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setMsgIdx(i => (i + 1) % MESSAGES.length), 5000);
    return () => clearInterval(id);
  }, []);

  const current = MESSAGES[msgIdx];

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] h-9 flex items-center px-4 overflow-hidden"
      style={{ backgroundColor: current === "fidan" ? "#065F46" : "#1E3A5F" }}
    >
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
        {current === "fidan" ? (
          <>
            <Sprout className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0 hidden sm:block" />
            <p className="flex-1 text-center text-white text-[11px] sm:text-xs font-semibold leading-snug tracking-wide truncate">
              🌳 Tertemiz Evler, Yeşeren Bir Gelecek — Her 2.500 TL ve Üzeri Hizmetinizde Adınıza Bir Fidan Dikiyoruz
            </p>
            <div className="flex-shrink-0 flex items-center gap-1 bg-white/15 border border-white/20 rounded-md px-2 py-0.5 backdrop-blur-sm">
              <TreePine className="w-3 h-3 text-emerald-300" />
              <span className="text-white text-[10px] font-bold whitespace-nowrap">
                #{fidanCount.toLocaleString("tr-TR")} Fidan Dikildi
              </span>
            </div>
          </>
        ) : (
          <>
            <MapPin className="w-3.5 h-3.5 text-blue-300 flex-shrink-0 hidden sm:block" />
            <p className="flex-1 text-center text-white text-[11px] sm:text-xs font-semibold leading-snug tracking-wide truncate">
              📍 Şu an sadece İstanbul genelinde tam kapasite hizmet vermekteyiz — 4 büyük şehrimiz için hazırlıklarımız devam ediyor!
            </p>
            <div className="flex-shrink-0 flex items-center gap-1 bg-white/15 border border-white/20 rounded-md px-2 py-0.5 backdrop-blur-sm">
              <span className="text-white text-[10px] font-bold whitespace-nowrap">🚀 Genişliyoruz</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
