import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import PageTransition from '../../components/PageTransition';
import { SkeletonTable } from '../../components/SkeletonLoaders';
import EmptyState from '../../components/EmptyState';
import { ExportOrdersButton } from '../../components/ExportButton';
import { getAllOrders } from '../../api/trading';
import { formatCurrency } from '../../utils/chartData';

const statusColors = {
  PENDING: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  FILLED: 'text-mint bg-mint-900/40 border-mint/20',
  SUCCESS: 'text-mint bg-mint-900/40 border-mint/20',
  CANCELLED: 'text-ink-faint bg-white/5 border-white/10',
  PARTIALLY_FILLED: 'text-violet-400 bg-violet-600/10 border-violet/20',
  ERROR: 'text-carmine bg-carmine/10 border-carmine/20',
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    setLoading(true);
    getAllOrders(filter === 'ALL' ? undefined : filter, undefined)
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.friendlyMessage || 'Could not load your orders.'))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <PageTransition className="pb-16">
      <PageHeader
        eyebrow="Activity"
        title="Orders Ledger"
        description="Every buy and sell request you have placed on the vault."
        action={
          <div className="flex items-center gap-3">
            <ExportOrdersButton orders={orders} />
            <div className="flex items-center gap-1 p-0.5 rounded-xl border border-white/10 bg-void-900/60 backdrop-blur-xl">
              {['ALL', 'BUY', 'SELL'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-display font-semibold transition-all ${
                    filter === f ? 'bg-mint text-void font-bold shadow-mint-sm' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <div className="px-4 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/[0.07] bg-void-800/60 overflow-hidden backdrop-blur-xl"
        >
          {loading ? (
            <SkeletonTable rows={5} cols={7} />
          ) : error ? (
            <div className="p-10 text-center text-sm text-carmine">{error}</div>
          ) : orders.length === 0 ? (
            <EmptyState
              icon={ArrowLeftRight}
              title="No orders found"
              description="Your order book is currently empty. Place buy or sell orders from the Markets desk."
              actionLabel="Trade now"
              actionTo="/app/markets"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink-faint text-[10px] uppercase tracking-wider font-mono-tab border-b border-white/[0.04]">
                    <th className="px-5 sm:px-6 py-3.5 font-normal">Order</th>
                    <th className="px-4 py-3.5 font-normal">Type</th>
                    <th className="px-4 py-3.5 font-normal">Asset</th>
                    <th className="px-4 py-3.5 font-normal">Quantity</th>
                    <th className="px-4 py-3.5 font-normal">Price</th>
                    <th className="px-4 py-3.5 font-normal">Status</th>
                    <th className="px-5 sm:px-6 py-3.5 font-normal text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-5 sm:px-6 py-4 font-mono-tab text-ink-faint text-xs">#{o.id}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-display font-bold ${
                            o.orderType === 'BUY' ? 'text-mint' : 'text-carmine'
                          }`}
                        >
                          {o.orderType === 'BUY' ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                          {o.orderType}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {o.orderItem?.coin?.image && (
                            <img src={o.orderItem.coin.image} alt="" className="w-5 h-5 rounded-full" />
                          )}
                          <span className="text-ink font-semibold">{o.orderItem?.coin?.symbol?.toUpperCase() || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-mono-tab text-ink-muted">{o.orderItem?.quantity ?? '—'}</td>
                      <td className="px-4 py-4 font-mono-tab text-ink-muted font-medium">{formatCurrency(o.price)}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-block text-[10px] font-mono-tab px-2 py-0.5 rounded-full border ${
                            statusColors[o.status] || statusColors.PENDING
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="px-5 sm:px-6 py-4 text-right text-xs text-ink-faint font-mono-tab">
                        {o.timestamp ? new Date(o.timestamp).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </PageTransition>
  );
}
