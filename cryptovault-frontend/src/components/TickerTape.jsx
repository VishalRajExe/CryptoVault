import { useMemo, useState, useEffect } from 'react';

const SEED = [
  { sym: 'BTC', name: 'Bitcoin', price: 66870.95 },
  { sym: 'ETH', name: 'Ethereum', price: 3482.11 },
  { sym: 'SOL', name: 'Solana', price: 168.42 },
  { sym: 'XRP', name: 'XRP', price: 0.612 },
  { sym: 'ADA', name: 'Cardano', price: 0.452 },
  { sym: 'AVAX', name: 'Avalanche', price: 38.27 },
  { sym: 'DOGE', name: 'Dogecoin', price: 0.158 },
  { sym: 'DOT', name: 'Polkadot', price: 6.84 },
  { sym: 'LINK', name: 'Chainlink', price: 17.93 },
  { sym: 'MATIC', name: 'Polygon', price: 0.721 },
];

function useLiveTicks(seed) {
  const [rows, setRows] = useState(() => seed.map((c) => ({ ...c, change: (Math.random() - 0.45) * 6 })));

  useEffect(() => {
    const id = setInterval(() => {
      setRows((prev) =>
        prev.map((c) => {
          const delta = (Math.random() - 0.48) * 0.004 * c.price;
          const price = Math.max(c.price + delta, 0.0001);
          const change = c.change + (Math.random() - 0.5) * 0.15;
          return { ...c, price, change };
        })
      );
    }, 1800);
    return () => clearInterval(id);
  }, []);

  return rows;
}

function TickerItem({ coin }) {
  const up = coin.change >= 0;
  const decimals = coin.price < 1 ? 4 : 2;
  return (
    <div className="flex items-center gap-2.5 px-6 whitespace-nowrap">
      <span className="font-display text-sm font-semibold text-ink">{coin.sym}</span>
      <span className="text-ink-faint text-xs hidden sm:inline">{coin.name}</span>
      <span className="font-mono-tab text-sm text-ink">${coin.price.toFixed(decimals)}</span>
      <span className={`font-mono-tab text-xs ${up ? 'text-mint' : 'text-carmine'}`}>
        {up ? '▲' : '▼'} {Math.abs(coin.change).toFixed(2)}%
      </span>
      <span className="text-void-600 mx-2">/</span>
    </div>
  );
}

export default function TickerTape() {
  const rows = useLiveTicks(SEED);
  const doubled = useMemo(() => [...rows, ...rows], [rows]);

  return (
    <div className="relative w-full overflow-hidden border-y border-white/[0.06] bg-void-900/70 backdrop-blur-sm py-3">
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-void-950 to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-void-950 to-transparent z-10" />
      <div className="flex animate-ticker w-max">
        {doubled.map((c, i) => (
          <TickerItem coin={c} key={`${c.sym}-${i}`} />
        ))}
      </div>
    </div>
  );
}
