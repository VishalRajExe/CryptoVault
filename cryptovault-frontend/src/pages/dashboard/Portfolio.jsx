import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import Sparkline from '../../components/Sparkline';
import PageTransition from '../../components/PageTransition';
import { SkeletonPage } from '../../components/SkeletonLoaders';
import { AllocationChart, PerformanceCard } from '../../components/PortfolioChart';
import { getUserAssets } from '../../api/trading';
import { formatCurrency, formatPercent, generateCandles } from '../../utils/chartData';
import { normalizeCoin } from '../../utils/normalizeCoin';
import { useReplay } from '../../context/ReplayContext';

const palette = ['#D7FF4F', '#7C5CFF', '#FF3B69', '#4DFFC1', '#9A82FF', '#FF6B8C'];

export default function Portfolio() {
  const { isReplayMode, replayPortfolio, replayWallet, activeSession } = useReplay();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const sparklinesRef = useRef({});

  const loadData = async (isPoll = false) => {
    try {
      const data = await getUserAssets();
      const loadedAssets = Array.isArray(data) ? data.map((a) => ({ ...a, coin: normalizeCoin(a.coin) })) : [];
      
      setAssets(prev => {
        return loadedAssets.map(newAsset => {
          const oldAsset = prev.find(p => p.id === newAsset.id);
          // Preserve locally evolved currentPrice so we don't jump back to stale DB prices
          if (oldAsset && isPoll) {
            newAsset.coin.currentPrice = oldAsset.coin.currentPrice;
          }
          
          if (!sparklinesRef.current[newAsset.id]) {
            sparklinesRef.current[newAsset.id] = generateCandles(24, newAsset.coin?.currentPrice || 100, 0.02).map(c => c.close);
          }
          return newAsset;
        });
      });

      if (!isPoll) setLoading(false);
    } catch (e) {
      setError(e.friendlyMessage || 'Could not load your portfolio.');
      if (!isPoll) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Poll every 30s just to catch any new assets added/removed
    const interval = setInterval(() => loadData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  // Real-time tick effect for portfolio values and graphs
  useEffect(() => {
    if (assets.length === 0) return;
    
    let tickCount = 0;
    const interval = setInterval(() => {
      tickCount++;
      setAssets(prev => prev.map(a => {
        const price = a.coin?.currentPrice || 100;
        const newVal = price * (1 + (Math.random() - 0.5) * 0.002); // Jitter price slightly

        if (tickCount % 2 === 0 && sparklinesRef.current[a.id]) {
          const spark = sparklinesRef.current[a.id];
          sparklinesRef.current[a.id] = [...spark.slice(1), newVal];
        }
        
        return {
          ...a,
          coin: {
            ...a.coin,
            currentPrice: newVal
          }
        };
      }));
    }, 1500);

    return () => clearInterval(interval);
  }, [assets.length]);

  const displayAssets = isReplayMode ? replayPortfolio : assets;
  const totalValue = displayAssets.reduce((s, a) => s + (a.quantity || 0) * (a.coin?.currentPrice || 0), 0);
  const totalCost = displayAssets.reduce((s, a) => s + (a.quantity || 0) * (a.buyPrice || 0), 0);
  const totalPnl = totalValue - totalCost;
  const pnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  if (loading && !isReplayMode) {
    return <SkeletonPage />;
  }

  return (
    <PageTransition className="pb-16">
      <PageHeader
        eyebrow="Holdings"
        title="Portfolio"
        description="Every position you currently hold, valued in real time."
      />

      <div className="px-4 sm:px-8 space-y-6">
        {isReplayMode && (
          <div className="bg-mint/10 border border-mint/30 rounded-xl p-4 text-center">
            <div className="text-mint font-display font-semibold text-sm">Viewing Virtual Replay Portfolio</div>
            <div className="text-mint/70 text-xs">Session: {activeSession?.name}</div>
          </div>
        )}
        {/* Stat cards */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid sm:grid-cols-3 gap-4"
        >
          <div className="rounded-2xl border border-white/[0.07] bg-void-800/60 p-6 backdrop-blur-xl relative overflow-hidden">
            <div className="text-[10px] text-ink-faint uppercase tracking-wider font-mono-tab mb-2">Total value</div>
            <div className="font-display text-2xl font-bold tracking-tight text-ink">{formatCurrency(totalValue)}</div>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-void-800/60 p-6 backdrop-blur-xl relative overflow-hidden">
            <div className="text-[10px] text-ink-faint uppercase tracking-wider font-mono-tab mb-2">Unrealized P&amp;L</div>
            <div className={`font-display text-2xl font-bold tracking-tight flex items-center gap-1.5 ${totalPnl >= 0 ? 'text-mint' : 'text-carmine'}`}>
              {totalPnl >= 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
              {formatCurrency(Math.abs(totalPnl))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-void-800/60 p-6 backdrop-blur-xl relative overflow-hidden">
            <div className="text-[10px] text-ink-faint uppercase tracking-wider font-mono-tab mb-2">Total return</div>
            <div className={`font-display text-2xl font-bold tracking-tight ${pnlPct >= 0 ? 'text-mint' : 'text-carmine'}`}>
              {formatPercent(pnlPct)}
            </div>
          </div>
        </motion.div>

        {/* Charts Grid */}
        {displayAssets.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            <AllocationChart assets={displayAssets} />
            <PerformanceCard assets={displayAssets} />
          </div>
        )}

        {/* Asset Table */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/[0.07] bg-void-800/60 overflow-hidden backdrop-blur-xl"
        >
          {error && !isReplayMode ? (
            <div className="p-10 text-center text-sm text-ink-muted">{error}</div>
          ) : displayAssets.length === 0 ? (
            <div className="p-12 text-center">
              <Briefcase size={32} className="mx-auto text-ink-faint mb-3" />
              <p className="text-sm text-ink-muted mb-1 font-semibold">Your portfolio is empty</p>
              <p className="text-xs text-ink-faint">Buy your first asset from {isReplayMode ? 'Virtual' : 'live'} Markets to see it tracked here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink-faint text-[10px] uppercase tracking-wider font-mono-tab border-b border-white/[0.04]">
                    <th className="px-5 sm:px-6 py-3.5 font-normal">Asset</th>
                    <th className="px-4 py-3.5 font-normal">Holdings</th>
                    <th className="px-4 py-3.5 font-normal">Avg. cost</th>
                    <th className="px-4 py-3.5 font-normal hidden sm:table-cell">Trend (24h)</th>
                    <th className="px-5 sm:px-6 py-3.5 font-normal text-right">Value &amp; P&amp;L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {displayAssets.map((a, idx) => {
                    const value = (a.quantity || 0) * (a.coin?.currentPrice || 0);
                    const pnl = value - (a.quantity || 0) * (a.buyPrice || 0);
                    const up = pnl >= 0;
                    const spark = sparklinesRef.current[a.id] || [];
                    return (
                      <tr key={a.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="px-5 sm:px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            {a.coin?.image && <img src={a.coin.image} alt="" className="w-7 h-7 rounded-full" />}
                            <div>
                              <div className="text-ink font-semibold">{a.coin?.symbol?.toUpperCase()}</div>
                              <div className="text-xs text-ink-faint">{a.coin?.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-mono-tab text-ink-muted">{a.quantity}</td>
                        <td className="px-4 py-4 font-mono-tab text-ink-muted">{formatCurrency(a.buyPrice)}</td>
                        <td className="px-4 py-4 hidden sm:table-cell">
                          <Sparkline data={spark} width={100} height={32} color={palette[idx % palette.length]} />
                        </td>
                        <td className="px-5 sm:px-6 py-4 text-right">
                          <div className="font-mono-tab text-ink font-semibold">{formatCurrency(value)}</div>
                          <div className={`text-xs font-mono-tab flex items-center justify-end gap-0.5 mt-0.5 ${up ? 'text-mint' : 'text-carmine'}`}>
                            {up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                            {formatCurrency(Math.abs(pnl))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </PageTransition>
  );
}
