import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, ColorType, CrosshairMode } from 'lightweight-charts';

const TIME_RANGES = [
  { label: '1D', days: 1 },
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '1Y', days: 365 },
];

const CHART_TYPES = [
  { key: 'candlestick', label: 'Candle' },
  { key: 'area', label: 'Area' },
  { key: 'line', label: 'Line' },
];

/**
 * Full-featured interactive chart using TradingView's lightweight-charts.
 * Supports candlestick, area, and line types with time range controls.
 *
 * @param {Object} props
 * @param {Array} props.data - Array of { time, open, high, low, close, value } (time as unix seconds or 'YYYY-MM-DD')
 * @param {number} props.height - Chart height in px
 * @param {Function} props.onRangeChange - Called with days when user picks a time range
 * @param {string} props.defaultType - 'candlestick' | 'area' | 'line'
 * @param {number} props.selectedRange - Currently selected days
 */
export default function InteractiveChart({
  data = [],
  height = 340,
  onRangeChange,
  defaultType = 'area',
  selectedRange = 7,
  loading = false,
  className = '',
  hideTimeRanges = false,
  timeVisible = false,
}) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const [chartType, setChartType] = useState(defaultType);
  const [crosshairData, setCrosshairData] = useState(null);

  const createChartInstance = useCallback(() => {
    if (!containerRef.current) return;

    // Clean up previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#5B6378',
        fontFamily: '"Inter", sans-serif',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.03)' },
        horzLines: { color: 'rgba(255,255,255,0.03)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(215,255,79,0.3)',
          width: 1,
          style: 2,
          labelBackgroundColor: '#121826',
        },
        horzLine: {
          color: 'rgba(215,255,79,0.3)',
          width: 1,
          style: 2,
          labelBackgroundColor: '#121826',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.06)',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.06)',
        timeVisible: timeVisible || selectedRange <= 1,
        secondsVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      handleScroll: { vertTouchDrag: false },
    });

    chartRef.current = chart;

    // Add series based on chart type
    let series;
    if (chartType === 'candlestick') {
      series = chart.addCandlestickSeries({
        upColor: '#D7FF4F',
        downColor: '#FF3B69',
        borderUpColor: '#D7FF4F',
        borderDownColor: '#FF3B69',
        wickUpColor: 'rgba(215,255,79,0.6)',
        wickDownColor: 'rgba(255,59,105,0.6)',
      });
    } else if (chartType === 'area') {
      // Fix for addAreaSeries not being a function in some versions
      if (chart && typeof chart.addAreaSeries === 'function') {
        series = chart.addAreaSeries({
          lineColor: '#D7FF4F',
          topColor: 'rgba(215,255,79,0.25)',
          bottomColor: 'rgba(215,255,79,0.01)',
          lineWidth: 2,
          crosshairMarkerRadius: 5,
          crosshairMarkerBorderColor: '#D7FF4F',
          crosshairMarkerBackgroundColor: '#05070D',
        });
      } else {
        // Fallback to line series if addAreaSeries is not available
        console.warn('addAreaSeries not available, falling back to line series');
        series = chart.addLineSeries({
          color: '#D7FF4F',
          lineWidth: 2,
          crosshairMarkerRadius: 5,
          crosshairMarkerBorderColor: '#D7FF4F',
          crosshairMarkerBackgroundColor: '#05070D',
        });
      }
    } else {
      series = chart.addLineSeries({
        color: '#D7FF4F',
        lineWidth: 2,
        crosshairMarkerRadius: 5,
        crosshairMarkerBorderColor: '#D7FF4F',
        crosshairMarkerBackgroundColor: '#05070D',
      });
    }

    seriesRef.current = series;

    // Crosshair move handler
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData.size) {
        setCrosshairData(null);
        return;
      }
      const d = param.seriesData.get(series);
      if (d) {
        setCrosshairData({
          time: param.time,
          value: d.close ?? d.value ?? 0,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        });
      }
    });

    // Resize handler
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [chartType, height, selectedRange]);

  // Create chart
  useEffect(() => {
    const cleanup = createChartInstance();
    return () => {
      cleanup?.();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [createChartInstance]);

  // Update data
  useEffect(() => {
    if (!seriesRef.current || !data.length) return;

    const formatted = data.map((d) => {
      if (chartType === 'candlestick') {
        return { time: d.time, open: d.open, high: d.high, low: d.low, close: d.close };
      }
      return { time: d.time, value: d.close ?? d.value ?? 0 };
    });

    seriesRef.current.setData(formatted);
    chartRef.current?.timeScale().fitContent();

    // Live simulation
    let lastPoint = { ...formatted[formatted.length - 1] };
    const volatility = 0.0015; // Slightly higher volatility for dramatic effect
    let tickCount = 0;
    
    // Estimate candle spacing
    const timeSpacing = formatted.length > 1 
      ? formatted[formatted.length - 1].time - formatted[formatted.length - 2].time 
      : 3600;

    const interval = setInterval(() => {
      if (!seriesRef.current) return;
      tickCount++;

      const val = lastPoint.close ?? lastPoint.value;
      const newClose = val * (1 + (Math.random() - 0.5) * volatility);

      if (tickCount % 4 === 0) {
        // Form a new candle every 4 ticks
        lastPoint = {
          time: lastPoint.time + timeSpacing,
          open: lastPoint.close ?? val,
          high: Math.max(lastPoint.close ?? val, newClose),
          low: Math.min(lastPoint.close ?? val, newClose),
          close: newClose,
          value: newClose
        };
      } else {
        // Wiggle the current candle
        if (chartType === 'candlestick') {
          lastPoint = {
            ...lastPoint,
            close: newClose,
            high: Math.max(lastPoint.high, newClose),
            low: Math.min(lastPoint.low, newClose),
          };
        } else {
          lastPoint = {
            ...lastPoint,
            value: newClose,
            close: newClose
          };
        }
      }
      
      seriesRef.current.update(lastPoint);
    }, 1000);

    return () => clearInterval(interval);
  }, [data, chartType]);

  const formatPrice = (v) => {
    if (v == null) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: v < 1 ? 6 : 2 }).format(v);
  };

  return (
    <div className={`rounded-2xl glass-card overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          {/* Chart type toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-void-900/60 p-0.5">
            {CHART_TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => setChartType(t.key)}
                className={`px-2.5 py-1.5 rounded-md text-[11px] font-display font-semibold transition-all ${
                  chartType === t.key
                    ? 'bg-mint text-void shadow-mint-sm'
                    : 'text-ink-faint hover:text-ink'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Crosshair info */}
          {crosshairData && (
            <div className="hidden sm:flex items-center gap-3 text-xs font-mono">
              {crosshairData.open != null && (
                <>
                  <span className="text-ink-faint">O <span className="text-ink">{formatPrice(crosshairData.open)}</span></span>
                  <span className="text-ink-faint">H <span className="text-ink">{formatPrice(crosshairData.high)}</span></span>
                  <span className="text-ink-faint">L <span className="text-ink">{formatPrice(crosshairData.low)}</span></span>
                  <span className="text-ink-faint">C <span className="text-ink">{formatPrice(crosshairData.close)}</span></span>
                </>
              )}
              {crosshairData.open == null && (
                <span className="text-mint font-medium">{formatPrice(crosshairData.value)}</span>
              )}
            </div>
          )}
        </div>

        {/* Time range */}
        {!hideTimeRanges && (
          <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-void-900/60 p-0.5">
            {TIME_RANGES.map((r) => (
              <button
                key={r.label}
                onClick={() => onRangeChange?.(r.days)}
                className={`px-2.5 py-1.5 rounded-md text-[11px] font-display font-semibold transition-all ${
                  selectedRange === r.days
                    ? 'bg-white/[0.08] text-ink'
                    : 'text-ink-faint hover:text-ink'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chart area */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-void-800/80 backdrop-blur-sm">
            <div className="w-8 h-8 border-2 border-mint/20 border-t-mint rounded-full animate-spin" />
          </div>
        )}
        <div ref={containerRef} className="w-full" style={{ height }} />
      </div>
    </div>
  );
}