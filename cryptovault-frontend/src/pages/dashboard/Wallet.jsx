import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet as WalletIcon,
  Plus,
  Send,
  ArrowDownLeft,
  ArrowUpRight,
  X,
  Loader2,
  Building2,
  CreditCard,
  Copy,
  Check,
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import {
  getWallet,
  getWalletTransactions,
  depositMoney,
  requestWithdrawal,
  getWithdrawalHistory,
  getPaymentDetails,
  addPaymentDetails,
  transferToWallet,
} from '../../api/trading';
import { createPaymentOrder } from '../../api/payment';
import { formatCurrency } from '../../utils/chartData';
import { useToast } from '../../context/ToastContext';
import Pagination from '../../components/Pagination';

const txIcon = {
  DEPOSIT: { icon: ArrowDownLeft, color: 'text-mint bg-mint-900/50' },
  WITHDRAWAL: { icon: ArrowUpRight, color: 'text-carmine bg-carmine/10' },
  WALLET_TRANSFER: { icon: Send, color: 'text-violet-400 bg-violet-600/15' },
  BUY_ASSET: { icon: ArrowUpRight, color: 'text-carmine bg-carmine/10' },
  SELL_ASSET: { icon: ArrowDownLeft, color: 'text-mint bg-mint-900/50' },
};

function Modal({ title, onClose, children }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm rounded-2xl border border-white/10 bg-void-800 shadow-panel overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <span className="font-display text-sm font-semibold text-ink">{title}</span>
            <button onClick={onClose} className="text-ink-faint hover:text-ink p-1">
              <X size={18} />
            </button>
          </div>
          <div className="p-5">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


function DepositModal({ onClose, onDone }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { push } = useToast();
  const submittingRef = useRef(false);

  const submit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;

    setError('');
    const amt = Math.round(parseFloat(amount));

    if (!amt || amt <= 0) {
      setError('Enter an amount greater than zero.');
      return;
    }

    submittingRef.current = true;
    setLoading(true);

    try {
      const res = await createPaymentOrder('RAZORPAY', amt);

      if (res?.payment_url) {
        window.location.href = res.payment_url;
        return;
      }

      throw new Error('No payment link returned.');
    } catch (err) {
      setError(err.friendlyMessage || err.response?.data?.message || err.message || 'Deposit failed.');
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <Modal title="Deposit funds" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">

        <div>
          <label className="text-xs text-ink-faint mb-1.5 block">
            Amount (INR)
          </label>

          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-void-900/60 px-4 py-3 focus-within:border-mint/50 transition-colors">
            <span className="text-ink-faint">₹</span>

            <input
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000"
              className="flex-1 bg-transparent outline-none text-sm text-ink font-mono-tab"
              autoFocus
            />
          </div>
        </div>

        <div className="flex gap-2">
          {[1000, 5000, 10000, 50000].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setAmount(String(v))}
              className="flex-1 py-2 rounded-lg border border-white/10 text-xs text-ink-muted hover:bg-white/[0.05] transition-colors"
            >
              ₹{v}
            </button>
          ))}
        </div>

        <p className="text-xs text-ink-faint leading-relaxed text-center">
          Secure payments powered by Razorpay
        </p>

        {error && (
          <div className="text-sm text-carmine bg-carmine/10 border border-carmine/20 rounded-lg px-3.5 py-2.5">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="group w-full rounded-2xl border border-white/10 bg-void-900/50 py-4 hover:border-[#528FF0]/30 hover:bg-void-900/80 transition-all disabled:opacity-60 disabled:pointer-events-none"
        >
          {loading ? (
            <Loader2
              size={18}
              className="animate-spin text-ink-muted mx-auto"
            />
          ) : (
            <div className="flex items-center justify-center gap-4">

              <span className="text-sm text-ink-faint tracking-wide">
                Pay with
              </span>

              <div className="bg-white rounded-xl px-5 py-3 shadow-md">
                <img
                  src="/razorpay-logo.png"
                  alt="Razorpay"
                  className="h-10 w-auto object-contain"
                />
              </div>

            </div>
          )}
        </button>
      </form>
    </Modal>
  );
}



