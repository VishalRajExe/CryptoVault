import { motion } from 'framer-motion';
import CandleChart from './CandleChart';
import Sparkline from './Sparkline';
import { generateCandles } from '../utils/chartData';
import { useMemo } from 'react';

const panes = [
  { sym: 'BTC/USD', exch: 'Coinbase · 15m', price: '66,870.95', change: '+2.41%', up: true, color: '#D7FF4F' },
  { sym: 'ETH/USD', exch: 'Kraken · 1h', price: '3,482.11', change: '+1.08%', up: true, color: '#7C5CFF' },
  { sym: 'SOL/USD', exch: 'Binance · 5m', price: '168.42', change: '-0.86%', up: false, color: '#FF3B69' },
];

export default function HeroDashboard() {
  const sparkData = useMemo(
    () => panes.map(() => generateCandles(30, 100, 0.02).map((c) => c.close)),
    []
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 32, rotateX: 6 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className="relative w-full max-w-xl mx-auto"
      style={{ perspective: 1200 }}
    >
      {/* glow behind panel */}
      <div className="absolute -inset-10 bg-mint/10 blur-[80px] rounded-full" aria-hidden />

      <div className="relative rounded-2xl border border-white/10 bg-void-800/90 backdrop-blur-xl shadow-panel overflow-hidden">
        {/* window chrome */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-void-900/60">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-carmine/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-mint/70" />
          </div>
          <span className="font-mono-tab text-[11px] text-ink-faint">CryptoVault Terminal</span>
          <span className="flex items-center gap-1.5 text-[11px] text-mint font-mono-tab">
            <span className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse-glow" />
            LIVE
          </span>
        </div>

        {/* main candle pane */}
        <div className="p-4 pb-2 border-b border-white/[0.06]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-baseline gap-2">
              <span className="font-display font-semibold text-ink text-sm">BTC/USD</span>
              <span className="text-ink-faint text-[11px]">Bitcoin · 30m</span>
            </div>
            <div className="text-right">
              <div className="font-mono-tab text-mint text-sm font-medium">$66,870.95</div>
            </div>
          </div>
          <div className="h-28">
            <CandleChart width={520} height={110} count={40} volatility={0.016} />
          </div>
        </div>

        {/* mini panes grid */}
        <div className="grid grid-cols-2 divide-x divide-white/[0.06]">
          {panes.slice(1).map((p, idx) => (
            <div key={p.sym} className="p-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-display text-xs font-semibold text-ink">{p.sym}</span>
                <span
                  className={`font-mono-tab text-[10px] px-1.5 py-0.5 rounded ${
                    p.up ? 'text-mint bg-mint-900/40' : 'text-carmine bg-carmine/10'
                  }`}
                >
                  {p.change}
                </span>
              </div>
              <div className="h-10">
                <Sparkline data={sparkData[idx + 1]} width={220} height={40} color={p.color} />
              </div>
              <div className="font-mono-tab text-xs text-ink-muted mt-1">${p.price}</div>
            </div>
          ))}
        </div>

        {/* order ticket strip */}
        <div className="flex items-center gap-2 p-3 border-t border-white/[0.06] bg-void-900/40">
          <button className="flex-1 text-center text-xs font-display font-semibold text-void bg-mint rounded-lg py-2 shadow-mint">
            Buy
          </button>
          <button className="flex-1 text-center text-xs font-display font-semibold text-ink bg-white/[0.06] border border-white/10 rounded-lg py-2">
            Sell
          </button>
        </div>
      </div>

      {/* floating badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="absolute -right-6 -bottom-6 hidden sm:flex items-center gap-2 rounded-xl border border-mint/20 bg-void-800/95 backdrop-blur-xl px-4 py-3 shadow-mint animate-float-slow"
      >
        <div className="w-8 h-8 rounded-full bg-mint/15 flex items-center justify-center text-mint font-display font-bold text-xs">
          ↗
        </div>
        <div>
          <div className="text-[10px] text-ink-faint leading-none mb-1">Portfolio 24h</div>
          <div className="font-mono-tab text-sm text-mint font-semibold leading-none">+12.4%</div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="absolute -left-6 -top-6 hidden sm:flex items-center gap-2 rounded-xl border border-violet/20 bg-void-800/95 backdrop-blur-xl px-3.5 py-2.5 shadow-violet animate-float-slower"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-violet animate-pulse-glow" />
        <span className="text-[11px] font-mono-tab text-ink-muted">Order filled · 0.042 BTC</span>
      </motion.div>
    </motion.div>
  );
}
