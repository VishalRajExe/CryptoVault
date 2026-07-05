# CryptoVault — Frontend

A premium, animated React frontend built for the **CryptoVault** Spring Boot backend
(`com.vishal` — JWT auth, wallet, orders, assets, watchlist, withdrawals).

## Stack

- **React 19** + **Vite**
- **React Router v7** for routing
- **Tailwind CSS v3** for styling, with a custom design system (see `tailwind.config.js`)
- **Framer Motion** for page-load and scroll animations
- **Axios** for API calls, with a JWT-attaching interceptor
- **lucide-react** for icons
- Hand-rolled SVG candlestick / sparkline charts (no external charting lib needed)

No backend code was changed — this is a frontend-only deliverable that talks to your
existing Spring Boot API over HTTP.

## Getting started

```bash
npm install
cp .env.example .env   # point VITE_API_BASE_URL at your backend
npm run dev
```

The backend's `application.properties` sets `server.port=5454`, so the default
`.env.example` points to `http://localhost:5454`. Update it if you run the backend
elsewhere.

Also make sure the backend's CORS config (`AppConfig.corsConfigurationSource`) and
`app.frontend.url` include whatever origin Vite serves on (defaults to
`http://localhost:5173`).

### Build for production

```bash
npm run build
```

Output goes to `dist/`.

## Pages

| Route | Description |
|---|---|
| `/` | Marketing landing page — animated hero terminal, live ticker tape, features, security, FAQ |
| `/auth` | Side-by-side **Login / Registration** panel with a sliding pill toggle, 2FA step, and forgot-password flow. Use `?mode=login` or `?mode=register` |
| `/oauth/success` | Handles the redirect from the backend's Google OAuth success handler (`?token=...`) |
| `/app` | Protected dashboard shell (sidebar) — redirects to `/auth` if not signed in |
| `/app` (index) | Overview — wallet balance, portfolio value, holdings table, trending coins |
| `/app/markets` | Live coin list with search, pagination, watchlist star, and a Buy/Sell order modal |
| `/app/portfolio` | Full holdings table with P&L |
| `/app/orders` | Order history with BUY/SELL filter |
| `/app/watchlist` | Starred coins grid |
| `/app/wallet` | Deposit, withdraw, bank details, transaction ledger |
| `/app/security` | Email verification + two-factor authentication enablement |

## API mapping

Every call in `src/api/*.js` maps 1:1 to an existing backend endpoint — nothing was
invented beyond what `com.vishal.controller.*` already exposes:

- `src/api/auth.js` → `AuthController`, relevant parts of `UserController`
- `src/api/coins.js` → `CoinController`
- `src/api/trading.js` → `WalletController`, `AssetController`, `OrderController`,
  `WatchlistController`, `WithdrawalController`, `PaymentDetailsController`

The JWT returned by `/auth/signin` and `/auth/signup` is stored in `localStorage`
(`cv_jwt`) and attached as `Authorization: Bearer <token>` on every authenticated
request via the Axios interceptor in `src/api/client.js`.

## Design notes

- Palette: void-black background, mint-green (`#12FFAE`) as the primary/bullish
  accent, electric violet (`#7C5CFF`) as a secondary accent, carmine (`#FF3B69`) for
  bearish/destructive states.
- Type: Space Grotesk (display), Inter (body), JetBrains Mono (all prices, tickers,
  and tabular data).
- The hero's multi-pane terminal mock and the auth screen's live chart are
  decorative, randomly-generated candlestick animations (`src/utils/chartData.js`,
  `src/components/CandleChart.jsx`) — they do not call the backend. Everything inside
  `/app` calls real endpoints.

## Bugfix changelog

Fixes against the live backend, found via real-device testing. No visual/design
changes — only data correctness and error handling. The production CSS bundle hash
is identical before and after these fixes.

