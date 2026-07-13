import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Banknote, Check, X, Loader2, Info, AlertTriangle, ShieldCheck } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import PageTransition from '../../components/PageTransition';
import { SkeletonTable } from '../../components/SkeletonLoaders';
import EmptyState from '../../components/EmptyState';
import { getAllWithdrawalRequests, proceedWithdrawal } from '../../api/admin';
import { formatCurrency } from '../../utils/chartData';
import { useToast } from '../../context/ToastContext';
import Pagination from '../../components/Pagination';

const statusColors = {
  PENDING: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  SUCCESS: 'text-mint bg-mint-900/40 border-mint/20',
  DECLINE: 'text-carmine bg-carmine/10 border-carmine/20',
};

/* ─── Confirmation Modal ────────────────────────────────── */
function ConfirmModal({ open, onClose, onConfirm, isApprove, withdrawal }) {
  if (!open || !withdrawal) return null;

  const actionLabel = isApprove ? 'Approve' : 'Decline & Refund';
  const userName = withdrawal.user?.fullName || withdrawal.user?.email || 'Unknown user';

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-void-800/95 backdrop-blur-2xl shadow-2xl overflow-hidden"
          >
            {/* Accent glow bar */}
            <div
              className={`h-1 w-full ${
                isApprove
                  ? 'bg-gradient-to-r from-mint/80 via-mint to-mint/80'
                  : 'bg-gradient-to-r from-carmine/80 via-carmine to-carmine/80'
              }`}
            />

            <div className="p-6 sm:p-8">
              {/* Icon */}
              <div className="flex justify-center mb-5">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                    isApprove
                      ? 'bg-mint-900/40 border border-mint/20'
                      : 'bg-carmine/10 border border-carmine/20'
                  }`}
                >
                  {isApprove ? (
                    <ShieldCheck size={26} className="text-mint" />
                  ) : (
                    <AlertTriangle size={26} className="text-carmine" />
                  )}
                </div>
              </div>

              {/* Title */}
              <h3 className="font-display text-lg font-bold text-ink text-center mb-2">
                {isApprove ? 'Approve Withdrawal?' : 'Decline & Refund?'}
              </h3>

              {/* Description */}
              <p className="text-sm text-ink-muted text-center mb-6 leading-relaxed">
                Are you sure you want to <span className={`font-semibold ${isApprove ? 'text-mint' : 'text-carmine'}`}>{actionLabel.toUpperCase()}</span> this withdrawal request?
              </p>

              {/* Request details card */}
              <div className="rounded-xl border border-white/[0.06] bg-void-900/60 p-4 mb-6 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-ink-faint font-mono-tab uppercase tracking-wider">User</span>
                  <span className="text-sm text-ink font-semibold">{userName}</span>
                </div>
                <div className="h-px bg-white/[0.04]" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-ink-faint font-mono-tab uppercase tracking-wider">Amount</span>
                  <span className="text-base text-ink font-bold font-mono-tab">{formatCurrency(withdrawal.amount)}</span>
                </div>
                <div className="h-px bg-white/[0.04]" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-ink-faint font-mono-tab uppercase tracking-wider">Request ID</span>
                  <span className="text-xs text-ink-muted font-mono-tab">#{withdrawal.id}</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-ink-muted bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] hover:text-ink transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                    isApprove
                      ? 'bg-mint text-void hover:bg-mint-300 shadow-mint'
                      : 'bg-carmine text-white hover:bg-carmine/90 shadow-lg'
                  }`}
                >
                  {actionLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ─── Main Page ──────────────────────────────────────────── */
export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actingId, setActingId] = useState(null);
  const { push } = useToast();
  const [currentPagePending, setCurrentPagePending] = useState(1);
  const [currentPageResolved, setCurrentPageResolved] = useState(1);
  const itemsPerPage = 10;

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({ open: false, withdrawal: null, isApprove: true });

  const load = () => {
    setLoading(true);
    getAllWithdrawalRequests()
      .then((data) => setWithdrawals(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.friendlyMessage || 'Could not load withdrawal requests.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  // Open the modal instead of window.confirm
  const openConfirm = (withdrawal, accept) => {
    setConfirmModal({ open: true, withdrawal, isApprove: accept });
  };

  const closeConfirm = () => {
    setConfirmModal({ open: false, withdrawal: null, isApprove: true });
  };

  const handleConfirmedAction = async () => {
    const { withdrawal, isApprove } = confirmModal;
    if (!withdrawal) return;
    closeConfirm();

    setActingId(withdrawal.id);
    try {
      await proceedWithdrawal(withdrawal.id, isApprove);
      push(isApprove ? 'Withdrawal approved successfully.' : 'Withdrawal declined and refunded to user.', 'success');
      load();
    } catch (e) {
      push(e.friendlyMessage || 'Could not process this withdrawal.', 'error');
    } finally {
      setActingId(null);
    }
  };

  const pending = withdrawals.filter((w) => w.status === 'PENDING');
  const resolved = withdrawals.filter((w) => w.status !== 'PENDING');

  const totalPendingAmount = pending.reduce((sum, w) => sum + (w.amount || 0), 0);
  const totalApprovedAmount = resolved.filter(w => w.status === 'SUCCESS').reduce((sum, w) => sum + (w.amount || 0), 0);

  const totalPagesPending = Math.ceil(pending.length / itemsPerPage);
  const currentPending = pending.slice((currentPagePending - 1) * itemsPerPage, currentPagePending * itemsPerPage);

  const totalPagesResolved = Math.ceil(resolved.length / itemsPerPage);
  const currentResolved = resolved.slice((currentPageResolved - 1) * itemsPerPage, currentPageResolved * itemsPerPage);

  return (
    <PageTransition className="pb-16">
      <PageHeader
        eyebrow="Review Desk"
        title="Withdrawal Requests"
        description={`${pending.length} pending request${pending.length === 1 ? '' : 's'} awaiting platform confirmation.`}
      />

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        open={confirmModal.open}
        onClose={closeConfirm}
        onConfirm={handleConfirmedAction}
        isApprove={confirmModal.isApprove}
        withdrawal={confirmModal.withdrawal}
      />

      <div className="px-4 sm:px-8 space-y-6">
        {/* Administrative summaries */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/[0.07] bg-void-800/60 p-5 backdrop-blur-xl">
            <span className="text-[10px] text-ink-faint uppercase tracking-wider font-mono-tab">Total Pending Value</span>
            <div className="font-display text-xl font-bold text-amber-400 mt-1">{formatCurrency(totalPendingAmount)}</div>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-void-800/60 p-5 backdrop-blur-xl">
            <span className="text-[10px] text-ink-faint uppercase tracking-wider font-mono-tab">Total Processed Value</span>
            <div className="font-display text-xl font-bold text-mint mt-1">{formatCurrency(totalApprovedAmount)}</div>
          </div>
        </div>

        {/* Pending Box */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/[0.07] bg-void-800/60 overflow-hidden backdrop-blur-xl"
        >
          <div className="px-5 sm:px-6 py-4 border-b border-white/[0.06] bg-void-900/40">
            <span className="font-display text-xs font-bold text-ink uppercase tracking-wider">Awaiting review</span>
          </div>

          {loading ? (
            <SkeletonTable rows={3} cols={3} />
          ) : error ? (
            <div className="p-10 text-center text-sm text-carmine">{error}</div>
          ) : pending.length === 0 ? (
            <EmptyState
              icon={Banknote}
              title="No pending requests"
              description="There are currently no withdrawal requests pending audit."
            />
          ) : (
            <>
              <div className="divide-y divide-white/[0.04]">
                {currentPending.map((w) => (
                  <div key={w.id} className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4 hover:bg-white/[0.01] transition-colors">
                    <div>
                      <div className="text-sm text-ink font-semibold">
                        {w.user?.fullName || w.user?.email || 'Unknown user'}
                      </div>
                      <div className="text-xs text-ink-faint font-mono-tab mt-0.5">
                        Request ID #{w.id} · {w.date ? new Date(w.date).toLocaleString() : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono-tab text-base text-ink font-bold mr-2">{formatCurrency(w.amount)}</span>
                      <button
                        onClick={() => openConfirm(w, true)}
                        disabled={actingId === w.id}
                        className="w-9 h-9 rounded-xl bg-mint-900/40 text-mint border border-mint/20 flex items-center justify-center hover:bg-mint-900/60 transition-all disabled:opacity-50 shadow-mint-sm"
                        title="Approve request"
                      >
                        {actingId === w.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={15} />}
                      </button>
                      <button
                        onClick={() => openConfirm(w, false)}
                        disabled={actingId === w.id}
                        className="w-9 h-9 rounded-xl bg-carmine/10 text-carmine border border-carmine/20 flex items-center justify-center hover:bg-carmine/20 transition-all disabled:opacity-50"
                        title="Decline & refund"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <Pagination
                currentPage={currentPagePending}
                totalPages={totalPagesPending}
                onPageChange={setCurrentPagePending}
              />
            </>
          )}
        </motion.div>

        {/* Resolved/History Box */}
        {!loading && resolved.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="rounded-2xl border border-white/[0.07] bg-void-800/60 overflow-hidden backdrop-blur-xl"
          >
            <div className="px-5 sm:px-6 py-4 border-b border-white/[0.06] bg-void-900/40">
              <span className="font-display text-xs font-bold text-ink uppercase tracking-wider">Processed History</span>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {currentResolved.map((w) => (
                <div key={w.id} className="flex items-center justify-between gap-4 px-5 sm:px-6 py-3.5 hover:bg-white/[0.01] transition-colors">
                  <div>
                    <div className="text-sm text-ink font-semibold">{w.user?.fullName || w.user?.email || 'Unknown user'}</div>
                    <div className="text-xs text-ink-faint font-mono-tab mt-0.5">
                      Request ID #{w.id} · {w.date ? new Date(w.date).toLocaleString() : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono-tab text-sm text-ink font-medium mr-2">{formatCurrency(w.amount)}</span>
                    <span
                      className={`text-[10px] font-mono-tab px-2 py-0.5 rounded-full border ${
                        statusColors[w.status] || statusColors.PENDING
                      }`}
                    >
                      {w.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Pagination
              currentPage={currentPageResolved}
              totalPages={totalPagesResolved}
              onPageChange={setCurrentPageResolved}
            />
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
