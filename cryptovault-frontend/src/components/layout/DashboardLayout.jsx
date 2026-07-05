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
  Moon,
  Sun,
  LayoutDashboard,
  BarChart3,
  PieChart,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../../components/NotificationBell';
import ChatWidget from '../../components/ChatWidget';
import AgeConfirmation from '../../components/AgeConfirmation';
import ThemeToggle from '../../components/ThemeToggle';
import UserProfileDropdown from '../../components/UserProfileDropdown';
import { SearchBar } from '../../components/SearchBar';
import { useLocalStorage } from '../../hooks/useLocalStorage';

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useLocalStorage('darkMode', true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'ROLE_ADMIN';

  // Toggle dark mode
  const toggleDarkMode = () => setDarkMode(!darkMode);

  // Apply dark mode class to root element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode Toggle
  const toggleDarkMode = () => setDarkMode(!darkMode);

  // Apply dark mode class to root element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Admin routing restriction
  useEffect(() => {
    if (isAdmin && !location.pathname.startsWith('/app/admin') && location.pathname !== '/app/security') {
      navigate('/app/admin', { replace: true });
    }
    if (!isAdmin && location.pathname.startsWith('/app/admin')) {
      navigate('/app', { replace: true });
    }
  }, [isAdmin, location.pathname, navigate]);

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

  const userNavItems = [
    { to: '/app', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/app/markets', label: 'Markets', icon: BarChart3 },
    { to: '/app/portfolio', label: 'Portfolio', icon: PieChart },
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-abyss-950 via-abyss-900 to-abyss-800 text-ink font-body flex">
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 transition-all duration-500 relative z-40 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <SidebarContent
          collapsed={collapsed}
          user={user}
          onLogout={handleLogout}
          navigate={navigate}
          isAdmin={isAdmin}
        />
        {/* Toggle Collapse Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3.5 top-5 w-8 h-8 rounded-full bg-abyss-800/50 backdrop-blur-md flex items-center justify-center text-ink/50 hover:text-ink hover:bg-abyss-700/50 transition-all duration-300 border border-abyss-600/20 shadow-lg"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
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
              className="absolute inset-0 bg-abyss-950/80 backdrop-blur-lg"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', stiffness: 350, damping: 35 }}
              className="absolute left-0 top-0 bottom-0 w-64 z-50"
            >
              <SidebarContent
                onNavigate={() => setMobileOpen(false)}
                collapsed={false}
                user={user}
                onLogout={handleLogout}
                navigate={navigate}
                isAdmin={isAdmin}
              />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="h-16 shrink-0 border-b border-abyss-600/20 bg-abyss-950/80 backdrop-blur-lg flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden text-ink/60 p-2 -ml-2 rounded-xl hover:bg-abyss-600/20"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div className="hidden md:flex items-center gap-2 text-[11px] font-mono-tab text-ink/40 py-1 px-2.5 rounded-lg border border-abyss-600/20 bg-abyss-900/40">
              <span className="w-1.5 h-1.5 rounded-full bg-abyss-400/20 animate-pulse" />
              <span>DESK STATUS: OPTIMAL</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-mint font-mono-tab px-2.5 py-1.5 rounded-full bg-mint-900/20 border border-mint/20">
              <span className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse" />
              Live market feed
            </div>

            <div className="flex items-center gap-2">
              <SearchBar placeholder="Search assets, orders..." />
              <ThemeToggle
                darkMode={darkMode}
                onToggle={toggleDarkMode}
              />
              <UserProfileDropdown
                user={user}
                onLogout={handleLogout}
                initials={initials}
              />
              <NotificationBell />
            </div>
          </div>
        </header>

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      <ChatWidget />
      <AgeConfirmation />
    </div>
  );
}

function SidebarContent({ collapsed, user, onLogout, navigate, isAdmin }) {
  const userNavItems = [
    { to: '/app', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/app/markets', label: 'Markets', icon: BarChart3 },
    { to: '/app/portfolio', label: 'Portfolio', icon: PieChart },
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

  const navItems = isAdmin ? adminNavItems : userNavItems;

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  return (
    <div className="flex flex-col h-full bg-abyss-950/60 backdrop-blul-xl border-r border-abyss-600/10">
      {/* Brand logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-abyss-600/5">
        <span className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-mint to-violet flex items-center justify-center shrink-0 shadow-md">
          <svg viewBox="0 0 24 24" className="w-5 h-5 relative z-10" fill="none">
            <path d="M12 2L4 6v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V6l-8-4z" fill="#05070D" />
          </svg>
        </span>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0>
        </span>
      </div>
    );
}