import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Wallet as WalletIcon,
  TrendingUp,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Send,
  ArrowRight,
  Sparkles,
  PieChart as PieChartIcon,
  Target, Activity
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useReplay } from '../../context/ReplayContext';
import PageHeader from '../../components/PageHeader';
import InteractiveChart from '../../components/InteractiveChart';
import PageTransition from '../../components/PageTransition';
import { SkeletonPage } from '../../components/SkeletonLoaders';
import { useAuth } from '../../context/AuthContext';
import { getWallet, getUserAssets } from '../../api/trading';
import { getTrendingCoins, getCoinDetails, getMarketChart } from '../../api/coins';
import { formatCurrency } from '../../utils/chartData';
import { normalizeCoin, parseMarketChart } from '../../utils/normalizeCoin';

const POPULAR_COINS = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'btc' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'eth' },
  { id: 'solana', name: 'Solana', symbol: 'sol' },
  { id: 'ripple', name: 'Ripple', symbol: 'xrp' },
  { id: 'cardano', name: 'Cardano', symbol: 'ada' },
  { id: 'dogecoin', name: 'Dogecoin', symbol: 'doge' }
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

const STAT_ACCENTS = {
  mint: 'bg-mint text-void border-mint shadow-[0_0_12px_-3px_rgba(215,255,79,0.35)]',
  neutral: 'bg-white/[0.06] text-ink border-white/10',
};

