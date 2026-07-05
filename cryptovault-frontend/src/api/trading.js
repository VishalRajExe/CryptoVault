import client from './client';

// ---- Wallet (WalletController) ----
export const getWallet = () => client.get('/api/wallet').then((r) => r.data);

export const getWalletTransactions = () =>
  client.get('/api/wallet/transactions').then((r) => r.data);

export const depositMoney = (amount) =>
  client.put(`/api/wallet/deposit/amount/${amount}`).then((r) => r.data);

export const transferToWallet = (walletId, payload) =>
  // payload: { amount, purpose }
  client.put(`/api/wallet/${walletId}/transfer`, payload).then((r) => r.data);

export const payOrder = (orderId) =>
  client.put(`/api/wallet/order/${orderId}/pay`).then((r) => r.data);

// ---- Assets / Portfolio (AssetController) ----
export const getUserAssets = () => client.get('/api/assets').then((r) => r.data);

export const getAssetByCoin = (coinId) =>
  client.get(`/api/assets/coin/${coinId}/user`).then((r) => r.data);

export const getAssetById = (assetId) =>
  client.get(`/api/assets/${assetId}`).then((r) => r.data);

// ---- Orders (OrderController) ----
export const placeOrder = (payload) =>
  // payload: { coinId, quantity, orderType: 'BUY' | 'SELL' }
  client.post('/api/orders/pay', payload).then((r) => r.data);

export const getOrderById = (orderId) =>
  client.get(`/api/orders/${orderId}`).then((r) => r.data);

export const getAllOrders = (orderType, assetSymbol) =>
  client
    .get('/api/orders', { params: { order_type: orderType, asset_symbol: assetSymbol } })
    .then((r) => r.data);

// ---- Watchlist (WatchlistController) ----
export const getUserWatchlist = () => client.get('/api/watchlist/user').then((r) => r.data);

export const addToWatchlist = (coinId) =>
  client.patch(`/api/watchlist/add/coin/${coinId}`).then((r) => r.data);

// ---- Withdrawal (WithdrawalController) ----
export const requestWithdrawal = (amount) =>
  client.post(`/api/withdrawal/${amount}`).then((r) => r.data);

export const getWithdrawalHistory = () =>
  client.get('/api/withdrawal').then((r) => r.data);


// ---- Payment details (PaymentDetailsController) ----
export const getPaymentDetails = () => client.get('/api/payment-details').then((r) => r.data);

export const addPaymentDetails = (payload) =>
  // payload: { accountNumber, accountHolderName, ifsc, bankName }
  client.post('/api/payment-details', payload).then((r) => r.data);
