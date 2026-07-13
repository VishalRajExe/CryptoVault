import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { getAllOrders } from '../../api/admin';
import { formatCurrency } from '../../utils/chartData';
import Pagination from '../../components/Pagination';

const statusColors = {
  PENDING: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  FILLED: 'text-mint bg-mint-900/40 border-mint/20',
  SUCCESS: 'text-mint bg-mint-900/40 border-mint/20',
  CANCELLED: 'text-ink-faint bg-white/5 border-white/10',
  ERROR: 'text-carmine bg-carmine/10 border-carmine/20',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    getAllOrders()
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.friendlyMessage || 'Could not load orders.'))
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const currentOrders = orders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="pb-16">
      <PageHeader eyebrow="Trading" title="All orders" description={`${orders.length} order${orders.length === 1 ? '' : 's'} across every user.`} />

      <div className="px-4 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/[0.07] bg-void-800/60 overflow-hidden"
        >
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="p-10 text-center text-sm text-ink-muted">{error}</div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center">
              <ArrowLeftRight size={28} className="mx-auto text-ink-faint mb-3" />
              <p className="text-sm text-ink-muted">No orders placed yet.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink-faint text-xs uppercase tracking-wide font-mono-tab">
                    <th className="px-5 sm:px-6 py-3 font-normal">Order</th>
                    <th className="px-4 py-3 font-normal">User</th>
                    <th className="px-4 py-3 font-normal">Type</th>
                    <th className="px-4 py-3 font-normal">Asset</th>
                    <th className="px-4 py-3 font-normal">Price</th>
                    <th className="px-4 py-3 font-normal">Status</th>
                    <th className="px-5 sm:px-6 py-3 font-normal text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {currentOrders.map((o) => (
                    <tr key={o.id} className="border-t border-white/[0.05]">
                      <td className="px-5 sm:px-6 py-3.5 font-mono-tab text-ink-faint text-xs">#{o.id}</td>
                      <td className="px-4 py-3.5 text-ink text-xs truncate max-w-[10rem]">
                        {o.user?.fullName || o.user?.email || '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-display font-semibold ${
                            o.orderType === 'BUY' ? 'text-mint' : 'text-carmine'
                          }`}
                        >
                          {o.orderType === 'BUY' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          {o.orderType}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          {o.orderItem?.coin?.image && (
                            <img src={o.orderItem.coin.image} alt="" className="w-5 h-5 rounded-full" />
                          )}
                          <span className="text-ink">{o.orderItem?.coin?.symbol?.toUpperCase() || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono-tab text-ink-muted">{formatCurrency(o.price)}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block text-[11px] font-mono-tab px-2 py-1 rounded-full border ${
                            statusColors[o.status] || statusColors.PENDING
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="px-5 sm:px-6 py-3.5 text-right text-xs text-ink-faint font-mono-tab">
                        {o.timestamp ? new Date(o.timestamp).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
