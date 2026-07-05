import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { formatCurrency, formatPercent } from '../utils/chartData';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';

const COLORS = ['#D7FF4F', '#7C5CFF', '#FF3B69', '#4DFFC1', '#9A82FF', '#FF6B8C', '#FBBF24', '#34D399'];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-lg px-3 py-2 text-xs border border-white/10">
      <p className="text-ink-faint mb-1">{label}</p>
      <p className="text-mint font-mono font-semibold">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

/**
 * Portfolio growth area chart
 */
export function PortfolioGrowthChart({ data = [], height = 200, className = '' }) {
  return (
    <div className={`rounded-2xl glass-card p-5 sm:p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-display text-sm font-semibold text-ink">Portfolio Growth</div>
          <div className="text-xs text-ink-faint">Value over time</div>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp size={14} className="text-mint" />
          <span className="text-xs text-mint font-mono font-medium">
            {data.length > 1
              ? formatPercent(((data[data.length - 1]?.value - data[0]?.value) / (data[0]?.value || 1)) * 100)
              : '—'}
          </span>
        </div>
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
            <defs>
              <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D7FF4F" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#D7FF4F" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#5B6378', fontSize: 10 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#5B6378', fontSize: 10 }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(215,255,79,0.2)' }} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#D7FF4F"
              strokeWidth={2}
              fill="url(#portfolioGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#D7FF4F', stroke: '#05070D', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/**
 * Asset allocation donut chart
 */
export function AllocationChart({ assets = [], className = '' }) {
  const chartData = useMemo(() => {
    const total = assets.reduce((s, a) => s + (a.quantity || 0) * (a.coin?.currentPrice || 0), 0);
    return assets
      .map((a) => ({
        name: a.coin?.symbol?.toUpperCase() || '?',
        value: (a.quantity || 0) * (a.coin?.currentPrice || 0),
        pct: total > 0 ? (((a.quantity || 0) * (a.coin?.currentPrice || 0)) / total) * 100 : 0,
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [assets]);

  const totalValue = chartData.reduce((s, d) => s + d.value, 0);

  if (!chartData.length) return null;

  return (
    <div className={`rounded-2xl glass-card p-5 sm:p-6 ${className}`}>
      <div className="font-display text-sm font-semibold text-ink mb-4">Asset Allocation</div>
      <div className="flex items-center gap-6">
        <div className="w-32 h-32 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={56}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          {chartData.slice(0, 5).map((d, i) => (
            <div key={d.name} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                <span className="text-xs text-ink truncate">{d.name}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-ink-muted">{d.pct.toFixed(1)}%</span>
              </div>
            </div>
          ))}
          {chartData.length > 5 && (
            <p className="text-[10px] text-ink-faint">
              +{chartData.length - 5} more
            </p>
          )}
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-white/[0.06] text-center">
        <span className="text-xs text-ink-faint">Total</span>
        <div className="font-display text-lg font-semibold text-ink">
          {formatCurrency(totalValue)}
        </div>
      </div>
    </div>
  );
}

/**
 * Performance metrics card
 */
export function PerformanceCard({ assets = [], className = '' }) {
  const stats = useMemo(() => {
    const totalValue = assets.reduce((s, a) => s + (a.quantity || 0) * (a.coin?.currentPrice || 0), 0);
    const totalCost = assets.reduce((s, a) => s + (a.quantity || 0) * (a.buyPrice || 0), 0);
    const totalPnl = totalValue - totalCost;
    const returnPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

    let bestAsset = null;
    let worstAsset = null;
    let bestReturn = -Infinity;
    let worstReturn = Infinity;

    assets.forEach((a) => {
      if (!a.buyPrice || !a.coin?.currentPrice) return;
      const ret = ((a.coin.currentPrice - a.buyPrice) / a.buyPrice) * 100;
      if (ret > bestReturn) { bestReturn = ret; bestAsset = a; }
      if (ret < worstReturn) { worstReturn = ret; worstAsset = a; }
    });

    return { totalValue, totalCost, totalPnl, returnPct, bestAsset, bestReturn, worstAsset, worstReturn };
  }, [assets]);

  return (
    <div className={`rounded-2xl glass-card p-5 sm:p-6 ${className}`}>
      <div className="font-display text-sm font-semibold text-ink mb-4">Performance</div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink-faint">Total P&L</span>
          <span className={`text-sm font-mono font-semibold flex items-center gap-1 ${stats.totalPnl >= 0 ? 'text-mint' : 'text-carmine'}`}>
            {stats.totalPnl >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {formatCurrency(Math.abs(stats.totalPnl))}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink-faint">Return</span>
          <span className={`text-sm font-mono font-semibold ${stats.returnPct >= 0 ? 'text-mint' : 'text-carmine'}`}>
            {formatPercent(stats.returnPct)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink-faint">Total Invested</span>
          <span className="text-sm font-mono text-ink-muted">{formatCurrency(stats.totalCost)}</span>
        </div>
        {stats.bestAsset && (
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
            <span className="text-xs text-ink-faint">Best performer</span>
            <span className="text-xs font-mono text-mint">
              {stats.bestAsset.coin?.symbol?.toUpperCase()} ({formatPercent(stats.bestReturn)})
            </span>
          </div>
        )}
        {stats.worstAsset && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-faint">Worst performer</span>
            <span className="text-xs font-mono text-carmine">
              {stats.worstAsset.coin?.symbol?.toUpperCase()} ({formatPercent(stats.worstReturn)})
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
