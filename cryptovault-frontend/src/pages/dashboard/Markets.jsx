import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Star, Loader2, ArrowUpRight, ArrowDownRight, ChevronDown, Play, Pause, SkipForward, SkipBack, X, Settings2, FastForward, Trash2, Clock
} from 'lucide-react';
import { useReplay } from '../../context/ReplayContext';
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

  const {
    isReplayMode, activeSession, replayCandles, replayWallet, replayOrders,
    loadSession, exitReplayMode, executeControl, placeVirtualOrder
  } = useReplay();

  const [replayModalOpen, setReplayModalOpen] = useState(false);
  const [replayModalTab, setReplayModalTab] = useState('new');
  const [replaySessions, setReplaySessions] = useState([]);
  const [replayForm, setReplayForm] = useState({ name: '', startTime: '', timeframe: '1d', initialBalance: 10000 });
  const [loadingReplay, setLoadingReplay] = useState(false);

  const fetchSessions = async () => {
    try {
      const { getReplaySessions } = await import('../../api/replay');
      const sessions = await getReplaySessions();
      setReplaySessions(sessions);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (replayModalOpen) fetchSessions();
  }, [replayModalOpen]);

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
    if (isReplayMode) {
      setChartData(replayCandles.map(c => ({
        time: Math.floor(c.openTime / 1000),
        open: c.openPrice,
        high: c.highPrice,
        low: c.lowPrice,
        close: c.closePrice,
        value: c.closePrice
      })));
      return;
    }
    
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
  }, [selected?.id, timeframe, isReplayMode, replayCandles]);

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
  const price = isReplayMode 
    ? (replayCandles.length ? replayCandles[replayCandles.length - 1].closePrice : 0)
    : (selected?.currentPrice || 0);
  const total = qty * price;
  const availableBalance = isReplayMode 
    ? (replayWallet?.balance != null ? Number(replayWallet.balance) : null)
    : (wallet?.balance != null ? Number(wallet.balance) : null);

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
      if (isReplayMode) {
        await placeVirtualOrder({
          symbol: selected.symbol.toUpperCase(),
          quantity: qty,
          orderType: side,
          price: price
        });
      } else {
        await placeOrder({ coinId: selected.id, quantity: qty, orderType: side });
        push(`${side === 'BUY' ? 'Bought' : 'Sold'} ${qty} ${selected.symbol?.toUpperCase()}.`, 'success');
      }
      setQuantity('');
      if (!isReplayMode) {
        refreshOrders();
        getWallet().then(setWallet).catch(() => {});
      }
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
                onClick={() => {
                  setSelected(c);
                  if (isReplayMode) {
                    exitReplayMode();
                  }
                }}
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

            <div className="flex items-center justify-between px-6 py-2.5 border-b border-white/[0.04]">
              {isReplayMode ? (
                <div className="flex items-center gap-3 w-full justify-between">
                   <div className="flex items-center gap-2">
                     <span className="text-[10px] font-bold text-mint bg-mint/10 px-2 py-1 rounded">REPLAY MODE</span>
                     <span className="text-xs text-ink-faint">{activeSession?.symbol}</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <button onClick={() => executeControl('skipBackward', 1)} className="p-1.5 hover:bg-white/10 rounded"><SkipBack size={14}/></button>
                     {activeSession?.replayStatus === 'PLAYING' ? (
                       <button onClick={() => executeControl('pauseReplaySession')} className="p-1.5 hover:bg-white/10 rounded text-mint"><Pause size={14}/></button>
                     ) : (
                       <button onClick={() => executeControl(activeSession?.replayStatus === 'PAUSED' ? 'resumeReplaySession' : 'startReplaySession')} className="p-1.5 hover:bg-white/10 rounded text-mint"><Play size={14}/></button>
                     )}
                     <button onClick={() => executeControl('nextReplayCandle')} className="p-1.5 hover:bg-white/10 rounded"><SkipForward size={14}/></button>
                     
                     <div className="w-px h-4 bg-white/10 mx-1"/>
                     
                     <select onChange={(e) => executeControl('updateReplaySpeed', parseFloat(e.target.value))} value={activeSession?.replaySpeed || 1} className="bg-transparent text-xs outline-none cursor-pointer text-ink-muted">
                        <option value={0.5}>0.5x</option>
                        <option value={1}>1x</option>
                        <option value={2}>2x</option>
                        <option value={5}>5x</option>
                     </select>
                     
                     <button onClick={exitReplayMode} className="ml-2 px-2 py-1 bg-carmine/20 text-carmine rounded text-[10px] uppercase font-bold hover:bg-carmine/40 transition-colors">Exit</button>
                   </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1.5">
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
                  <button onClick={() => setReplayModalOpen(true)} className="px-3 py-1.5 text-[11px] bg-void-800 border border-white/10 rounded-md hover:border-mint/50 transition-colors text-mint font-semibold flex items-center gap-1.5 shadow-mint-sm hover:shadow-mint">
                    <FastForward size={13}/> Market Replay
                  </button>
                </>
              )}
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
                  timeVisible={isReplayMode}
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
                Orders ({(isReplayMode ? replayOrders : orders).length})
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
                  {(isReplayMode ? replayOrders : orders).length ? (
                    (isReplayMode ? replayOrders : orders).slice(0, 20).map((o) => (
                      <tr key={o.id} className="border-t border-white/[0.03] hover:bg-white/[0.02]">
                        <td className="px-6 py-2 font-mono-tab">{o.orderItem?.coin?.symbol?.toUpperCase() || (isReplayMode && selected ? selected.symbol.toUpperCase() : '—')}</td>
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

      {/* Replay Modal */}
      <AnimatePresence>
        {replayModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md bg-void-900 border border-white/10 rounded-2xl shadow-panel overflow-hidden flex flex-col max-h-[85vh]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
                <h3 className="font-display font-semibold text-lg">Market Replay</h3>
                <button onClick={() => setReplayModalOpen(false)} className="text-ink-muted hover:text-ink"><X size={18}/></button>
              </div>
              <div className="flex border-b border-white/5 shrink-0">
                <button onClick={() => setReplayModalTab('new')} className={`flex-1 py-3 text-xs font-semibold ${replayModalTab === 'new' ? 'text-mint border-b-2 border-mint bg-white/[0.02]' : 'text-ink-muted hover:text-ink hover:bg-white/[0.01]'}`}>New Session</button>
                <button onClick={() => setReplayModalTab('saved')} className={`flex-1 py-3 text-xs font-semibold ${replayModalTab === 'saved' ? 'text-mint border-b-2 border-mint bg-white/[0.02]' : 'text-ink-muted hover:text-ink hover:bg-white/[0.01]'}`}>Saved Sessions</button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                {replayModalTab === 'new' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[11px] uppercase tracking-wide text-ink-faint mb-1.5 block">Session Name</label>
                      <input type="text" className="w-full bg-void-800 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-mint/50 font-mono-tab" value={replayForm.name} onChange={e => setReplayForm(p => ({...p, name: e.target.value}))} placeholder="e.g. BTC 2021 Bull Run" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] uppercase tracking-wide text-ink-faint mb-1.5 block">Start Date</label>
                        <input type="date" className="w-full bg-void-800 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-mint/50 font-mono-tab" value={replayForm.startTime} onChange={e => setReplayForm(p => ({...p, startTime: e.target.value}))} />
                      </div>
                      <div>
                        <label className="text-[11px] uppercase tracking-wide text-ink-faint mb-1.5 block">Timeframe</label>
                        <select className="w-full bg-void-800 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-mint/50 font-mono-tab" value={replayForm.timeframe} onChange={e => setReplayForm(p => ({...p, timeframe: e.target.value}))}>
                          <option value="1m">1m</option>
                          <option value="5m">5m</option>
                          <option value="15m">15m</option>
                          <option value="1h">1h</option>
                          <option value="4h">4h</option>
                          <option value="1d">1d</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-wide text-ink-faint mb-1.5 block">Initial Virtual Balance (USDT)</label>
                      <input type="number" className="w-full bg-void-800 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-mint/50 font-mono-tab" value={replayForm.initialBalance} onChange={e => setReplayForm(p => ({...p, initialBalance: e.target.value}))} />
                    </div>
                    <button 
                      onClick={async () => {
                        setLoadingReplay(true);
                        try {
                          const payload = {
                            name: replayForm.name || 'Quick Replay',
                            description: `Replay of ${selected?.symbol} on ${replayForm.timeframe}`,
                            symbol: selected?.symbol,
                            timeframe: replayForm.timeframe,
                            startTime: new Date(replayForm.startTime).getTime(),
                            endTime: Date.now(),
                            initialBalance: parseFloat(replayForm.initialBalance),
                            replaySpeed: 1
                          };
                          const { createReplaySession } = await import('../../api/replay');
                          const session = await createReplaySession(payload);
                          await loadSession(session);
                          setReplayModalOpen(false);
                        } catch (err) {
                          push('Failed to start replay', 'error');
                        } finally {
                          setLoadingReplay(false);
                        }
                      }}
                      disabled={loadingReplay || !replayForm.startTime}
                      className="w-full bg-mint text-void font-bold rounded-xl py-3 text-sm hover:bg-mint-400 transition-colors disabled:opacity-50 mt-2"
                    >
                      {loadingReplay ? 'Starting...' : 'Start Virtual Trading'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {replaySessions.length === 0 ? (
                      <div className="text-center py-8 text-ink-faint text-sm">No saved sessions found.</div>
                    ) : (
                      replaySessions.map(session => (
                        <div key={session.id} className="bg-void-800 border border-white/5 rounded-xl p-3 flex items-center justify-between group hover:border-white/10 transition-colors">
                          <div className="min-w-0 pr-4">
                            <div className="font-semibold text-sm truncate">{session.name}</div>
                            <div className="text-xs text-ink-faint mt-0.5 flex items-center gap-1.5">
                              <span>{session.symbol}</span>
                              <span className="w-1 h-1 rounded-full bg-white/20"></span>
                              <span>{session.timeframe}</span>
                              <span className="w-1 h-1 rounded-full bg-white/20"></span>
                              <span className="flex items-center gap-1"><Clock size={10} /> {new Date(session.currentTime).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button 
                              onClick={async () => {
                                try {
                                  await loadSession(session);
                                  setReplayModalOpen(false);
                                } catch (e) {
                                  push('Failed to load session', 'error');
                                }
                              }}
                              className="px-3 py-1.5 bg-mint/10 text-mint hover:bg-mint/20 rounded-lg text-xs font-semibold transition-colors"
                            >
                              Resume
                            </button>
                            <button 
                              onClick={async () => {
                                try {
                                  const { deleteReplaySession } = await import('../../api/replay');
                                  await deleteReplaySession(session.id);
                                  push('Session deleted', 'info');
                                  fetchSessions();
                                } catch (e) {
                                  push('Failed to delete', 'error');
                                }
                              }}
                              className="p-1.5 text-ink-faint hover:text-carmine hover:bg-carmine/10 rounded-lg transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
