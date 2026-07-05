import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calculator, X, ChevronDown } from 'lucide-react';
import { formatCurrency } from '../utils/chartData';

const TABS = [
  { key: 'profit', label: 'Profit' },
  { key: 'dca', label: 'DCA' },
  { key: 'position', label: 'Position Size' },
];

function ProfitCalc() {
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [quantity, setQuantity] = useState('');

  const result = useMemo(() => {
    const b = parseFloat(buyPrice) || 0;
    const s = parseFloat(sellPrice) || 0;
    const q = parseFloat(quantity) || 0;
    const investment = b * q;
    const returns = s * q;
    const profit = returns - investment;
    const pct = investment > 0 ? (profit / investment) * 100 : 0;
    return { investment, returns, profit, pct };
  }, [buyPrice, sellPrice, quantity]);

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[11px] text-ink-faint mb-1 block">Buy Price (USD)</label>
        <input type="number" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} placeholder="0.00"
          className="w-full rounded-lg border border-white/10 bg-void-900/60 px-3 py-2.5 text-sm text-ink font-mono outline-none focus:border-mint/50" />
      </div>
      <div>
        <label className="text-[11px] text-ink-faint mb-1 block">Sell Price (USD)</label>
        <input type="number" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} placeholder="0.00"
          className="w-full rounded-lg border border-white/10 bg-void-900/60 px-3 py-2.5 text-sm text-ink font-mono outline-none focus:border-mint/50" />
      </div>
      <div>
        <label className="text-[11px] text-ink-faint mb-1 block">Quantity</label>
        <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0.00"
          className="w-full rounded-lg border border-white/10 bg-void-900/60 px-3 py-2.5 text-sm text-ink font-mono outline-none focus:border-mint/50" />
      </div>
      {(buyPrice || sellPrice || quantity) && (
        <div className="rounded-xl bg-void-900/60 border border-white/[0.06] p-3 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-ink-faint">Investment</span>
            <span className="font-mono text-ink-muted">{formatCurrency(result.investment)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-ink-faint">Returns</span>
            <span className="font-mono text-ink-muted">{formatCurrency(result.returns)}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-white/[0.06] pt-2">
            <span className="text-ink-faint">Profit/Loss</span>
            <span className={`font-mono font-semibold ${result.profit >= 0 ? 'text-mint' : 'text-carmine'}`}>
              {result.profit >= 0 ? '+' : ''}{formatCurrency(result.profit)} ({result.pct.toFixed(2)}%)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function DCACalc() {
  const [totalAmount, setTotalAmount] = useState('');
  const [intervals, setIntervals] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');

  const result = useMemo(() => {
    const total = parseFloat(totalAmount) || 0;
    const n = parseInt(intervals) || 1;
    const price = parseFloat(currentPrice) || 0;
    const perInterval = total / n;
    const coinsPerBuy = price > 0 ? perInterval / price : 0;
    const totalCoins = coinsPerBuy * n;
    return { perInterval, coinsPerBuy, totalCoins };
  }, [totalAmount, intervals, currentPrice]);

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[11px] text-ink-faint mb-1 block">Total Investment (USD)</label>
        <input type="number" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} placeholder="1000"
          className="w-full rounded-lg border border-white/10 bg-void-900/60 px-3 py-2.5 text-sm text-ink font-mono outline-none focus:border-mint/50" />
      </div>
      <div>
        <label className="text-[11px] text-ink-faint mb-1 block">Number of Buys</label>
        <input type="number" value={intervals} onChange={(e) => setIntervals(e.target.value)} placeholder="12"
          className="w-full rounded-lg border border-white/10 bg-void-900/60 px-3 py-2.5 text-sm text-ink font-mono outline-none focus:border-mint/50" />
      </div>
      <div>
        <label className="text-[11px] text-ink-faint mb-1 block">Current Price (USD)</label>
        <input type="number" value={currentPrice} onChange={(e) => setCurrentPrice(e.target.value)} placeholder="0.00"
          className="w-full rounded-lg border border-white/10 bg-void-900/60 px-3 py-2.5 text-sm text-ink font-mono outline-none focus:border-mint/50" />
      </div>
      {(totalAmount || intervals) && (
        <div className="rounded-xl bg-void-900/60 border border-white/[0.06] p-3 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-ink-faint">Per purchase</span>
            <span className="font-mono text-ink-muted">{formatCurrency(result.perInterval)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-ink-faint">Coins per buy</span>
            <span className="font-mono text-ink-muted">{result.coinsPerBuy.toFixed(6)}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-white/[0.06] pt-2">
            <span className="text-ink-faint">Total coins</span>
            <span className="font-mono text-mint font-semibold">{result.totalCoins.toFixed(6)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function PositionCalc() {
  const [accountSize, setAccountSize] = useState('');
  const [riskPct, setRiskPct] = useState('2');
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');

  const result = useMemo(() => {
    const account = parseFloat(accountSize) || 0;
    const risk = parseFloat(riskPct) || 0;
    const entry = parseFloat(entryPrice) || 0;
    const stop = parseFloat(stopLoss) || 0;
    const riskAmount = account * (risk / 100);
    const diff = Math.abs(entry - stop);
    const positionSize = diff > 0 ? riskAmount / diff : 0;
    const positionValue = positionSize * entry;
    return { riskAmount, positionSize, positionValue };
  }, [accountSize, riskPct, entryPrice, stopLoss]);

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[11px] text-ink-faint mb-1 block">Account Size (USD)</label>
        <input type="number" value={accountSize} onChange={(e) => setAccountSize(e.target.value)} placeholder="10000"
          className="w-full rounded-lg border border-white/10 bg-void-900/60 px-3 py-2.5 text-sm text-ink font-mono outline-none focus:border-mint/50" />
      </div>
      <div>
        <label className="text-[11px] text-ink-faint mb-1 block">Risk % per trade</label>
        <input type="number" value={riskPct} onChange={(e) => setRiskPct(e.target.value)} placeholder="2"
          className="w-full rounded-lg border border-white/10 bg-void-900/60 px-3 py-2.5 text-sm text-ink font-mono outline-none focus:border-mint/50" />
      </div>
      <div>
        <label className="text-[11px] text-ink-faint mb-1 block">Entry Price</label>
        <input type="number" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} placeholder="0.00"
          className="w-full rounded-lg border border-white/10 bg-void-900/60 px-3 py-2.5 text-sm text-ink font-mono outline-none focus:border-mint/50" />
      </div>
      <div>
        <label className="text-[11px] text-ink-faint mb-1 block">Stop Loss Price</label>
        <input type="number" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} placeholder="0.00"
          className="w-full rounded-lg border border-white/10 bg-void-900/60 px-3 py-2.5 text-sm text-ink font-mono outline-none focus:border-mint/50" />
      </div>
      {(accountSize || entryPrice) && (
        <div className="rounded-xl bg-void-900/60 border border-white/[0.06] p-3 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-ink-faint">Risk amount</span>
            <span className="font-mono text-ink-muted">{formatCurrency(result.riskAmount)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-ink-faint">Position size</span>
            <span className="font-mono text-ink-muted">{result.positionSize.toFixed(6)} units</span>
          </div>
          <div className="flex justify-between text-sm border-t border-white/[0.06] pt-2">
            <span className="text-ink-faint">Position value</span>
            <span className="font-mono text-mint font-semibold">{formatCurrency(result.positionValue)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FinancialCalculator({ className = '' }) {
  const [tab, setTab] = useState('profit');

  return (
    <div className={`rounded-2xl glass-card overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06]">
        <Calculator size={15} className="text-violet-400" />
        <span className="font-display text-sm font-semibold text-ink">Calculator</span>
      </div>

      <div className="flex border-b border-white/[0.06]">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 px-3 py-2.5 text-xs font-display font-semibold border-b-2 transition-colors ${
              tab === t.key
                ? 'border-violet-400 text-ink'
                : 'border-transparent text-ink-faint hover:text-ink-muted'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-5">
        {tab === 'profit' && <ProfitCalc />}
        {tab === 'dca' && <DCACalc />}
        {tab === 'position' && <PositionCalc />}
      </div>
    </div>
  );
}
