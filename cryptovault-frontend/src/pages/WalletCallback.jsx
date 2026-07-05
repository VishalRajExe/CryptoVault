import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { completeDeposit } from '../api/payment';
import { formatCurrency } from '../utils/chartData';

// Razorpay's payment link callback_url is hardcoded server-side
// (PaymentServiceImpl.createRazorpayPaymentLink) to exactly:
//   http://localhost:5173/wallet/{orderId}?razorpay_payment_id=...&...
// So this route MUST live at the top-level path /wallet/:orderId (not nested
// under /app) to match. If you redeploy the frontend somewhere other than
// localhost:5173, update that hardcoded URL in PaymentServiceImpl to match.
export default function WalletCallback() {
  const { orderId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'error'
  const [error, setError] = useState('');
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    const paymentId = params.get('razorpay_payment_id');
    if (!orderId || !paymentId) {
      setStatus('error');
      setError('Missing payment confirmation details from Razorpay.');
      return;
    }
    completeDeposit(orderId, paymentId)
      .then((w) => {
        setWallet(w);
        setStatus('success');
      })
      .catch((e) => {
        setStatus('error');
        setError(e.friendlyMessage || 'Could not confirm this deposit.');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-void-800/80 p-8 text-center">
        {status === 'processing' && (
          <>
            <Loader2 size={32} className="mx-auto text-mint animate-spin mb-4" />
            <h2 className="font-display text-lg font-semibold text-ink mb-1.5">Confirming your payment…</h2>
            <p className="text-sm text-ink-muted">This only takes a moment.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 size={32} className="mx-auto text-mint mb-4" />
            <h2 className="font-display text-lg font-semibold text-ink mb-1.5">Deposit confirmed</h2>
            <p className="text-sm text-ink-muted mb-6">
              Your wallet balance is now {formatCurrency(wallet?.balance ?? 0)}.
            </p>
            <button
              onClick={() => navigate('/app/wallet')}
              className="px-5 py-2.5 rounded-xl bg-mint text-void font-display font-semibold text-sm shadow-mint hover:bg-mint-400 transition-colors"
            >
              Back to wallet
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle size={32} className="mx-auto text-carmine mb-4" />
            <h2 className="font-display text-lg font-semibold text-ink mb-1.5">Couldn't confirm this deposit</h2>
            <p className="text-sm text-ink-muted mb-6">{error}</p>
            <Link
              to="/app/wallet"
              className="px-5 py-2.5 rounded-xl border border-white/12 text-ink font-display font-semibold text-sm hover:bg-white/[0.05] transition-colors inline-block"
            >
              Back to wallet
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