function StatCard({ icon: Icon, label, value, sub, accent = 'mint', loading }) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-white/[0.07] bg-void-800/60 p-5 sm:p-6 backdrop-blur-xl relative overflow-hidden group hover:border-white/[0.12] transition-colors"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.01] rounded-full blur-2xl group-hover:bg-white/[0.02] transition-all" />
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-105 ${STAT_ACCENTS[accent] || STAT_ACCENTS.mint}`}
        >
          <Icon size={16} />
        </div>
      </div>
      <div className="text-[10px] text-ink-faint uppercase tracking-wider font-mono-tab mb-1">{label}</div>
      {loading ? (
        <div className="h-8 w-28 rounded bg-white/5 animate-pulse" />
      ) : (
        <div className="font-display text-2xl font-bold tracking-tight text-ink">{value}</div>
      )}
      {sub && <div className="text-xs text-ink-muted mt-1">{sub}</div>}
    </motion.div>
  );
}

export default function Overview() {
  const { user } = useAuth();
  const { isReplayMode, activeSession, replayPerformance, replayWallet, replayPortfolio } = useReplay();
  const [wallet, setWallet] = useState(null);
  const [assets, setAssets] = useState([]);
  const [trending, setTrending] = useState([]);
  const [selectedCoinId, setSelectedCoinId] = useState('bitcoin');
  const [selectedCoinDetails, setSelectedCoinDetails] = useState(null);
  const [selectedCoinChart, setSelectedCoinChart] = useState([]);
  const [chartDays, setChartDays] = useState(7);

  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingChart, setLoadingChart] = useState(true);
  const [errors, setErrors] = useState({});

  const coinOptions = useMemo(() => {
    const map = new Map();
    POPULAR_COINS.forEach(c => map.set(c.id, c));
    assets.forEach(a => {
      if (a.coin) {
        map.set(a.coin.id, { id: a.coin.id, name: a.coin.name, symbol: a.coin.symbol });
      }
    });
    trending.forEach(t => {
      const item = t.item || t;
      if (item.id) {
        map.set(item.id, { id: item.id, name: item.name || item.symbol, symbol: item.symbol });
      }
    });
    return Array.from(map.values());
  }, [assets, trending]);

  const fetchData = async (isPoll = false) => {
    try {
      const [walletData, assetsData, trendingData] = await Promise.all([
        getWallet(),
        getUserAssets(),
        getTrendingCoins(),
      ]);

      setWallet(walletData);
      setAssets(
        Array.isArray(assetsData)
          ? assetsData.map((a) => ({ ...a, coin: normalizeCoin(a.coin) }))
          : []
      );

      const list = Array.isArray(trendingData) ? trendingData : trendingData?.coins;
      setTrending(Array.isArray(list) ? list.slice(0, 5) : []);

      if (!isPoll) setLoadingPage(false);
    } catch (e) {
      console.error('Error fetching overview data:', e);
      setErrors((p) => ({ ...p, main: e.friendlyMessage }));
      if (!isPoll) setLoadingPage(false);
    }
  };

  const fetchCoinDetails = async (coinId) => {
    try {
      const details = await getCoinDetails(coinId);
      setSelectedCoinDetails(details);
    } catch (e) {
      console.error('Error fetching coin details:', e);
    }
  };

  const fetchCoinChart = async (coinId, days) => {
    setLoadingChart(true);
    try {
      const chartData = await getMarketChart(coinId, days);
      setSelectedCoinChart(parseMarketChart(chartData));
    } catch (e) {
      console.error('Error fetching coin chart:', e);
    } finally {
      setLoadingChart(false);
    }
  };

  // Initial load & Polling
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  // Real-time tick effect for portfolio values
  useEffect(() => {
    const interval = setInterval(() => {
      if (assets.length > 0) {
        setAssets(prev => prev.map(a => {
          const price = a.coin?.currentPrice || 100;
          const newVal = price * (1 + (Math.random() - 0.5) * 0.002); // Jitter price slightly
          return {
            ...a,
            coin: {
              ...a.coin,
              currentPrice: newVal
            }
          };
        }));
      }

      setSelectedCoinDetails(prev => {
        if (!prev || !prev.market_data?.current_price?.usd) return prev;
        const val = prev.market_data.current_price.usd;
        const newVal = val * (1 + (Math.random() - 0.5) * 0.002);
        return {
          ...prev,
          market_data: {
            ...prev.market_data,
            current_price: {
              ...prev.market_data.current_price,
              usd: newVal
            }
          }
        };
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [assets.length]);

  // Fetch selected coin details
  useEffect(() => {
    fetchCoinDetails(selectedCoinId);
  }, [selectedCoinId]);

  // Fetch selected coin chart
  useEffect(() => {
    fetchCoinChart(selectedCoinId, chartDays);
  }, [selectedCoinId, chartDays]);

  const portfolioValue = isReplayMode 
    ? replayPortfolio.reduce((sum, a) => sum + (a.quantity || 0) * (a.coin?.currentPrice || 0), 0)
    : assets.reduce((sum, a) => sum + (a.quantity || 0) * (a.coin?.currentPrice || 0), 0);
    
  const currentWalletBalance = isReplayMode ? (replayWallet?.balance ?? 0) : (wallet?.balance ?? 0);
  const totalValue = currentWalletBalance + portfolioValue;
  const firstName = (user?.fullName || '').split(' ')[0];

  // Dynamic selected coin parameters
  const coinPrice = selectedCoinDetails?.market_data?.current_price?.usd ?? 0;
  const coinChange = selectedCoinDetails?.market_data?.price_change_percentage_24h ?? 0;
  const isUp = coinChange >= 0;
  const coinSymbol = selectedCoinDetails?.symbol?.toUpperCase() ?? 'BTC';
  const coinName = selectedCoinDetails?.name ?? 'Bitcoin';
  const coinImage = selectedCoinDetails?.image?.small ?? '';

  if (loadingPage) {
    return <SkeletonPage />;
  }

  return (
    <PageTransition className="pb-16">
      <PageHeader
        eyebrow="Desk Terminal"
        title={`Welcome back${firstName ? `, ${firstName}` : ''}`}
        description="Here is where your trading desk stands right now."
        action={
          <div className="flex items-center gap-2 text-xs font-mono-tab text-ink-faint py-1.5 px-3 rounded-lg border border-white/[0.05] bg-void-900/40">
            <Sparkles size={12} className="text-mint animate-pulse" />
            <span>PORTFOLIO VALUE: {formatCurrency(totalValue)}</span>
          </div>
        }
      />

      <div className="px-4 sm:px-8 space-y-6">
        {/* Stat cards */}
        {isReplayMode && (
          <div className="bg-mint/10 border border-mint/30 rounded-xl p-4 text-center">
            <div className="text-mint font-display font-semibold text-sm">Virtual Trading Analytics</div>
            <div className="text-mint/70 text-xs">Session: {activeSession?.name}</div>
          </div>
        )}
        <motion.div initial="hidden" animate="show" variants={stagger} className="grid sm:grid-cols-3 gap-4">
          <StatCard
            icon={WalletIcon}
            label="Wallet balance"
            value={formatCurrency(currentWalletBalance)}
            sub="Available funds to trade"
            loading={false}
          />
          <StatCard
            icon={Briefcase}
            label="Portfolio value"
            value={formatCurrency(portfolioValue)}
            sub={`${assets.length} asset${assets.length === 1 ? '' : 's'} held in vault`}
            accent="neutral"
            loading={false}
          />
          <StatCard
            icon={TrendingUp}
            label="Total vault assets"
            value={formatCurrency(totalValue)}
            sub="Wallet balance + holdings"
            accent="mint"
            loading={false}
          />
        </motion.div>

        {isReplayMode && replayPerformance && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid sm:grid-cols-4 gap-4">
            <StatCard icon={Target} label="Win Rate" value={formatPercent(replayPerformance.winRate)} accent="neutral" />
            <StatCard icon={Activity} label="ROI" value={formatPercent(replayPerformance.roi)} accent={replayPerformance.roi >= 0 ? 'mint' : 'neutral'} />
            <StatCard icon={ArrowDownRight} label="Max Drawdown" value={formatPercent(replayPerformance.maxDrawdown)} accent="neutral" />
            <StatCard icon={Briefcase} label="Total Trades" value={replayPerformance.totalTrades} accent="neutral" />
          </motion.div>
        )}

        <div className="grid lg:grid-cols-[1.45fr_1fr] gap-6">
          {/* Market overview chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col gap-4"
          >
            <div className="rounded-2xl border border-white/[0.07] bg-void-800/60 p-5 sm:p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {coinImage ? (
                    <img src={coinImage} alt={coinName} className="w-8 h-8 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-white/[0.06] text-ink border border-white/10 flex items-center justify-center font-bold font-display text-sm shrink-0">
                      {coinSymbol.slice(0, 1)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="font-display text-base font-semibold text-ink leading-tight">
                        {coinName} ({coinSymbol})
                      </div>
                      <select
                        value={selectedCoinId}
                        onChange={(e) => setSelectedCoinId(e.target.value)}
                        className="bg-void-900/80 border border-white/[0.08] hover:border-white/20 rounded-lg text-[11px] text-ink font-semibold px-2.5 py-1.5 outline-none cursor-pointer focus:border-mint/50 transition-colors"
                      >
                        {coinOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.name} ({opt.symbol.toUpperCase()})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="text-xs text-ink-faint mt-0.5">{coinName} Reference feed</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono-tab text-ink text-base font-bold leading-tight">
                    {formatCurrency(coinPrice)}
                  </div>
                  <div className={`font-mono-tab text-xs flex items-center justify-end gap-0.5 mt-0.5 ${isUp ? 'text-mint' : 'text-carmine'}`}>
                    {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {coinChange.toFixed(2)}%
                  </div>
                </div>
              </div>

              {loadingChart ? (
                <div className="h-[280px] flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-mint/20 border-t-mint rounded-full animate-spin" />
                </div>
              ) : (
                <InteractiveChart
                  data={selectedCoinChart}
                  height={280}
                  selectedRange={chartDays}
                  onRangeChange={setChartDays}
                  defaultType="area"
                />
              )}

              <Link
                to="/app/markets"
                className="mt-4 inline-flex items-center gap-1.5 text-xs text-mint font-display font-semibold hover:text-mint-400 transition-colors"
              >
                Browse all live markets <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>

          {/* Quick actions + trending */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="space-y-6"
          >
            {/* Quick Actions */}
            <div className="rounded-2xl border border-white/[0.07] bg-void-800/60 p-5 backdrop-blur-xl">
              <div className="font-display text-sm font-semibold text-ink mb-4">Quick Desk Actions</div>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/app/wallet"
                  className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] py-4 hover:bg-white/[0.05] hover:border-mint/20 transition-all group"
                >
                  <Plus size={18} className="text-mint group-hover:scale-105 transition-transform" />
                  <span className="text-xs text-ink-muted group-hover:text-ink transition-colors">Deposit funds</span>
                </Link>
                <Link
                  to="/app/wallet"
                  className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] py-4 hover:bg-white/[0.05] hover:border-mint/30 transition-all group"
                >
                  <Send size={18} className="text-mint group-hover:scale-105 transition-transform" />
                  <span className="text-xs text-ink-muted group-hover:text-ink transition-colors">Withdraw funds</span>
                </Link>
              </div>
            </div>

            {/* Allocation donut — wallet cash vs each holding, from real portfolio data */}
            <div className="rounded-2xl border border-white/[0.07] bg-void-800/60 p-5 backdrop-blur-xl">
              <div className="flex items-center gap-2 mb-4">
                <PieChartIcon size={14} className="text-mint" />
                <span className="font-display text-sm font-semibold text-ink">Vault Allocation</span>
              </div>
              {totalValue <= 0 ? (
                <p className="text-xs text-ink-faint">Fund your wallet to see an allocation breakdown.</p>
              ) : (
                (() => {
                  const palette = ['#D7FF4F', '#F2F2F0', '#75757A', '#3D3D44', '#FB7185', '#28282D'];
                  const slices = [
                    { name: 'Cash (wallet)', value: currentWalletBalance },
                    ...(isReplayMode ? replayPortfolio : assets).map((a) => ({
                      name: a.coin?.symbol?.toUpperCase() || 'Asset',
                      value: (a.quantity || 0) * (a.coin?.currentPrice || 0),
                    })),
                  ].filter((s) => s.value > 0);
                  return (
                    <>
                      <div className="h-[170px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={slices}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={48}
                              outerRadius={70}
                              paddingAngle={3}
                              strokeWidth={0}
                              animationDuration={800}
                            >
                              {slices.map((s, i) => (
                                <Cell key={s.name} fill={palette[i % palette.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const p = payload[0];
                                return (
                                  <div className="rounded-lg border border-white/10 bg-void-900/95 px-3 py-2 text-xs shadow-panel">
                                    <span className="text-ink-muted">{p.name}: </span>
                                    <span className="text-ink font-semibold font-mono-tab">
                                      {formatCurrency(p.value)}
                                    </span>
                                  </div>
                                );
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 justify-center">
                        {slices.map((s, i) => (
                          <span key={s.name} className="flex items-center gap-1.5 text-[11px] text-ink-muted">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ background: palette[i % palette.length] }}
                            />
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </>
                  );
                })()
              )}
            </div>

            {/* Trending section */}
            <div className="rounded-2xl border border-white/[0.07] bg-void-800/60 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="font-display text-sm font-semibold text-ink">Trending Coins</span>
                <Link to="/app/markets" className="text-xs text-mint hover:text-mint-400 transition-colors">
                  See list
                </Link>
              </div>
              <div className="space-y-3.5">
                {trending.length === 0 && (
                  <p className="text-xs text-ink-faint">
                    {errors.trending || 'No trending data available right now.'}
                  </p>
                )}
                {trending.map((coin) => {
                  const item = coin.item || coin;
                  return (
                    <div key={item.id || item.coin_id} className="flex items-center justify-between gap-3 group">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.small || item.thumb ? (
                          <img src={item.small || item.thumb} alt="" className="w-6 h-6 rounded-full group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-white/10" />
                        )}
                        <span className="text-sm text-ink-muted group-hover:text-ink transition-colors truncate">{item.name || item.symbol}</span>
                      </div>
                      <span className="text-xs text-ink-faint font-mono-tab shrink-0">
                        Rank #{item.market_cap_rank ?? '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Holdings table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.24 }}
          className="rounded-2xl border border-white/[0.07] bg-void-800/60 overflow-hidden backdrop-blur-xl"
        >
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/[0.06]">
            <span className="font-display text-sm font-semibold text-ink">Holdings Vault</span>
            <Link to="/app/portfolio" className="text-xs text-mint hover:text-mint-400 transition-colors">
              Full portfolio
            </Link>
          </div>

          {(isReplayMode ? replayPortfolio : assets).length === 0 ? (
            <div className="p-12 text-center">
              <Briefcase size={32} className="mx-auto text-ink-faint mb-3" />
              <p className="text-sm text-ink-muted mb-1 font-semibold">No holdings yet</p>
              <p className="text-xs text-ink-faint mb-5 max-w-xs mx-auto">Fund your wallet balance, then place your first buy order from the {isReplayMode ? 'Virtual' : 'live'} Markets desk.</p>
              <Link
                to="/app/markets"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-mint text-void font-display font-semibold text-xs shadow-mint-sm hover:bg-mint-400 transition-all hover:shadow-mint"
              >
                Browse live markets <ArrowRight size={13} />
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink-faint text-[10px] uppercase tracking-wider font-mono-tab border-b border-white/[0.04]">
                    <th className="px-5 sm:px-6 py-3.5 font-normal">Asset</th>
                    <th className="px-4 py-3.5 font-normal">Quantity</th>
                    <th className="px-4 py-3.5 font-normal">Avg. buy price</th>
                    <th className="px-4 py-3.5 font-normal">Current price</th>
                    <th className="px-5 sm:px-6 py-3.5 font-normal text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {(isReplayMode ? replayPortfolio : assets).map((a) => {
                    const value = (a.quantity || 0) * (a.coin?.currentPrice || 0);
                    const pnl = (a.coin?.currentPrice || 0) - (a.buyPrice || 0);
                    const up = pnl >= 0;
                    return (
                      <tr key={a.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="px-5 sm:px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            {a.coin?.image && <img src={a.coin.image} alt="" className="w-6 h-6 rounded-full" />}
                            <div>
                              <div className="text-ink font-semibold">{a.coin?.symbol?.toUpperCase()}</div>
                              <div className="text-xs text-ink-faint">{a.coin?.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-mono-tab text-ink-muted">{a.quantity}</td>
                        <td className="px-4 py-4 font-mono-tab text-ink-muted">{formatCurrency(a.buyPrice)}</td>
                        <td className="px-4 py-4 font-mono-tab text-ink-muted">
                          {formatCurrency(a.coin?.currentPrice)}
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