function WithdrawModal({ onClose, onDone, hasPaymentDetails }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { push } = useToast();
  const submittingRef = useRef(false);

  const submit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    setError('');
    const amt = Math.round(parseFloat(amount));
    if (!amt || amt <= 0) {
      setError('Enter an amount greater than zero.');
      return;
    }
    submittingRef.current = true;
    setLoading(true);
    try {
      await requestWithdrawal(amt);
      push(`Withdrawal request for ${formatCurrency(amt)} submitted.`, 'success');
      onDone();
      onClose();
    } catch (err) {
      setError(err.friendlyMessage || err.response?.data?.message || 'Withdrawal failed.');
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <Modal title="Withdraw funds" onClose={onClose}>
      {!hasPaymentDetails && (
        <div className="mb-4 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3.5 py-2.5">
          Add your bank details below before requesting a withdrawal.
        </div>
      )}
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-xs text-ink-faint mb-1.5 block">Amount (USD)</label>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-void-900/60 px-4 py-3 focus-within:border-mint/50 transition-colors">
            <span className="text-ink-faint">$</span>
            <input
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100"
              className="flex-1 bg-transparent outline-none text-sm text-ink font-mono-tab"
              autoFocus
            />
          </div>
        </div>
        {error && (
          <div className="text-sm text-carmine bg-carmine/10 border border-carmine/20 rounded-lg px-3.5 py-2.5">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/[0.06] border border-white/12 text-ink font-display font-semibold text-sm py-3.5 hover:bg-white/[0.1] transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Request withdrawal'}
        </button>
      </form>
    </Modal>
  );
}

function BankDetailsModal({ onClose, onDone, existing }) {
  const [form, setForm] = useState({
    accountHolderName: existing?.accountHolderName || '',
    accountNumber: existing?.accountNumber || '',
    ifsc: existing?.ifsc || '',
    bankName: existing?.bankName || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const { push } = useToast();
  const submittingRef = useRef(false);

  const submit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    setErrors({});
    
    const validationErrors = {};
    if (!form.accountHolderName.trim()) validationErrors.accountHolderName = 'Account holder name is required';
    if (!form.accountNumber.trim()) validationErrors.accountNumber = 'Account number is required';
    else if (form.accountNumber.trim().length < 8) validationErrors.accountNumber = 'Account number must be at least 8 digits';
    if (!form.ifsc.trim()) validationErrors.ifsc = 'IFSC code is required';
    else if (form.ifsc.trim().length !== 11) validationErrors.ifsc = 'IFSC code must be exactly 11 characters';
    if (!form.bankName.trim()) validationErrors.bankName = 'Bank name is required';
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    submittingRef.current = true;
    setLoading(true);
    try {
      await addPaymentDetails(form);
      push('Bank details saved.', 'success');
      onDone();
      onClose();
    } catch (err) {
      if (err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
        setErrors(err.fieldErrors);
      } else {
        setError(err.friendlyMessage || err.response?.data?.message || 'Could not save bank details.');
      }
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <Modal title="Bank details" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <input
            placeholder="Account holder name"
            value={form.accountHolderName}
            onChange={(e) => { setForm({ ...form, accountHolderName: e.target.value }); setErrors({ ...errors, accountHolderName: null }); }}
            className={`w-full rounded-xl border bg-void-900/60 px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-faint ${errors.accountHolderName ? 'border-carmine/50 focus:border-carmine' : 'border-white/10 focus:border-mint/50'}`}
          />
          {errors.accountHolderName && <p className="mt-1.5 text-xs text-carmine">{errors.accountHolderName}</p>}
        </div>
        <div>
          <input
            placeholder="Account number"
            value={form.accountNumber}
            onChange={(e) => { setForm({ ...form, accountNumber: e.target.value }); setErrors({ ...errors, accountNumber: null }); }}
            className={`w-full rounded-xl border bg-void-900/60 px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-faint ${errors.accountNumber ? 'border-carmine/50 focus:border-carmine' : 'border-white/10 focus:border-mint/50'}`}
          />
          {errors.accountNumber && <p className="mt-1.5 text-xs text-carmine">{errors.accountNumber}</p>}
        </div>
        <div>
          <input
            placeholder="IFSC code"
            value={form.ifsc}
            onChange={(e) => { setForm({ ...form, ifsc: e.target.value }); setErrors({ ...errors, ifsc: null }); }}
            className={`w-full rounded-xl border bg-void-900/60 px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-faint ${errors.ifsc ? 'border-carmine/50 focus:border-carmine' : 'border-white/10 focus:border-mint/50'}`}
          />
          {errors.ifsc && <p className="mt-1.5 text-xs text-carmine">{errors.ifsc}</p>}
        </div>
        <div>
          <input
            placeholder="Bank name"
            value={form.bankName}
            onChange={(e) => { setForm({ ...form, bankName: e.target.value }); setErrors({ ...errors, bankName: null }); }}
            className={`w-full rounded-xl border bg-void-900/60 px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-faint ${errors.bankName ? 'border-carmine/50 focus:border-carmine' : 'border-white/10 focus:border-mint/50'}`}
          />
          {errors.bankName && <p className="mt-1.5 text-xs text-carmine">{errors.bankName}</p>}
        </div>
        {error && (
          <div className="text-sm text-carmine bg-carmine/10 border border-carmine/20 rounded-lg px-3.5 py-2.5">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading || !form.accountHolderName.trim() || form.accountNumber.trim().length < 8 || form.ifsc.trim().length !== 11 || !form.bankName.trim()}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-mint text-void font-display font-semibold text-sm py-3.5 shadow-mint hover:bg-mint-400 transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Save details'}
        </button>
      </form>
    </Modal>
  );
}

function TransferModal({ onClose, onDone, myWalletId }) {
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const { push } = useToast();
  const submittingRef = useRef(false);

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(String(myWalletId));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard API unavailable - silently ignore, the ID is still visible to copy manually
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    setError('');
    const amt = Math.round(parseFloat(amount));
    const targetId = parseInt(walletId, 10);
    if (!amt || amt <= 0) {
      setError('Enter an amount greater than zero.');
      return;
    }
    if (!targetId || targetId <= 0) {
      setError("Enter the recipient's wallet ID.");
      return;
    }
    if (targetId === myWalletId) {
      setError('You cannot transfer to your own wallet.');
      return;
    }
    submittingRef.current = true;
    setLoading(true);
    try {
      await transferToWallet(targetId, { amount: amt, purpose: purpose || 'Wallet transfer' });
      push(`${formatCurrency(amt)} sent to wallet #${targetId}.`, 'success');
      onDone();
      onClose();
    } catch (err) {
      setError(err.friendlyMessage || err.response?.data?.message || 'Transfer failed.');
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <Modal title="Transfer to another wallet" onClose={onClose}>
      <div className="mb-4 rounded-xl border border-white/10 bg-void-900/60 px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] text-ink-faint mb-0.5">Your wallet ID (share this to receive funds)</div>
          <div className="font-mono-tab text-sm text-ink truncate">#{myWalletId ?? '—'}</div>
        </div>
        <button
          type="button"
          onClick={copyId}
          className="shrink-0 w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-ink-muted hover:text-ink hover:bg-white/[0.05] transition-colors"
        >
          {copied ? <Check size={14} className="text-mint" /> : <Copy size={14} />}
        </button>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-xs text-ink-faint mb-1.5 block">Amount (USD)</label>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-void-900/60 px-4 py-3 focus-within:border-mint/50 transition-colors">
            <span className="text-ink-faint">$</span>
            <input
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100"
              className="flex-1 bg-transparent outline-none text-sm text-ink font-mono-tab"
              autoFocus
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-ink-faint mb-1.5 block">Recipient's wallet ID</label>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-void-900/60 px-4 py-3 focus-within:border-mint/50 transition-colors">
            <span className="text-ink-faint">#</span>
            <input
              type="number"
              min="1"
              step="1"
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              placeholder="e.g. 14"
              className="flex-1 bg-transparent outline-none text-sm text-ink font-mono-tab"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-ink-faint mb-1.5 block">Purpose (optional)</label>
          <input
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="gift for your friend…"
            className="w-full rounded-xl border border-white/10 bg-void-900/60 px-4 py-3 text-sm text-ink outline-none focus:border-mint/50 placeholder:text-ink-faint"
          />
        </div>

        {error && (
          <div className="text-sm text-carmine bg-carmine/10 border border-carmine/20 rounded-lg px-3.5 py-2.5">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-mint text-void font-display font-semibold text-sm py-3.5 shadow-mint hover:bg-mint-400 transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Send'}
        </button>
      </form>
    </Modal>
  );
}

export default function Wallet() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'deposit' | 'withdraw' | 'bank'
  const [activeTab, setActiveTab] = useState('ledger'); // 'ledger' | 'withdrawals'
  
  const [currentPageLedger, setCurrentPageLedger] = useState(1);
  const [currentPageWithdrawals, setCurrentPageWithdrawals] = useState(1);
  const itemsPerPage = 10;

  const loadAll = () => {
    setLoading(true);
    Promise.allSettled([
      getWallet(),
      getWalletTransactions(),
      getPaymentDetails(),
      getWithdrawalHistory()
    ]).then(([w, t, p, wd]) => {
      if (w.status === 'fulfilled') setWallet(w.value);
      if (t.status === 'fulfilled') setTransactions(Array.isArray(t.value) ? t.value : []);
      if (p.status === 'fulfilled') setPaymentDetails(p.value);
      if (wd.status === 'fulfilled') setWithdrawals(Array.isArray(wd.value) ? wd.value : []);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadAll();
  }, []);

  const totalPagesLedger = Math.ceil(transactions.length / itemsPerPage);
  const currentTransactions = transactions.slice((currentPageLedger - 1) * itemsPerPage, currentPageLedger * itemsPerPage);

  const totalPagesWithdrawals = Math.ceil(withdrawals.length / itemsPerPage);
  const currentWithdrawals = withdrawals.slice((currentPageWithdrawals - 1) * itemsPerPage, currentPageWithdrawals * itemsPerPage);

  return (
    <div className="pb-16">
      <PageHeader eyebrow="Funds" title="Wallet" description="Deposit, withdraw, and review your transaction ledger." />

      <div className="px-4 sm:px-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-void-800 to-void-900 p-7 sm:p-8"
        >
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-mint/10 blur-[80px] rounded-full" aria-hidden />
          <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <WalletIcon size={16} className="text-mint" />
                <span className="text-xs text-ink-faint uppercase tracking-wide font-mono-tab">Available balance</span>
              </div>
              {loading ? (
                <div className="h-10 w-48 rounded bg-white/5 animate-pulse" />
              ) : (
                <div className="font-display text-4xl sm:text-5xl font-semibold text-ink">
                  {formatCurrency(wallet?.balance ?? 0)}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setModal('deposit')}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-mint text-void font-display font-semibold text-sm shadow-mint hover:bg-mint-400 transition-colors"
              >
                <Plus size={16} /> Deposit
              </button>
              <button
                onClick={() => setModal('withdraw')}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/12 text-ink font-display font-semibold text-sm hover:bg-white/[0.05] transition-colors"
              >
                <Send size={16} /> Withdraw
              </button>
              <button
                onClick={() => setModal('transfer')}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/12 text-ink font-display font-semibold text-sm hover:bg-white/[0.05] transition-colors"
              >
                <ArrowUpRight size={16} /> Transfer
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-2xl border border-white/[0.07] bg-void-800/60 p-5 sm:p-6 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-600/15 text-violet-400 flex items-center justify-center shrink-0">
              <Building2 size={18} />
            </div>
            <div>
              <div className="text-sm text-ink font-medium">Bank details</div>
              <div className="text-xs text-ink-faint">
                {paymentDetails ? `${paymentDetails.bankName} · •••• ${String(paymentDetails.accountNumber).slice(-4)}` : 'Not added yet'}
              </div>
            </div>
          </div>
          <button
            onClick={() => setModal('bank')}
            className="px-4 py-2 rounded-lg border border-white/12 text-xs text-ink font-display font-semibold hover:bg-white/[0.05] transition-colors shrink-0"
          >
            {paymentDetails ? 'Update' : 'Add details'}
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className="rounded-2xl border border-white/[0.07] bg-void-800/60 overflow-hidden"
        >
          {/* Tab selectors */}
          <div className="flex border-b border-white/[0.06] bg-void-900/40">
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-6 py-4 text-xs font-display font-semibold border-b-2 transition-colors ${
                activeTab === 'ledger'
                  ? 'border-mint text-ink'
                  : 'border-transparent text-ink-faint hover:text-ink-muted'
              }`}
            >
              Ledger history
            </button>
            <button
              onClick={() => setActiveTab('withdrawals')}
              className={`px-6 py-4 text-xs font-display font-semibold border-b-2 transition-colors ${
                activeTab === 'withdrawals'
                  ? 'border-mint text-ink'
                  : 'border-transparent text-ink-faint hover:text-ink-muted'
              }`}
            >
              Withdrawal requests
            </button>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : activeTab === 'ledger' ? (
            transactions.length === 0 ? (
              <div className="p-12 text-center text-sm text-ink-muted">No transactions in ledger.</div>
            ) : (
              <>
                <div className="divide-y divide-white/[0.05]">
                  {currentTransactions.map((t) => {
                    const meta = txIcon[t.type] || txIcon.DEPOSIT;
                    const Icon = meta.icon;
                    const positive = (t.amount || 0) >= 0;
                    return (
                      <div key={t.id} className="flex items-center justify-between gap-4 px-5 sm:px-6 py-3.5 hover:bg-white/[0.01] transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${meta.color}`}>
                            <Icon size={15} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm text-ink truncate">{t.purpose || t.type?.replace(/_/g, ' ')}</div>
                            <div className="text-xs text-ink-faint">{t.date ? new Date(t.date).toLocaleDateString() : ''}</div>
                          </div>
                        </div>
                        <span className={`font-mono-tab text-sm font-medium shrink-0 ${positive ? 'text-mint' : 'text-carmine'}`}>
                          {positive ? '+' : ''}
                          {formatCurrency(t.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <Pagination
                  currentPage={currentPageLedger}
                  totalPages={totalPagesLedger}
                  onPageChange={setCurrentPageLedger}
                />
              </>
            )
          ) : withdrawals.length === 0 ? (
            <div className="p-12 text-center text-sm text-ink-muted">No withdrawal requests placed yet.</div>
          ) : (
            <>
              <div className="divide-y divide-white/[0.05]">
                {currentWithdrawals.map((w) => {
                  const statusColors = {
                    PENDING: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
                    SUCCESS: 'text-mint bg-mint-900/40 border-mint/20',
                    DECLINE: 'text-carmine bg-carmine/10 border-carmine/20',
                  };
                  return (
                    <div key={w.id} className="flex items-center justify-between gap-4 px-5 sm:px-6 py-3.5 hover:bg-white/[0.01] transition-colors">
                      <div className="min-w-0">
                        <div className="text-sm text-ink font-medium">Bank Withdrawal Request</div>
                        <div className="text-xs text-ink-faint mt-0.5">
                          {w.date ? new Date(w.date).toLocaleString() : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-3.5">
                        <span className="font-mono-tab text-sm font-semibold text-ink">
                          {formatCurrency(w.amount)}
                        </span>
                        <span className={`text-[10px] font-mono-tab px-2 py-0.5 rounded-full border ${statusColors[w.status] || 'text-ink-muted border-white/10'}`}>
                          {w.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Pagination
                currentPage={currentPageWithdrawals}
                totalPages={totalPagesWithdrawals}
                onPageChange={setCurrentPageWithdrawals}
              />
            </>
          )}
        </motion.div>
      </div>

      {modal === 'deposit' && <DepositModal onClose={() => setModal(null)} onDone={loadAll} />}
      {modal === 'withdraw' && (
        <WithdrawModal onClose={() => setModal(null)} onDone={loadAll} hasPaymentDetails={!!paymentDetails} />
      )}
      {modal === 'transfer' && (
        <TransferModal onClose={() => setModal(null)} onDone={loadAll} myWalletId={wallet?.id} />
      )}
      {modal === 'bank' && (
        <BankDetailsModal onClose={() => setModal(null)} onDone={loadAll} existing={paymentDetails} />
      )}
    </div>
  );
}
