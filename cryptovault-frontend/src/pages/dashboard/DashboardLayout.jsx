import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid,
  TrendingUp,
  Briefcase,
  ArrowLeftRight,
  Star,
  Wallet as WalletIcon,
  ShieldCheck,
  LogOut,
  Menu,
  Users,
  Banknote,
  Activity,
  ChevronLeft,
  ChevronRight,
  Search,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { sendVerificationOtp, verifyAccountOtp } from '../../api/auth';
import { Loader2, AlertTriangle } from 'lucide-react';
import NotificationBell from '../../components/NotificationBell';
import ChatWidget from '../../components/ChatWidget';
import AgeConfirmation from '../../components/AgeConfirmation';

const userNavItems = [
  { to: '/app', label: 'Overview', icon: LayoutGrid, end: true },
  { to: '/app/markets', label: 'Markets', icon: TrendingUp },
  { to: '/app/portfolio', label: 'Portfolio', icon: Briefcase },
  { to: '/app/orders', label: 'Orders', icon: ArrowLeftRight },
  { to: '/app/watchlist', label: 'Watchlist', icon: Star },
  { to: '/app/wallet', label: 'Wallet', icon: WalletIcon },
  { to: '/app/security', label: 'Security', icon: ShieldCheck },
];

const adminNavItems = [
  { to: '/app/admin', label: 'Overview', icon: LayoutGrid, end: true },
  { to: '/app/admin/users', label: 'Users', icon: Users },
  { to: '/app/admin/orders', label: 'Orders', icon: ArrowLeftRight },
  { to: '/app/admin/wallets', label: 'Wallets', icon: WalletIcon },
  { to: '/app/admin/withdrawals', label: 'Withdrawals', icon: Banknote },
  { to: '/app/admin/activity', label: 'Activity', icon: Activity },
];

