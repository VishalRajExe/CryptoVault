# CryptoVault Backend — Rewrite & Bug-Fix Changelog

This backend was rewritten from package `com.zosh` → **`com.vishal`** (108 Java files,
including the Maven `groupId`) and went through a full bug-fixing pass. Nothing in the
public API surface (URLs, request/response shapes) changed — only internal package
names and the issues listed below.

> **Note on testing:** the build environment used to make these changes had no internet
> access to Maven Central, so changes could not be compiled/run here. Everything was
> reviewed manually and cross-checked (method signatures, imports, enum values, brace
> balance). Run `mvn clean compile` after extracting — see SETUP instructions in the
> chat for the full step-by-step.

## 🔴 Critical bugs (security / data integrity)

1. **No user ever had their role attached to their security session.**
   `CustomeUserServiceImplementation.loadUserByUsername()` always returned an *empty*
   authorities list. Every JWT (signup and login) was issued with no role claim,
   meaning role-based access control was completely non-functional.
   → Fixed to populate `ROLE_USER` / `ROLE_ADMIN` from the user record.

2. **Admin endpoints were open to any authenticated user.**
   `AppConfig`'s `.requestMatchers("/api/admin/**").hasRole("ADMIN")` was commented
   out. Combined with bug #1, this meant ANY logged-in user could approve/reject
   withdrawals and hit other admin-only routes.
   → Re-enabled, and now actually works because roles are populated correctly.

3. **Rejecting a withdrawal refunded the money to the *admin's* wallet**, not the
   user who requested it (`WithdrawalController.proceedWithdrawal`). A rejected
   withdrawal silently transferred the user's money to whichever admin clicked reject.
   → Now refunds the original requester's wallet.

4. **BUY orders had a broken insufficient-funds check.**
   `WalleteServiceImplementation.payOrderPayment` compared the balance *after*
   subtraction back against the order price (`newBalance.compareTo(order.getPrice())`)
   instead of checking the balance *before* spending it — nonsensical logic that could
   both reject affordable purchases and fail to block unaffordable ones.
   → Fixed to check `wallet.getBalance() >= order.getPrice()` up front.

5. **No protection against paying for the same order twice.** Two separate endpoints
   (`POST /api/orders/pay` and `PUT /api/wallet/order/{id}/pay`) could both debit/credit
   a wallet for the same order.
   → `payOrderPayment` now rejects already-`SUCCESS` orders.

6. **Negative wallet balances were possible.** The guard in `addBalanceToWallet` against
   the balance going below zero was commented out.
   → Re-enabled. Withdrawal requests are also now checked against the wallet's current
   balance *before* the withdrawal record is created.

7. **A successful Razorpay payment was never marked as paid in the database.**
   `PaymentServiceImpl.ProccedPaymentOrder` set the in-memory status to `SUCCESS` for a
   captured payment but never called `save()` — the order stayed `PENDING` in the DB
   forever, so the same `payment_id` could be replayed against
   `PUT /api/wallet/deposit` for a duplicate wallet credit.
   → Added the missing `save()` call. Also removed a redundant duplicate `save()` in
   the non-Razorpay branch.

8. **Checked exceptions didn't trigger transaction rollback.**
   `OrderServiceImplementation`'s `@Transactional` methods only rolled back on
   `RuntimeException` by default. Since `WalletException`/`Exception` are *checked*
   exceptions, a failed wallet debit (e.g. insufficient funds) left a `PENDING`
   Order + OrderItem permanently committed even though the trade never completed.
   → Added `rollbackOn = Exception.class` everywhere money/assets move.

9. **2FA OTPs were never invalidated after use**, making them replayable for the same
   login session indefinitely.
   → `AuthController.verifySigningOtp` now deletes the OTP record after success.

10. **`sellAsset` created Order/OrderItem rows *before* validating the user actually
    held enough of the asset**, leaving an orphaned `OrderItem` row (never deleted) on
    the failure path, plus a partially-applied `orderRepository.delete(order)` hack.
    → Quantity is now validated before any rows are created.

## 🟠 Functional bugs

