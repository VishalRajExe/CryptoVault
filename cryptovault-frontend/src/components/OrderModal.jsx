import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { placeOrder } from '../api/trading';
import { formatCurrency } from '../utils/chartData';
import { useToast } from '../context/ToastContext';

export default function OrderModal({ coin, onClose, onSuccess }) {
  const [side, setSide] = useState('BUY');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { push } = useToast();
  // Belt-and-suspenders guard against double submits (rapid double-click,
  // double Enter keypress, etc) on top of the `loading`/`disabled` state below.
  const submittingRef = useRef(false);

  if (!coin) return null;

  const qty = parseFloat(quantity) || 0;
  const total = qty * (coin.currentPrice || coin.current_price || 0);
  const price = coin.currentPrice || coin.current_price || 0;

  const submit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    setError('');
    if (qty <= 0) {
      setError('Enter a quantity greater than zero.');
      return;
    }
    submittingRef.current = true;
    setLoading(true);
    try {
      await placeOrder({ coinId: coin.id, quantity: qty, orderType: side });
      push(`${side === 'BUY' ? 'Bought' : 'Sold'} ${qty} ${coin.symbol?.toUpperCase()}.`, 'success');
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.friendlyMessage || 'Order could not be placed.');
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

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
            <div className="flex items-center gap-2.5">
              {coin.image && <img src={coin.image} alt="" className="w-7 h-7 rounded-full" />}
              <div>
                <div className="font-display text-sm font-semibold text-ink">
                  {coin.symbol?.toUpperCase()}
                </div>
                <div className="text-xs text-ink-faint">{coin.name}</div>
              </div>
            </div>
            <button onClick={onClose} className="text-ink-faint hover:text-ink p-1">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={submit} className="p-5 space-y-5">
            <div className="grid grid-cols-2 rounded-xl border border-white/10 bg-void-900/60 p-1">
              <button
                type="button"
                onClick={() => setSide('BUY')}
                className={`py-2.5 rounded-lg text-sm font-display font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                  side === 'BUY' ? 'bg-mint text-void shadow-mint' : 'text-ink-muted'
                }`}
              >
                <ArrowUpRight size={14} /> Buy
              </button>
              <button
                type="button"
                onClick={() => setSide('SELL')}
                className={`py-2.5 rounded-lg text-sm font-display font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                  side === 'SELL' ? 'bg-carmine text-void shadow-[0_0_0_1px_rgba(255,59,105,0.2),0_8px_30px_-8px_rgba(255,59,105,0.5)]' : 'text-ink-muted'
                }`}
              >
                <ArrowDownRight size={14} /> Sell
              </button>
            </div>

            <div>
              <label className="text-xs text-ink-faint mb-1.5 block">Quantity</label>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-void-900/60 px-4 py-3 focus-within:border-mint/50 transition-colors">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 bg-transparent outline-none text-sm text-ink font-mono-tab placeholder:text-ink-faint"
                />
                <span className="text-xs text-ink-faint font-mono-tab">{coin.symbol?.toUpperCase()}</span>
              </div>
            </div>

            <div className="rounded-xl bg-void-900/60 border border-white/[0.06] px-4 py-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-ink-faint">Market price</span>
                <span className="font-mono-tab text-ink-muted">{formatCurrency(price)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-faint">Estimated total</span>
                <span className="font-mono-tab text-ink font-semibold">{formatCurrency(total)}</span>
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
              className={`w-full flex items-center justify-center gap-2 rounded-xl font-display font-semibold text-sm py-3.5 transition-colors disabled:opacity-60 ${
                side === 'BUY'
                  ? 'bg-mint text-void shadow-mint hover:bg-mint-400'
                  : 'bg-carmine text-void hover:bg-carmine-400'
              }`}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : `${side === 'BUY' ? 'Buy' : 'Sell'} ${coin.symbol?.toUpperCase()}`}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
