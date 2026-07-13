import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import OrderModal from '../../components/OrderModal';
import Sparkline from '../../components/Sparkline';
import PageTransition from '../../components/PageTransition';
import EmptyState from '../../components/EmptyState';
import { getUserWatchlist } from '../../api/trading';
import { formatCurrency, formatPercent, generateCandles } from '../../utils/chartData';
import { normalizeCoin } from '../../utils/normalizeCoin';

const palette = ['#D7FF4F', '#7C5CFF', '#FF3B69', '#4DFFC1', '#9A82FF', '#FF6B8C'];

function WatchlistCard({ coin: c, index, onTrade }) {
  const up = c.priceChangePercentage24h >= 0;
  const color = palette[index % palette.length];
  
  const [spark, setSpark] = useState(() => 
    generateCandles(24, c.currentPrice || 100, 0.02).map((x) => x.close)
  );

  useEffect(() => {
    let tickCount = 0;
    const interval = setInterval(() => {
      setSpark(prev => {
        tickCount++;
        const last = prev[prev.length - 1];
        const newVal = last * (1 + (Math.random() - 0.5) * 0.002);
        if (tickCount % 4 === 0) {
          return [...prev.slice(1), newVal];
        }
        return [...prev.slice(0, -1), newVal];
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
      className="rounded-2xl border border-white/[0.07] bg-void-800/60 p-5 hover:border-white/[0.15] transition-all duration-300 relative group overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.01] rounded-full blur-2xl group-hover:bg-white/[0.02]" />
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-2.5">
          {c.image && <img src={c.image} alt="" className="w-8 h-8 rounded-full" />}
          <div>
            <div className="font-display text-sm font-semibold text-ink">{c.symbol?.toUpperCase()}</div>
            <div className="text-xs text-ink-faint">{c.name}</div>
          </div>
        </div>
        <Star size={15} className="text-amber-400" fill="currentColor" />
      </div>
      <div className="h-10 -mx-1 mb-2 relative z-10">
        <Sparkline data={spark} width={240} height={40} color={color} />
      </div>
      <div className="flex items-center justify-between relative z-10">
        <span className="font-mono-tab text-base text-ink font-semibold">
          {formatCurrency(c.currentPrice)}
        </span>
        {c.priceChangePercentage24h != null && (
          <span className={`font-mono-tab text-xs flex items-center gap-0.5 ${up ? 'text-mint' : 'text-carmine'}`}>
            {up ? '▲' : '▼'} {Math.abs(c.priceChangePercentage24h).toFixed(2)}%
          </span>
        )}
      </div>
      <button
        onClick={onTrade}
        className="w-full mt-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-ink text-xs font-display font-semibold hover:bg-white/[0.08] transition-colors relative z-10"
      >
        Trade
      </button>
    </motion.div>
  );
}

export default function Watchlist() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tradeCoin, setTradeCoin] = useState(null);

  const loadData = async (isPoll = false) => {
    try {
      const wl = await getUserWatchlist();
      setCoins((wl?.coins || []).map(normalizeCoin));
      if (!isPoll) setLoading(false);
    } catch (e) {
      setError(e.friendlyMessage || 'Could not load your watchlist.');
      if (!isPoll) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Poll every 30s for live price updates in watchlist
    const interval = setInterval(() => loadData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <PageTransition className="pb-16">
      <PageHeader eyebrow="Pinned" title="Watchlist" description="The digital assets you are tracking most closely." />

      <div className="px-4 sm:px-8">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-white/[0.07] bg-void-800/60 p-10 text-center text-sm text-ink-muted">
            {error}
          </div>
        ) : coins.length === 0 ? (
          <EmptyState
            icon={Star}
            title="Watchlist is empty"
            description="Star any coin from the Markets board to keep tabs on its performance here."
            actionLabel="Browse markets"
            actionTo="/app/markets"
          />
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {coins.map((c, idx) => (
              <WatchlistCard 
                key={c.id} 
                coin={c} 
                index={idx}
                onTrade={() => setTradeCoin(c)}
              />
            ))}
          </motion.div>
        )}
      </div>

      <OrderModal coin={tradeCoin} onClose={() => setTradeCoin(null)} onSuccess={loadData} />
    </PageTransition>
  );
}