11. **Zero-quantity trades were allowed.** `buyAsset` checked `quantity < 0` (should be
    `<= 0`); `sellAsset` had no quantity check at all.
12. **Wallet-to-wallet transfers accepted zero/negative amounts and self-transfers**,
    and only ever recorded a transaction for the sender, never the receiver.
13. **The AI chatbot's JSON requests were broken.**
    - `CoinDTO.toString()` (used to embed coin data into the Gemini request body) had
      a **trailing comma before the closing `}`**, producing invalid JSON on every
      single "tell me about coin X" chatbot request.
    - The user's raw prompt was concatenated directly into a hand-built JSON string
      with **no escaping** — any prompt containing a quote, backslash, or newline broke
      the request (and was a latent JSON-injection vector).
    - `makeApiRequest(...).toString()` was called without a null-check, risking an NPE
      whenever CoinGecko didn't recognize the coin name.
    → All three fixed (proper JSON escaping via `JSONObject.quote()`, no trailing
    comma, null-safe with a friendly error message).
14. **`gemini-pro` is a deprecated/removed Gemini model** (now returns 404). Updated to
    `gemini-2.5-flash`. *(Google rotates model names — re-check
    https://ai.google.dev/gemini-api/docs/models if this stops working.)*
15. **Google OAuth2 login did nothing.** The success handler in `AppConfig` built a
    `User` object and only printed it to the console — it was never saved and no JWT
    was ever issued, so "Sign in with Google" was silently non-functional end-to-end.
    → Now finds-or-creates the user, creates their watchlist if new, issues a real JWT,
    and redirects to `${app.frontend.url}/oauth/success?token=...`.
16. **Invalid/expired JWTs crashed with an unhandled 500** instead of a clean 401/403.
    `JwtTokenValidator` threw a raw `RuntimeException`, which escapes the servlet
    filter chain entirely (filters run before `@ControllerAdvice` ever sees anything).
    A malformed `Authorization` header (too short to safely call `.substring(7)` on)
    crashed even *before* reaching the try/catch.
    → Now fails safely: an invalid token just leaves the request unauthenticated, and
    Spring Security's normal rules return a clean 401/403 for protected routes.
17. **`WalletException`/`OrderException` always returned HTTP 500** instead of 400,
    because they extend the checked `Exception` class (not `RuntimeException`) and had
    no dedicated `@ExceptionHandler` in `GlobelExeptions`.

## 🟡 Build / config bugs

18. **The database config didn't match the project.** `application.properties` was
    wired to **SQL Server** (`SQLServerDriver` / `SQLServerDialect`) even though the
    project is built around **MySQL** (per the spec, and `mysql-connector-j` is already
    a dependency). → Switched to the MySQL driver/dialect; removed the now-redundant
    `mssql-jdbc` dependency.
19. **`spring-boot-maven-plugin` was never declared in `pom.xml`.** Spring Boot's
    parent POM only adds this plugin to `pluginManagement` — it does **not** attach the
    `repackage` goal automatically. Without declaring it explicitly, `mvn package`
    would have produced a "thin" jar with no bundled dependencies and no executable-jar
    launcher in the manifest, so `java -jar app.jar` would fail immediately with
    `NoClassDefFoundError`. This would have silently broken the Dockerfile build too.
20. **Conflicting Java versions.** `java.version=17` but `maven.compiler.source/target`
    were set to `19` — the compiler properties win, so the project actually required
    JDK 19+ to compile while the Dockerfile uses JDK 17 images, breaking
    `docker build` outright. → Standardized on 17 everywhere.
21. **`Dockerfile` exposed the wrong port** (`8080` vs the actual `server.port=5454`).
22. **Two classes directly imported a package never declared as a Maven dependency**:
    `org.antlr.v4.runtime.misc.NotNull` in `Wallet.java` (unused, only compiled by
    accident via Hibernate's transitive ANTLR dependency) and `org.json.*` in
    `PaymentServiceImpl`/`ChatBotServiceImpl` (only worked via razorpay-java's
    transitive dependency). → Removed the unused antlr import; added `org.json:json`
    as an explicit dependency so it doesn't silently break if a transitive dependency
    chain ever changes.
23. **Unrelated desktop-Swing import** (`javax.swing.text.html.Option`) accidentally
    left in `VerificationServiceImpl.java` — removed.
24. **The seeded admin account never got a watchlist created for it** (unlike normal
    signup), so the first `GET /api/watchlist` call as admin would fail. Also rebranded
    the seed admin away from the original demo's identity
    (`codewithzosh@gmail.com` → `admin@vishal.com` / password `Admin@123` — **change
    this password after first login**).

## Update — "treading" → "trading" rename + env var placeholder crash fix

- Fixed the `treading`/`Treading` spelling mistake everywhere it appeared: the main
  application class (`TreadingPlateformApplication` → `TradingPlateformApplication`),
  the test class, the `TreadingHistory` entity (unused/dead code, never wired to a
  repository — renamed anyway, but still not connected to anything), the
  `getTreadingCoins()`/`getTreadingCoin()` method names in `CoinService` /
  `CoinServiceImpl` / `CoinController` (the actual URL was already `/coins/trading`,
  so no API path changed), the welcome message in `HomeController`, and the
  `treading-plateform` artifact/application name in `pom.xml`, both
  `application.properties` files, and the `Dockerfile`'s jar filename.

- **Fixed the startup crash**: `Could not resolve placeholder 'GEMINI_API_KEY'`.
  This happened because `application.properties` was edited to use
  `${GEMINI_API_KEY}`-style placeholders, but the environment variable — while set at
  the OS level — wasn't actually visible to *the specific process* that launched
  Spring Boot (see the chat for the full explanation of why that happens on Windows
  with IDEs). Every secret-backed property now uses Spring's
  `${ENV_VAR:fallback-default}` syntax instead of a bare `${ENV_VAR}`, e.g.:
  ```properties
  gemini.api.key=${GEMINI_API_KEY:your_gemini_api_key}
  ```
  This means the app now **boots successfully even if none of these env vars are
  set** — it just falls back to an obviously-fake placeholder value, and only the
  specific feature backed by that key (mail, Stripe, Razorpay, CoinGecko, Gemini,
  Google OAuth2) won't work until you provide a real one. Database credentials work
  the same way now (`DB_URL` / `DB_USERNAME` / `DB_PASSWORD`, defaulting to
  `root` / `password` against `localhost:3306/crypto_trading_platform`).

- Removed `spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect`. Your own
  startup log flagged this: `HHH90000025: MySQLDialect does not need to be specified
  explicitly using 'hibernate.dialect' (remove the property setting and it will be
  selected by default)`. Hibernate 6 auto-detects it from the JDBC URL/driver now, so
  the explicit property was just dead weight producing a warning.


- `PUT /api/wallet/deposit/amount/{amount}` lets an authenticated user credit their own
  wallet directly with no real payment behind it. This looks like a deliberate
  dev/demo shortcut (there's a separate, real `PUT /api/wallet/deposit` flow that
  verifies a Razorpay/Stripe payment first) — flagging it here in case you want to
  remove or gate it before going anywhere near production.
- Endpoints like `GET /api/users/{userId}` and `GET /api/users/email/{email}` let any
  authenticated user look up another user's profile. The password is safe (the `User`
  entity marks it `@JsonProperty(access = WRITE_ONLY)`, so it never serializes to JSON
  regardless of which endpoint returns the object) but other profile fields are
  visible. This looks intentional (e.g. for "send to user by email" UX) rather than a
  bug, so it wasn't changed — worth a deliberate decision on your end.
- The hardcoded JWT signing secret in `JwtConstant.java`. Not a functional bug, but
  worth externalizing to `application.properties`/an env var before production.

## Update — fixed "invalid coin id" on every buy/sell order

25. **Almost every order placed straight from the Markets list failed with
    `invalid coin id`, even for valid, well-known coins like Bitcoin.**
    `CoinServiceImpl.findById(coinId)` — the lookup used by both
    `OrderController.payOrderPayment` and `WatchlistController.addItemToWatchlist` —
    only ever checked the local `coins` table via `coinRepository.findById(...)`. That
    table starts **empty** and was only ever populated as a side effect of
    `getCoinDetails(coinId)` being called for that *specific* coin (i.e. only after
    visiting a coin's dedicated detail page) — nothing in the buy/sell or
    add-to-watchlist flow ever calls that first. So any coin id straight from
    `GET /coins` (which talks to CoinGecko directly and never touches the local table)
    would fail to resolve.
    → `findById` now falls back to fetching the coin from CoinGecko and saving it
    (the same logic `getCoinDetails` already used, now shared via a private
    `fetchAndSaveCoinFromCoinGecko` helper instead of being duplicated) whenever the
    local lookup misses, then re-checks the local table. `getCoinDetails`'s public
    return value is unchanged — it still returns the exact raw CoinGecko response
    body. No method signatures, request/response shapes, or other endpoints changed.

## Update — admin panel, notifications/activity feed, mobile number, OTP & payment fixes

This round added two new modules from scratch (there was no existing
implementation to fix) and patched several real bugs found via live testing.

### New: Notification / activity-feed system
- `model/Notification.java` was previously a plain `@Data` POJO with **no
  `@Entity` annotation and no repository** — defined but never actually used or
  persisted anywhere. It's now a real JPA entity with `NotificationRepository`,
  `NotificationService`/`NotificationServiceImpl`, and `NotificationController`
  (`GET /api/notifications`, `PATCH /api/notifications/mark-read`).
- Wired into every notable user action: signup, instant deposit, Razorpay/Stripe
  deposit completion, withdrawal request, withdrawal approve/decline, wallet
  transfer (**both** sender and receiver now get a notification — receivers
  previously had no record at all of money sent to them), and order placement.

### New: Admin module
- `AppConfig` already had `.requestMatchers("/api/admin/**").hasRole("ADMIN")`
  configured, but **zero `/api/admin/**` endpoints existed** until now (except
  withdrawal approve/decline in `WithdrawalController`, which already worked and
  was left untouched). Added `AdminController` + `AdminService`:
  - `GET /api/admin/users` — every user (passwords stripped, same guarantee the
    regular profile endpoint already gives)
  - `GET /api/admin/orders` — every order across every user
  - `GET /api/admin/wallets` — every wallet + owner + balance
  - `GET /api/admin/stats` — aggregate counts (users, orders, withdrawals,
    pending withdrawals, total wallet balance, total transactions)
  - `GET /api/admin/activity` — the full notification feed across all users
- `config/AdminConfig.java` — one hardcoded admin email
  (`vishalraj12.badal@gmail.com` per your request) is granted `ROLE_ADMIN` at
  signup (`AuthController.createUserHandler`) and as a self-healing safety net
  on every login (`CustomeUserServiceImplementation.loadUserByUsername`) for an
  account that already existed before this change. **Note:** JWTs bake the
  user's role in at sign-in time, so an already-logged-in session needs a fresh
  sign-in to pick up a new role.

### Bugfixes
26. **2FA / email-verification "I have to do it multiple times" bug.**
    `UserController.sendVerificationOTP` only created a new `VerificationCode`
    row **if none existed at all** — if one was already sitting in the database
    (from an earlier abandoned attempt, a wrong entry, etc) it silently reused
    that *stale* code instead of sending a fresh one, while the UI still said
    "code sent" either way. Now any existing code is deleted before a new one is
    generated, so every click genuinely sends and checks against a fresh OTP.
27. **Mobile number had no backend support at all** — the Security page's "Add
    phone number" was purely decorative. Added `UserService.updateMobile` and
    `PATCH /api/users/mobile`.
28. **Razorpay/Stripe redirect URLs were hardcoded to `http://localhost:5173`**
    in `PaymentServiceImpl`, duplicating (and able to silently diverge from)
    `app.frontend.url`, which `AppConfig` already reads from the same
    `FRONTEND_URL` env var for the Google OAuth redirect. Now reads
    `app.frontend.url` too, so deploying the frontend anywhere else only
    requires changing `FRONTEND_URL` once.
