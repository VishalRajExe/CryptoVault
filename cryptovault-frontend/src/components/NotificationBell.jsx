import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ArrowDownLeft, ArrowUpRight, Send, ShieldCheck, UserPlus, Loader2 } from 'lucide-react';
import { getMyNotifications, markNotificationsRead } from '../api/auth';

const typeIcon = {
  SIGNUP: { icon: UserPlus, color: 'text-violet-400 bg-violet-600/15' },
  DEPOSIT: { icon: ArrowDownLeft, color: 'text-mint bg-mint-900/50' },
  WITHDRAWAL_REQUESTED: { icon: ArrowUpRight, color: 'text-amber-400 bg-amber-400/10' },
  WITHDRAWAL_APPROVED: { icon: ArrowDownLeft, color: 'text-mint bg-mint-900/50' },
  WITHDRAWAL_DECLINED: { icon: ArrowUpRight, color: 'text-carmine bg-carmine/10' },
  WALLET_TRANSFER_SENT: { icon: Send, color: 'text-violet-400 bg-violet-600/15' },
  WALLET_TRANSFER_RECEIVED: { icon: ArrowDownLeft, color: 'text-mint bg-mint-900/50' },
  ORDER_BUY: { icon: ArrowUpRight, color: 'text-carmine bg-carmine/10' },
  ORDER_SELL: { icon: ArrowDownLeft, color: 'text-mint bg-mint-900/50' },
};

function timeAgo(iso) {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef(null);

  const unreadCount = items.filter((n) => !n.read).length;

  const load = useCallback(() => {
    setLoading(true);
    getMyNotifications()
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        setLoaded(true);
      });
  }, []);

  // Poll quietly in the background so the unread dot stays current even when closed.
  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open && unreadCount > 0) {
      markNotificationsRead()
        .then(() => setItems((prev) => prev.map((n) => ({ ...n, read: true }))))
        .catch(() => {});
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-white/[0.05] transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-carmine" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full mt-2 w-80 max-h-[28rem] overflow-y-auto rounded-2xl border border-white/10 bg-[#101012] backdrop-blur-xl shadow-2xl z-[100]"
          >
            <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
              <span className="font-display text-sm font-semibold text-ink">Activity</span>
              {loading && <Loader2 size={13} className="animate-spin text-ink-faint" />}
            </div>

            {!loaded && loading ? (
              <div className="p-6 space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center">
                <ShieldCheck size={22} className="mx-auto text-ink-faint mb-2" />
                <p className="text-xs text-ink-faint">No activity yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.05]">
                {items.map((n) => {
                  const meta = typeIcon[n.type] || { icon: Bell, color: 'text-ink-muted bg-white/5' };
                  const Icon = meta.icon;
                  return (
                    <div key={n.id} className={`flex items-start gap-3 px-4 py-3 ${!n.read ? 'bg-white/[0.02]' : ''}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.color}`}>
                        <Icon size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-ink leading-snug">{n.message}</p>
                        <p className="text-[10px] text-ink-faint mt-1 font-mono-tab">{timeAgo(n.timestamp)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
