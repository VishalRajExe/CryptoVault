import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ReplayProvider } from './context/ReplayContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

import Landing from './pages/Landing';
import Auth from './pages/Auth';
import OAuthSuccess from './pages/OAuthSuccess';
import WalletCallback from './pages/WalletCallback';
import TermsAndConditions from './pages/TermsAndConditions';
import FAQ from './pages/FAQ';


import DashboardLayout from './pages/dashboard/DashboardLayout';
import Overview from './pages/dashboard/Overview';
import Markets from './pages/dashboard/Markets';
import Portfolio from './pages/dashboard/Portfolio';
import Orders from './pages/dashboard/Orders';
import Watchlist from './pages/dashboard/Watchlist';
import WalletPage from './pages/dashboard/Wallet';
import Security from './pages/dashboard/Security';

import AdminLayout from './pages/admin/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import AdminUsers from './pages/admin/AdminUsers';
import AdminOrders from './pages/admin/AdminOrders';
import AdminWallets from './pages/admin/AdminWallets';
import AdminWithdrawals from './pages/admin/AdminWithdrawals';
import AdminActivity from './pages/admin/AdminActivity';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ReplayProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/oauth/success" element={<OAuthSuccess />} />
              <Route path="/terms" element={<TermsAndConditions />} />
              <Route path="/faq" element={<FAQ />} />


              {/* Top-level: must match Razorpay's hardcoded-by-config callback_url
                  exactly (PaymentServiceImpl: {FRONTEND_URL}/wallet/{orderId}) */}
              <Route
                path="/wallet/:orderId"
                element={
                  <ProtectedRoute>
                    <WalletCallback />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Overview />} />
                <Route path="markets" element={<Markets />} />
                <Route path="portfolio" element={<Portfolio />} />
                <Route path="orders" element={<Orders />} />
                <Route path="watchlist" element={<Watchlist />} />
                <Route path="wallet" element={<WalletPage />} />
                <Route path="security" element={<Security />} />

                <Route
                  path="admin"
                  element={
                    <AdminRoute>
                      <AdminLayout />
                    </AdminRoute>
                  }
                >
                  <Route index element={<AdminOverview />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="wallets" element={<AdminWallets />} />
                  <Route path="withdrawals" element={<AdminWithdrawals />} />
                  <Route path="activity" element={<AdminActivity />} />
                </Route>
              </Route>

              <Route path="*" element={<Landing />} />
            </Routes>
          </BrowserRouter>
        </ReplayProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
