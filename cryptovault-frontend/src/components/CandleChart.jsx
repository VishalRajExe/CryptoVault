import { useMemo, useState, useEffect, useRef } from 'react';
import { generateCandles } from '../utils/chartData';

/**
 * Renders a candlestick chart in SVG.
 * - If `data` (array of {open,high,low,close}) is provided, renders that real series.
 * - Otherwise falls back to a decorative animated random-walk series (used on
 *   the landing page / hero, where there's no coin context).
 */
export default function CandleChart({
  width = 480,
  height = 220,
  count = 44,
  color = '#D7FF4F',
  downColor = '#FF3B69',
  startPrice = 100,
  volatility = 0.02,
  animateNewCandle = true,
  data = null,
  className = '',
}) {
  const [candles, setCandles] = useState(() => generateCandles(count, startPrice, volatility));
  const lastPrice = useRef(startPrice);

  useEffect(() => {
    if (data || !animateNewCandle) return;
    const id = setInterval(() => {
      setCandles((prev) => {
        const open = prev[prev.length - 1].close;
        const drift = (Math.random() - 0.46) * volatility * open;
        const close = Math.max(open + drift, 0.0001);
        const high = Math.max(open, close) + Math.random() * volatility * open * 0.6;
        const low = Math.min(open, close) - Math.random() * volatility * open * 0.6;
        const next = [...prev.slice(1), { open, close, high, low: Math.max(low, 0.0001), i: prev[prev.length - 1].i + 1 }];
        lastPrice.current = close;
        return next;
      });
    }, 1400);
    return () => clearInterval(id);
  }, [animateNewCandle, volatility, data]);

  const { bars, min, max } = useMemo(() => {
    const source = data && data.length ? data.map((c, i) => ({ ...c, i })) : candles;
    if (!source.length) return { bars: [], min: 0, max: 1 };
    const min = Math.min(...source.map((c) => c.low));
    const max = Math.max(...source.map((c) => c.high));
    return { bars: source, min, max };
  }, [data, candles]);

  if (!bars.length) return null;

  const padY = (max - min) * 0.12 || 1;
  const yMin = min - padY;
  const yMax = max + padY;
  const scaleY = (v) => height - ((v - yMin) / (yMax - yMin || 1)) * height;
  const slotW = width / bars.length;
  const bodyW = Math.max(slotW * 0.5, 2);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      className={className}
      preserveAspectRatio="none"
      role="img"
      aria-label="Candlestick market chart"
    >
      <defs>
        <linearGradient id="cv-fade-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.08" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {bars.map((c, idx) => {
        const up = c.close >= c.open;
        const x = idx * slotW + slotW / 2;
        const fill = up ? color : downColor;
        return (
          <g key={c.i ?? idx} style={{ transition: 'opacity 0.3s ease' }}>
            <line
              x1={x}
              x2={x}
              y1={scaleY(c.high)}
              y2={scaleY(c.low)}
              stroke={fill}
              strokeWidth={1}
              opacity={0.85}
            />
            <rect
              x={x - bodyW / 2}
              y={Math.min(scaleY(c.open), scaleY(c.close))}
              width={bodyW}
              height={Math.max(Math.abs(scaleY(c.open) - scaleY(c.close)), 1.5)}
              fill={fill}
              opacity={0.95}
              rx={1}
            />
          </g>
        );
      })}
    </svg>
  );
}
