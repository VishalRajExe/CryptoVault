import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet as WalletIcon } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { getAllWallets } from '../../api/admin';
import { formatCurrency } from '../../utils/chartData';
import Pagination from '../../components/Pagination';

export default function AdminWallets() {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    getAllWallets()
      .then((data) => setWallets(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.friendlyMessage || 'Could not load wallets.'))
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.ceil(wallets.length / itemsPerPage);
  const currentWallets = wallets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const total = wallets.reduce((s, w) => s + (w.balance || 0), 0);

  return (
    <div className="pb-16">
      <PageHeader
        eyebrow="Funds"
        title="All wallets"
        description={`${wallets.length} wallet${wallets.length === 1 ? '' : 's'} · ${formatCurrency(total)} total balance.`}
      />

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
          ) : wallets.length === 0 ? (
            <div className="p-12 text-center">
              <WalletIcon size={28} className="mx-auto text-ink-faint mb-3" />
              <p className="text-sm text-ink-muted">No wallets found.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink-faint text-xs uppercase tracking-wide font-mono-tab">
                    <th className="px-5 sm:px-6 py-3 font-normal">Wallet ID</th>
                    <th className="px-4 py-3 font-normal">Owner</th>
                    <th className="px-5 sm:px-6 py-3 font-normal text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {currentWallets.map((w) => (
                    <tr key={w.id} className="border-t border-white/[0.05]">
                      <td className="px-5 sm:px-6 py-3.5 font-mono-tab text-ink">#{w.id}</td>
                      <td className="px-4 py-3.5 text-ink-muted text-xs">
                        {w.user?.fullName || w.user?.email || '—'}
                      </td>
                      <td className="px-5 sm:px-6 py-3.5 text-right font-mono-tab text-ink font-medium">
                        {formatCurrency(w.balance)}
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
