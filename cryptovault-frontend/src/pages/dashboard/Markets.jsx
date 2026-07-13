import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Star, Loader2, ArrowUpRight, ArrowDownRight, ChevronDown,
} from 'lucide-react';
import InteractiveChart from '../../components/InteractiveChart';
import { getCoinList, searchCoins, getTop50, getMarketChart } from '../../api/coins';
import {
  addToWatchlist, getUserWatchlist, getAllOrders, placeOrder, getWallet,
} from '../../api/trading';
import { normalizeCoin, parseMarketChart } from '../../utils/normalizeCoin';
import { formatCurrency, formatPercent } from '../../utils/chartData';
import { useToast } from '../../context/ToastContext';

const TABS = [
  { key: 'fav', label: '★ Fav' },
  { key: 'top50', label: 'Top 50' },
  { key: 'live', label: 'All' },
];

const SORTS = [
  { key: 'rank', label: 'Rank' },
  { key: 'az', label: 'A → Z' },
  { key: 'gainers', label: 'Top Gainers' },
  { key: 'losers', label: 'Top Losers' },
];

const TIMEFRAMES = [
  { key: 'now', label: 'Now' },
  { key: '1', label: '1D' },
  { key: '7', label: '7D' },
  { key: '30', label: '1M' },
  { key: '90', label: '3M' },
  { key: '365', label: '1Y' },
];

