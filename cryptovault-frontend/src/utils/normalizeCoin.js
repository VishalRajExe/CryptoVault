// The backend's `com.vishal.model.Coin` JPA entity is explicitly annotated with
// @JsonProperty("current_price"), @JsonProperty("price_change_percentage_24h"), etc.
// (see Coin.java) — so it serializes in CoinGecko's original snake_case shape on
// EVERY endpoint that returns a nested Coin, not just /coins. That includes:
//   - Watchlist.coins[]            (GET /api/watchlist/user)
//   - Asset.coin                   (GET /api/assets, nested inside orders, etc.)
//   - OrderItem.coin / Order.orderItem.coin
//
// Only the flat CoinGecko proxy endpoints (GET /coins, /coins/search, /coins/top50,
// /coins/trading) come back in pure snake_case with no possibility of camelCase.
// Everywhere a *nested* Coin object travels through one of our own JPA entities,
// it's still the same snake_case shape — there is no camelCase variant anywhere in
// this API. This helper just makes every read site resilient to either shape, so a
// future backend change (or a spot we missed) fails safe instead of rendering blank.
export function normalizeCoin(coin) {
  if (!coin) return null;
  return {
    id: coin.id,
    symbol: coin.symbol,
    name: coin.name,
    image: coin.image,
    currentPrice: coin.current_price ?? coin.currentPrice ?? 0,
    marketCap: coin.market_cap ?? coin.marketCap ?? 0,
    marketCapRank: coin.market_cap_rank ?? coin.marketCapRank ?? null,
    priceChangePercentage24h:
      coin.price_change_percentage_24h ?? coin.priceChangePercentage24h ?? null,
    high24h: coin.high_24h ?? coin.high24h ?? null,
    low24h: coin.low_24h ?? coin.low24h ?? null,
  };
}

export function parseMarketChart(data) {
  if (!data || !Array.isArray(data.prices)) return [];
  const prices = data.prices;
  const seenTimes = new Set();
  const result = [];
  for (let idx = 0; idx < prices.length; idx++) {
    const [timestamp, price] = prices[idx];
    const time = Math.floor(timestamp / 1000);
    if (seenTimes.has(time)) continue;
    seenTimes.add(time);
    const prevPrice = idx > 0 ? prices[idx - 1][1] : price * 0.998;
    const open = prevPrice;
    const close = price;
    const diff = Math.abs(open - close);
    const spread = price * 0.0015; // 0.15% spread for wicks
    const high = Math.max(open, close) + (diff * 0.15 + Math.random() * spread);
    const low = Math.max(Math.min(open, close) - (diff * 0.15 + Math.random() * spread), 0.0001);
    result.push({
      time,
      open,
      high,
      low,
      close,
      value: price,
    });
  }
  return result;
}

