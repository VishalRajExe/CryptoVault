import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, ArrowDownLeft, ArrowUpRight, Send, UserPlus } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { getAllActivity } from '../../api/admin';
import Pagination from '../../components/Pagination';

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

export default function AdminActivity() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    getAllActivity()
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.friendlyMessage || 'Could not load activity.'))
      .finally(() => setLoading(false));
  }, []);

  const types = ['ALL', ...new Set(items.map((i) => i.type))];
  const filtered = filter === 'ALL' ? items : items.filter((i) => i.type === filter);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="pb-16">
      <PageHeader
        eyebrow="Audit trail"
        title="Full activity"
        description="Every notable action across every user — who did what, and when."
        action={
          types.length > 1 && (
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border border-white/10 bg-void-900/60 px-3 py-2 text-xs text-ink outline-none focus:border-violet/50"
            >
              {types.map((t) => (
                <option key={t} value={t}>
                  {t === 'ALL' ? 'All activity' : t.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          )
        }
      />

      <div className="px-4 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/[0.07] bg-void-800/60 overflow-hidden"
        >
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="p-10 text-center text-sm text-ink-muted">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Activity size={28} className="mx-auto text-ink-faint mb-3" />
              <p className="text-sm text-ink-muted">No activity recorded yet.</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-white/[0.05]">
                {currentItems.map((n) => {
                  const meta = typeIcon[n.type] || { icon: Activity, color: 'text-ink-muted bg-white/5' };
                  const Icon = meta.icon;
                  return (
                    <div key={n.id} className="flex items-start gap-3 px-5 sm:px-6 py-3.5">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${meta.color}`}>
                        <Icon size={15} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-ink font-medium truncate">
                            {n.user?.fullName || n.user?.email || 'Unknown user'}
                          </span>
                          <span className="text-xs text-ink-faint font-mono-tab shrink-0">
                            {n.timestamp ? new Date(n.timestamp).toLocaleString() : ''}
                          </span>
                        </div>
                        <p className="text-xs text-ink-muted mt-0.5">{n.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