export default function Markets() {
  const [tab, setTab] = useState('top50');
  const [sortKey, setSortKey] = useState('rank');
  const [sortOpen, setSortOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const [coins, setCoins] = useState([]);
  const [top50, setTop50] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [watchlistIds, setWatchlistIds] = useState(new Set());

  const [selected, setSelected] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [timeframe, setTimeframe] = useState('7');

  const [orders, setOrders] = useState([]);
  const [wallet, setWallet] = useState(null);

  const [side, setSide] = useState('BUY');
  const [quantity, setQuantity] = useState('');
  const [placing, setPlacing] = useState(false);
  const [formError, setFormError] = useState('');
  const submittingRef = useRef(false);

  const { push } = useToast();

  // Initial data
  useEffect(() => {
    setLoadingList(true);
    Promise.all([getCoinList(0).catch(() => []), getTop50().catch(() => [])])
      .then(([liveList, top50List]) => {
        const normLive = (Array.isArray(liveList) ? liveList : []).map(normalizeCoin);
        const normTop = (Array.isArray(top50List) ? top50List : []).map(normalizeCoin);
        setCoins(normLive);
        setTop50(normTop);
        setSelected((prev) => prev || normTop[0] || normLive[0] || null);
      })
      .finally(() => setLoadingList(false));

    getUserWatchlist()
      .then((wl) => setWatchlistIds(new Set((wl?.coins || []).map((c) => c.id))))
      .catch(() => {});

    getWallet().then(setWallet).catch(() => {});
    refreshOrders();
  }, []);

  // Real-time tick effect for market prices
  useEffect(() => {
    const jitter = (arr) => arr.map(c => {
      const price = c.currentPrice;
      if (price == null) return c;
      const newVal = price * (1 + (Math.random() - 0.5) * 0.002);
      return { ...c, currentPrice: newVal };
    });

    const interval = setInterval(() => {
      setCoins(prev => jitter(prev));
      setTop50(prev => jitter(prev));
      setSelected(prev => {
        if (!prev || prev.currentPrice == null) return prev;
        const newVal = prev.currentPrice * (1 + (Math.random() - 0.5) * 0.002);
        return { ...prev, currentPrice: newVal };
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const refreshOrders = () => {
    getAllOrders().then((data) => setOrders(Array.isArray(data) ? data : [])).catch(() => {});
  };

  // Search debounce
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    const id = setTimeout(() => {
      searchCoins(query)
        .then((res) => setSearchResults((res?.coins || []).map(normalizeCoin)))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(id);
  }, [query]);

  // Chart load on coin/timeframe change
  useEffect(() => {
    if (!selected?.id) return;
    setChartLoading(true);
    const fetchDays = timeframe === 'now' ? '1' : timeframe;
    getMarketChart(selected.id, fetchDays)
      .then((data) => {
        let parsed = parseMarketChart(data);
        if (timeframe === 'now') {
          parsed = parsed.slice(-50); // Zoom in on the last 50 candles
        }
        setChartData(parsed);
      })
      .catch(() => setChartData([]))
      .finally(() => setChartLoading(false));
  }, [selected?.id, timeframe]);

  const baseList = tab === 'top50' ? top50 : tab === 'live' ? coins : top50.concat(coins);
  const list = query.trim()
    ? searchResults
    : tab === 'fav'
      ? baseList.filter((c) => watchlistIds.has(c.id))
      : baseList;

  const sortedList = useMemo(() => {
    const arr = [...(list || [])];
    if (sortKey === 'az') arr.sort((a, b) => (a.symbol || '').localeCompare(b.symbol || ''));
    else if (sortKey === 'gainers') arr.sort((a, b) => (b.priceChangePercentage24h ?? -999) - (a.priceChangePercentage24h ?? -999));
    else if (sortKey === 'losers') arr.sort((a, b) => (a.priceChangePercentage24h ?? 999) - (b.priceChangePercentage24h ?? 999));
    else arr.sort((a, b) => (a.marketCapRank ?? 9999) - (b.marketCapRank ?? 9999));
    // de-dupe by id when tab === 'live' merges both lists
    const seen = new Set();
    return arr.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)));
  }, [list, sortKey]);

  const handleWatch = async (coin, e) => {
    e.stopPropagation();
    try {
      await addToWatchlist(coin.id);
      setWatchlistIds((prev) => {
        const next = new Set(prev);
        next.has(coin.id) ? next.delete(coin.id) : next.add(coin.id);
        return next;
      });
    } catch (err) {
      push(err.friendlyMessage || 'Could not update watchlist.', 'error');
    }
  };

  const qty = parseFloat(quantity) || 0;
  const price = selected?.currentPrice || 0;
  const total = qty * price;
  const availableBalance = wallet?.balance != null ? Number(wallet.balance) : null;

  const submitOrder = async (e) => {
    e.preventDefault();
    if (submittingRef.current || !selected) return;
    setFormError('');
    if (qty <= 0) {
      setFormError('Enter an amount greater than zero.');
      return;
    }
    submittingRef.current = true;
    setPlacing(true);
    try {
      await placeOrder({ coinId: selected.id, quantity: qty, orderType: side });
      push(`${side === 'BUY' ? 'Bought' : 'Sold'} ${qty} ${selected.symbol?.toUpperCase()}.`, 'success');
      setQuantity('');
      refreshOrders();
      getWallet().then(setWallet).catch(() => {});
    } catch (err) {
      setFormError(err.friendlyMessage || 'Order could not be placed.');
    } finally {
      submittingRef.current = false;
      setPlacing(false);
    }
  };

  const up = (selected?.priceChangePercentage24h ?? 0) >= 0;

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-void-950 text-ink overflow-hidden">

      {/* ===== Market list column ===== */}
      <div className="w-[300px] shrink-0 border-r border-white/[0.06] bg-void-900/40 flex flex-col min-h-0">
        <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
          <h1 className="font-display text-[17px] font-semibold mb-3">Exchange</h1>
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                  tab === t.key ? 'bg-mint text-void font-bold shadow-mint-sm' : 'bg-white/[0.04] text-ink-muted hover:text-ink'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-void-900/60 px-3 py-2">
            {searching ? <Loader2 size={14} className="text-ink-faint animate-spin" /> : <Search size={14} className="text-ink-faint" />}
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search markets…"
              className="flex-1 bg-transparent outline-none text-[12.5px] text-ink placeholder:text-ink-faint"
            />
          </div>
        </div>

        <div className="relative flex items-center justify-between px-4 py-2 text-[11px] text-ink-faint border-b border-white/[0.04]">
          <span>Sorted by {SORTS.find((s) => s.key === sortKey)?.label}</span>
          <button onClick={() => setSortOpen((o) => !o)} className="flex items-center gap-1 hover:text-ink">
            Sort <ChevronDown size={12} />
          </button>
          <AnimatePresence>
            {sortOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute right-3 top-8 z-20 w-36 rounded-xl border border-white/10 bg-void-800 shadow-panel overflow-hidden"
              >
                {SORTS.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => { setSortKey(s.key); setSortOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-white/[0.05] ${sortKey === s.key ? 'text-mint' : 'text-ink-muted'}`}
                  >
                    {s.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingList ? (
            <div className="p-8 text-center text-xs text-ink-faint">Loading markets…</div>
          ) : sortedList?.length ? (
            sortedList.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-left border-l-2 transition-colors ${
                  selected?.id === c.id ? 'bg-white/[0.04] border-mint' : 'border-transparent hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    onClick={(e) => handleWatch(c, e)}
                    className={`shrink-0 ${watchlistIds.has(c.id) ? 'text-amber-400' : 'text-ink-faint hover:text-ink-muted'}`}
                  >
                    <Star size={13} fill={watchlistIds.has(c.id) ? 'currentColor' : 'none'} />
                  </span>
                  {c.image && <img src={c.image} alt="" className="w-6 h-6 rounded-full shrink-0" />}
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-semibold truncate">{c.symbol?.toUpperCase()}/USDT</div>
                    <div className="text-[10.5px] text-ink-faint truncate">{c.name}</div>
                  </div>
                </div>
                <div className="text-right shrink-0 pl-2">
                  <div className="text-[12.5px] font-mono-tab">
                    {c.currentPrice != null ? formatCurrency(c.currentPrice, 'USD', c.currentPrice < 1 ? 4 : 2) : '—'}
                  </div>
                  <div className={`text-[11px] font-mono-tab ${(c.priceChangePercentage24h ?? 0) >= 0 ? 'text-mint' : 'text-carmine'}`}>
                    {c.priceChangePercentage24h != null ? formatPercent(c.priceChangePercentage24h) : '—'}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-ink-faint">
              {tab === 'fav' ? 'No favorites yet — tap the star on any market.' : 'No markets found.'}
            </div>
          )}
        </div>
      </div>

      {/* ===== Main column: chart + orders ===== */}
      <div className="flex-1 min-w-0 flex flex-col border-r border-white/[0.06]">
        {selected ? (
          <>
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/[0.06] flex-wrap gap-3">
              <div className="flex items-center gap-3">
                {selected.image && <img src={selected.image} alt="" className="w-7 h-7 rounded-full" />}
                <span className="font-display text-lg font-semibold">{selected.symbol?.toUpperCase()}/USDT</span>
                <span className={`font-mono-tab text-lg ${up ? 'text-mint' : 'text-carmine'}`}>
                  {formatCurrency(selected.currentPrice, 'USD', selected.currentPrice < 1 ? 4 : 2)}
                </span>
              </div>
              <div className="flex gap-6 text-[11px] text-ink-faint">
                <div>24h Change<br /><b className={`font-mono-tab ${up ? 'text-mint' : 'text-carmine'}`}>{formatPercent(selected.priceChangePercentage24h ?? 0)}</b></div>
                <div>24h High<br /><b className="font-mono-tab text-ink">{selected.high24h != null ? formatCurrency(selected.high24h) : '—'}</b></div>
                <div>24h Low<br /><b className="font-mono-tab text-ink">{selected.low24h != null ? formatCurrency(selected.low24h) : '—'}</b></div>
                <div>Market Cap<br /><b className="font-mono-tab text-ink">{selected.marketCap ? formatCurrency(selected.marketCap, 'USD', 0) : '—'}</b></div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-6 py-2.5 border-b border-white/[0.04]">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf.key}
                  onClick={() => setTimeframe(tf.key)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium ${
                    timeframe === tf.key ? 'bg-mint text-void font-bold' : 'bg-white/[0.04] text-ink-muted hover:text-ink'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            <div className="flex-1 min-h-0 p-4 relative">
              {chartLoading ? (
                <div className="w-full h-full flex items-center justify-center text-ink-faint text-xs">
                  <Loader2 size={16} className="animate-spin mr-2" /> Loading chart…
                </div>
              ) : chartData.length ? (
                <InteractiveChart
                  data={chartData}
                  height={340}
                  defaultType="candlestick"
                  hideTimeRanges={true}
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-ink-faint text-xs">
                  No chart data available.
                </div>
              )}
            </div>

            <div className="border-t border-white/[0.06] max-h-[220px] overflow-y-auto shrink-0">
              <div className="px-6 py-2.5 text-xs text-ink-muted border-b border-white/[0.04] font-semibold">
                Orders ({orders.length})
              </div>
              <table className="w-full text-[11.5px]">
                <thead>
                  <tr className="text-left text-ink-faint text-[10px] uppercase tracking-wider">
                    <th className="px-6 py-2 font-normal">Asset</th>
                    <th className="px-4 py-2 font-normal">Side</th>
                    <th className="px-4 py-2 font-normal">Amount</th>
                    <th className="px-4 py-2 font-normal">Price</th>
                    <th className="px-6 py-2 font-normal text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length ? (
                    orders.slice(0, 20).map((o) => (
                      <tr key={o.id} className="border-t border-white/[0.03] hover:bg-white/[0.02]">
                        <td className="px-6 py-2 font-mono-tab">{o.orderItem?.coin?.symbol?.toUpperCase() || '—'}</td>
                        <td className={`px-4 py-2 font-semibold ${o.orderType === 'BUY' ? 'text-mint' : 'text-carmine'}`}>{o.orderType}</td>
                        <td className="px-4 py-2 font-mono-tab">{o.orderItem?.quantity ?? '—'}</td>
                        <td className="px-4 py-2 font-mono-tab">{o.price != null ? formatCurrency(o.price) : '—'}</td>
                        <td className="px-6 py-2 text-right text-ink-faint">{o.status}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={5} className="px-6 py-6 text-center text-ink-faint">No orders yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-ink-faint text-sm">Select a market to begin.</div>
        )}
      </div>

      {/* ===== Order panel ===== */}
      <div className="w-[300px] shrink-0 bg-void-900/40 p-4 flex flex-col overflow-y-auto">
        <div className="grid grid-cols-2 rounded-xl border border-white/10 bg-void-900/60 p-1 mb-4">
          <button
            onClick={() => setSide('BUY')}
            className={`py-2.5 rounded-lg text-sm font-display font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              side === 'BUY' ? 'bg-mint text-void shadow-mint' : 'text-ink-muted'
            }`}
          >
            <ArrowUpRight size={14} /> Buy
          </button>
          <button
            onClick={() => setSide('SELL')}
            className={`py-2.5 rounded-lg text-sm font-display font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              side === 'SELL' ? 'bg-carmine text-void' : 'text-ink-muted'
            }`}
          >
            <ArrowDownRight size={14} /> Sell
          </button>
        </div>

        <form onSubmit={submitOrder} className="space-y-4">
          <div>
            <label className="text-[10.5px] uppercase tracking-wide text-ink-faint mb-1.5 block">Price</label>
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-void-900/60 px-3 py-2.5">
              <span className="font-mono-tab text-sm text-ink">{price ? formatCurrency(price, 'USD', price < 1 ? 4 : 2) : '—'}</span>
              <span className="text-[11px] text-ink-faint">USDT</span>
            </div>
          </div>

          <div>
            <label className="text-[10.5px] uppercase tracking-wide text-ink-faint mb-1.5 block">Amount</label>
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-void-900/60 px-3 py-2.5 focus-within:border-mint/50">
              <input
                type="number"
                step="any"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0.00000"
                className="flex-1 bg-transparent outline-none text-sm font-mono-tab text-ink placeholder:text-ink-faint"
              />
              <span className="text-[11px] text-ink-faint">{selected?.symbol?.toUpperCase() || ''}</span>
            </div>
          </div>

          <div className="flex justify-between text-[11px] text-ink-faint">
            <span>Available</span>
            <b className="text-ink font-mono-tab">{availableBalance != null ? formatCurrency(availableBalance) : '—'}</b>
          </div>

          <div className="rounded-lg bg-void-900/60 border border-white/[0.06] px-3 py-2.5 flex justify-between text-sm">
            <span className="text-ink-faint">Estimated total</span>
            <span className="font-mono-tab font-semibold text-ink">{formatCurrency(total)}</span>
          </div>

          {formError && (
            <div className="text-xs text-carmine bg-carmine/10 border border-carmine/20 rounded-lg px-3 py-2">{formError}</div>
          )}

          <button
            type="submit"
            disabled={placing || !selected}
            className={`w-full flex items-center justify-center gap-2 rounded-xl font-display font-semibold text-sm py-3 transition-colors disabled:opacity-60 ${
              side === 'BUY' ? 'bg-mint text-void shadow-mint hover:bg-mint-400' : 'bg-carmine text-void hover:bg-carmine-400'
            }`}
          >
            {placing ? <Loader2 size={16} className="animate-spin" /> : `Place ${side === 'BUY' ? 'Buy' : 'Sell'} Order`}
          </button>
        </form>
      </div>
    </div>
  );
}
