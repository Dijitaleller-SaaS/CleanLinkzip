import { useEffect, useRef, useState } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  apiGetNotifications, apiMarkNotificationRead, apiMarkAllNotificationsRead,
  type ApiNotification,
} from "@/lib/api";

function relativeTime(iso: string): string {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return "az önce";
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa önce`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days} gün önce`;
  return new Date(iso).toLocaleDateString("tr-TR");
}

const TYPE_DOT: Record<string, string> = {
  new_order:    "bg-blue-500",
  order_status: "bg-emerald-500",
  review:       "bg-amber-500",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ApiNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  async function fetchOnce() {
    try {
      const { notifications, unreadCount } = await apiGetNotifications();
      setItems(notifications);
      setUnread(unreadCount);
    } catch { /* user may have been logged out */ }
  }

  useEffect(() => {
    fetchOnce();
    const id = setInterval(fetchOnce, 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function handleClick(n: ApiNotification) {
    if (!n.isRead) {
      try { await apiMarkNotificationRead(n.id); } catch { /* ignore */ }
      setItems(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x));
      setUnread(c => Math.max(0, c - 1));
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  }

  async function markAll() {
    try { await apiMarkAllNotificationsRead(); } catch { /* ignore */ }
    setItems(prev => prev.map(x => ({ ...x, isRead: true })));
    setUnread(0);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-primary/5 text-foreground transition-colors"
        aria-label="Bildirimler"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white border border-border rounded-2xl shadow-xl overflow-hidden z-50"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <p className="font-bold text-sm text-foreground">Bildirimler</p>
              {unread > 0 && (
                <button
                  onClick={markAll}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Tümünü okundu işaretle
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Henüz bildiriminiz yok.
                </div>
              ) : items.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-border/50 hover:bg-secondary/40 transition-colors ${!n.isRead ? "bg-primary/[0.03]" : ""}`}
                >
                  <span className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${TYPE_DOT[n.type] ?? "bg-muted-foreground"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm truncate ${n.isRead ? "font-medium text-foreground" : "font-bold text-foreground"}`}>
                        {n.title}
                      </p>
                      {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
                    </div>
                    {n.body && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground/80 mt-1 flex items-center gap-1">
                      {n.isRead && <Check className="w-3 h-3" />}
                      {relativeTime(n.createdAt)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
