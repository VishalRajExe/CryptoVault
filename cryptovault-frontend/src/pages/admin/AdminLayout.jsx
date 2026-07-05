import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  LayoutGrid,
  Users,
  ArrowLeftRight,
  Wallet as WalletIcon,
  Banknote,
  Activity,
  ArrowLeft,
} from 'lucide-react';

const navItems = [
  { to: '/app/admin', label: 'Overview', icon: LayoutGrid, end: true },
  { to: '/app/admin/users', label: 'Users', icon: Users },
  { to: '/app/admin/orders', label: 'Orders', icon: ArrowLeftRight },
  { to: '/app/admin/wallets', label: 'Wallets', icon: WalletIcon },
  { to: '/app/admin/withdrawals', label: 'Withdrawals', icon: Banknote },
  { to: '/app/admin/activity', label: 'Activity', icon: Activity },
];

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-void-950">
      <div className="border-b border-violet/20 bg-violet-600/[0.06]">
        <div className="px-4 sm:px-8 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-full bg-violet-600/20 text-violet-400 text-[11px] font-mono-tab font-semibold tracking-wide uppercase">
              Admin
            </span>
            <h1 className="font-display text-lg font-semibold text-ink">Platform control</h1>
          </div>
          <Link
            to="/app"
            className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition-colors"
          >
            <ArrowLeft size={13} /> Back to trading desk
          </Link>
        </div>
        <nav className="px-4 sm:px-8 flex items-center gap-1 overflow-x-auto pb-px">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-violet-400 text-ink'
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`
              }
            >
              <item.icon size={15} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <Outlet />
    </div>
  );
}