1. **Error messages showed a raw `uri=/api/orders/pay` string instead of the real
   reason (e.g. "Insufficient wallet balance").**
   Root cause: `com.vishal.exception.GlobelExeptions` builds `ErrorDetails` as
   `new ErrorDetails(ex.getMessage(), req.getDescription(false), now)`, but the
   `ErrorDetails` class declares its fields as `(error, message, timestamp)` — so the
   human-readable message actually lands in the `error` JSON field, and the request
   URI lands in `message`. `src/api/client.js` was reading `message` first. Fixed to
   read `error` first, with a `uri=` pattern guard as a final safety net so a raw URI
   string can never reach the UI even if the backend's field mapping changes again.

2. **Coin prices/24h-change showed blank or `—` on the Watchlist, Portfolio, and
   Overview pages** (or rendered an apparently "empty" card). Root cause:
   `com.vishal.model.Coin` is explicitly annotated `@JsonProperty("current_price")`,
   `@JsonProperty("price_change_percentage_24h")`, etc. — so *every* endpoint that
   returns a nested `Coin` (via `Watchlist.coins[]`, `Asset.coin`,
   `OrderItem.coin`) serializes in snake_case, identical to the raw CoinGecko shape
   used elsewhere. The Watchlist/Portfolio/Overview pages were reading camelCase
   (`currentPrice`, `priceChangePercentage24h`). Added `src/utils/normalizeCoin.js`
   and applied it at every fetch site that consumes a nested `Coin` object.

3. **Hardened all four "write" modals** (place order, deposit, withdraw, add bank
   details) against double-submission with a `useRef` guard in addition to the
   existing `loading`-state button disable, since a backend rejection (e.g.
   insufficient funds) with an unclear error message could otherwise invite repeated
   clicks.

## New features (admin panel, notifications, payments, chat)

### Admin panel — `/app/admin`
Only visible/reachable if the signed-in user's `role` is `ROLE_ADMIN` (gated by
`AdminRoute`). The backend independently enforces this on every `/api/admin/**`
call regardless of what the frontend shows. One admin email is hardcoded on the
backend — see `BUGFIXES_AND_CHANGES.md` for which one and how to change it.
Pages: Overview (platform stats), Users, Orders, Wallets, Withdrawals
(approve/decline pending requests), Activity (full "who did what" feed).

### Notifications
The bell icon in the dashboard header (`src/components/NotificationBell.jsx`)
polls `GET /api/notifications` every 30s and shows a dropdown of your own
activity — deposits, withdrawals, transfers, orders, sign-up. Opening it marks
everything read via `PATCH /api/notifications/mark-read`.

### Razorpay deposits
The Deposit modal on the Wallet page now offers "Instant (demo)" (the original
one-call credit, unchanged) or "Razorpay", which redirects to a real Razorpay
hosted checkout. After payment, Razorpay redirects back to `/wallet/:orderId`
(a **top-level** route, not under `/app` — see the comment in
`src/pages/WalletCallback.jsx` for why), which verifies the payment and credits
the wallet. Needs `razorpay.api.key` / `razorpay.api.secret` configured on the
backend to actually work.

### Wallet-to-wallet transfer
The "Transfer" button on the Wallet page sends funds using the real backend
mechanism: a wallet's numeric primary key (`PUT /api/wallet/{walletId}/transfer`),
not a custom code. The modal shows your own wallet ID so you can share it with
whoever wants to send you money.

### Chat assistant
A floating chat bubble (`src/components/ChatWidget.jsx`, bottom-right on every
dashboard page) wired to `POST /chat/bot`. Needs `gemini.api.key` configured on
the backend.

### Markets — Top 50 + sorting
The Markets page now has a "Live list / Top 50" toggle (`GET /coins/top50`) and
every numeric column header (Rank, Price, 24h, Market cap) is clickable to sort
ascending/descending.

### Removed: fake search bar in the dashboard header
The "Search coins…" box that used to appear in the header on *every* dashboard
page never actually searched anything. It's been removed from the shared layout
— the real, working coin search lives only on the Markets page, where it always
belonged.
