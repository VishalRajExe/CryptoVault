import client from './client';

// Maps 1:1 to com.vishal.controller.AdminController and the admin-only
// endpoints living in WithdrawalController. All of these require the caller's
// JWT to carry ROLE_ADMIN (enforced server-side by AppConfig's
// `.requestMatchers("/api/admin/**").hasRole("ADMIN")` rule) - a non-admin
// token gets a 403 from every one of these.

export const getAllUsers = () => client.get('/api/admin/users').then((r) => r.data);

export const getAllOrders = () => client.get('/api/admin/orders').then((r) => r.data);

export const getAllWallets = () => client.get('/api/admin/wallets').then((r) => r.data);

export const getAdminStats = () => client.get('/api/admin/stats').then((r) => r.data);

export const getAllActivity = () => client.get('/api/admin/activity').then((r) => r.data);

// Already existed on the backend (WithdrawalController) before this round of
// changes - just wiring the frontend up to it.
export const getAllWithdrawalRequests = () => client.get('/api/admin/withdrawal').then((r) => r.data);

export const proceedWithdrawal = (id, accept) =>
  client.patch(`/api/admin/withdrawal/${id}/proceed/${accept}`).then((r) => r.data);
