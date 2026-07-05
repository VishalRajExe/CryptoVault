// Generates a plausible random-walk candlestick series for decorative /
// placeholder visuals (hero animation, auth panel chart) — not real market data.

export function generateCandles(count = 60, startPrice = 100, volatility = 0.018) {
  const candles = [];
  let price = startPrice;
  for (let i = 0; i < count; i++) {
    const open = price;
    const drift = (Math.random() - 0.47) * volatility * price;
    const close = Math.max(open + drift, 0.0001);
    const high = Math.max(open, close) + Math.random() * volatility * price * 0.6;
    const low = Math.min(open, close) - Math.random() * volatility * price * 0.6;
    candles.push({ open, close, high, low: Math.max(low, 0.0001), i });
    price = close;
  }
  return candles;
}

export function formatCurrency(value, currency = 'USD', maximumFractionDigits = 2) {
  if (value === undefined || value === null || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits,
  }).format(value);
}

export function formatCompactNumber(value) {
  if (value === undefined || value === null || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(
    value
  );
}

export function formatPercent(value) {
  if (value === undefined || value === null || Number.isNaN(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}