function SidebarContent({ onNavigate, collapsed }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'ROLE_ADMIN';
  const navItems = isAdmin ? adminNavItems : userNavItems;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const initials = (user?.fullName || user?.email || 'U')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex flex-col h-full bg-void-900/60 backdrop-blur-xl">
      {/* Brand logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.04]">
        <span className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-mint to-violet flex items-center justify-center shrink-0 shadow-mint-sm">
          <svg viewBox="0 0 24 24" className="w-4 h-4 relative z-10" fill="none">
            <path d="M12 2L4 6v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V6l-8-4z" fill="#05070D" />
          </svg>
        </span>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-display text-base font-semibold tracking-tight text-ink"
          >
            CryptoVault
          </motion.span>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto scrollbar-none">
        {navItems.map((item) => {
          const isActive =
            item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={`group flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm transition-all duration-300 relative ${
                isActive
                  ? 'text-void font-semibold bg-mint shadow-mint'
                  : 'text-ink-muted hover:text-ink hover:bg-white/[0.04]'
              }`}
            >
              <item.icon
                size={17}
                className={`shrink-0 transition-transform group-hover:scale-105 duration-300 ${
                  isActive ? 'text-void' : 'text-ink-faint group-hover:text-ink'
                }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              {!collapsed && <span>{item.label}</span>}
              {isActive && !collapsed && (
                <motion.span
                  layoutId="activeSideIndicator"
                  className="absolute right-3 w-1.5 h-1.5 rounded-full bg-void"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User profile footer */}
      <div className="p-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] mb-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600/20 to-violet/20 border border-violet/20 text-violet-400 flex items-center justify-center font-display text-xs font-bold shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-ink truncate leading-tight">
                {user?.fullName || 'Trader'}
              </div>
              <div className="text-[10px] text-ink-faint truncate mt-0.5 font-mono">
                {isAdmin ? 'Administrator' : 'Verified desk'}
              </div>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm text-ink-muted hover:text-carmine hover:bg-carmine/10 transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut size={16} />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'ROLE_ADMIN';
  const isEmailVerified = !!(user?.isVerified || user?.verified);
  const isUnverified = !isEmailVerified;
  const { push } = useToast();
  const [resending, setResending] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const { refresh, setUser } = useAuth();

  const handleResendVerification = async () => {
    if (resending) return;
    setResending(true);
    try {
      await sendVerificationOtp('EMAIL');
      push('Verification email sent! Check your inbox.', 'success');
      setShowOtp(true);
    } catch (err) {
      push(err.friendlyMessage || err.response?.data?.message || 'Failed to send verification email.', 'error');
    } finally {
      setResending(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length < 4) return;
    setVerifying(true);
    try {
      const updatedUser = await verifyAccountOtp(otp);
      push('Email verified successfully!', 'success');
      if (updatedUser) {
        setUser(updatedUser);
      } else {
        setUser((prev) => (prev ? { ...prev, isVerified: true, verified: true, status: 'VERIFIED' } : prev));
      }
      await refresh();
      setShowOtp(false);
    } catch (err) {
      push(err.friendlyMessage || err.response?.data?.message || 'Invalid verification code.', 'error');
    } finally {
      setVerifying(false);
    }
  };

  // Admin routing restriction: Prevent access to user-side pages
  useEffect(() => {
    if (isAdmin && !location.pathname.startsWith('/app/admin') && location.pathname !== '/app/security') {
      navigate('/app/admin', { replace: true });
    }
    if (!isAdmin && location.pathname.startsWith('/app/admin')) {
      navigate('/app', { replace: true });
    }
  }, [isAdmin, location.pathname, navigate]);

  return (
    <div className="min-h-screen bg-void-950 text-ink font-body flex">
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 transition-all duration-300 relative z-40 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
        style={{ boxShadow: '1px 0 0 0 rgba(255,255,255,0.06)' }}
      >
        <SidebarContent collapsed={collapsed} />
        {/* Toggle Collapse Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3.5 top-[4.5rem] z-50 w-7 h-7 rounded-full bg-void-800 border border-white/10 flex items-center justify-center text-ink-muted hover:text-ink hover:border-white/20 transition-all shadow-md"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', stiffness: 350, damping: 35 }}
              className="absolute left-0 top-0 bottom-0 w-64 z-50"
            >
              <SidebarContent onNavigate={() => setMobileOpen(false)} collapsed={false} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="h-16 shrink-0 border-b border-white/[0.06] bg-[#101012]/85 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 sticky top-0 z-[50]">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-ink p-2 -ml-2 rounded-xl hover:bg-white/[0.05]"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            
            {/* Breadcrumb locator from reference UI */}
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-ink-muted">
              <span>Dashboards</span>
              <span className="opacity-30">/</span>
              <span className="text-ink font-semibold">
                {location.pathname === '/app' ? 'Overview' : location.pathname.split('/').pop().charAt(0).toUpperCase() + location.pathname.split('/').pop().slice(1)}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-[10px] font-mono-tab text-ink-faint py-1 px-2.5 rounded-lg border border-white/[0.05] bg-white/[0.02]">
              <span className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse-glow" />
              <span>DESK STATUS: STABLE</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:flex items-center gap-1.5 text-xs text-mint font-mono-tab px-2.5 py-1.5 rounded-full bg-mint-900/40 border border-mint/15">
              <span className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse-glow" />
              Live market feed
            </span>
            <NotificationBell />
          </div>
        </header>

        {isUnverified && (
          <div className="bg-carmine/10 border-b border-carmine/20 px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 text-carmine">
              <AlertTriangle size={18} className="shrink-0" />
              <p className="text-sm">
                <span className="font-semibold">Action required:</span> Please verify your email to unlock trading, deposits, and full account access.
              </p>
            </div>
            
            {showOtp ? (
              <form onSubmit={handleVerifyOtp} className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-24 rounded-lg border border-carmine/30 bg-carmine/5 px-2.5 py-1.5 text-sm text-carmine placeholder:text-carmine/50 outline-none focus:border-carmine/60"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={verifying || otp.length < 4}
                  className="shrink-0 px-4 py-1.5 rounded-lg bg-carmine/20 text-carmine hover:bg-carmine/30 transition-colors text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
                >
                  {verifying && <Loader2 size={12} className="animate-spin" />}
                  Verify
                </button>
              </form>
            ) : (
              <button
                onClick={handleResendVerification}
                disabled={resending}
                className="shrink-0 px-4 py-1.5 rounded-lg bg-carmine/20 text-carmine hover:bg-carmine/30 transition-colors text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                {resending && <Loader2 size={12} className="animate-spin" />}
                Send Verification Code
              </button>
            )}
          </div>
        )}

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      <ChatWidget />
      <AgeConfirmation />
    </div>
  );
}

