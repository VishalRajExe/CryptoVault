import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  ArrowLeftRight,
  Banknote,
  Wallet as WalletIcon,
  Clock,
  Repeat,
  TrendingUp,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts';
import PageHeader from '../../components/PageHeader';
import { getAdminStats } from '../../api/admin';
import { formatCurrency, formatCompactNumber } from '../../utils/chartData';

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const ACCENTS = {
  mint: { text: 'text-void', bg: 'bg-mint', ring: 'shadow-mint-sm', hex: '#D7FF4F' },
  neutral: { text: 'text-ink', bg: 'bg-white/[0.06]', ring: '', hex: '#9A9A9E' },
  carmine: { text: 'text-carmine-400', bg: 'bg-carmine-900/30', ring: '', hex: '#FB7185' },
};

function StatCard({ icon: Icon, label, value, sub, accent = 'neutral' }) {
  const c = ACCENTS[accent] || ACCENTS.neutral;
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-white/[0.07] bg-void-800/60 p-6 relative overflow-hidden group transition-colors hover:border-white/[0.14]"
    >
      <div
        className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"
        style={{ background: c.hex }}
      />
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-4 relative ${c.bg} ${c.text} ${c.ring}`}>
        <Icon size={16} />
      </div>
      <div className="text-xs text-ink-faint uppercase tracking-wide font-mono-tab mb-1.5 relative">{label}</div>
      <div className="font-display text-2xl font-semibold text-ink relative">{value}</div>
      {sub && <div className="text-xs text-ink-muted mt-1 relative">{sub}</div>}
    </motion.div>
  );
}

function ChartCard({ title, children, className = '' }) {
  return (
    <motion.div
      variants={fadeUp}
      className={`rounded-2xl border border-white/[0.07] bg-void-800/60 p-6 ${className}`}
    >
      <div className="font-display text-sm font-semibold text-ink mb-4">{title}</div>
      {children}
    </motion.div>
  );
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-lg border border-white/10 bg-void-900/95 px-3 py-2 text-xs shadow-panel">
      <span className="text-ink-muted">{p.name}: </span>
      <span className="text-ink font-semibold font-mono-tab">{formatCompactNumber(p.value)}</span>
    </div>
  );
}

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch((e) => setError(e.friendlyMessage || 'Could not load platform stats.'))
      .finally(() => setLoading(false));
  }, []);

  const withdrawalDone = Math.max((stats?.totalWithdrawals || 0) - (stats?.pendingWithdrawals || 0), 0);
  const withdrawalComposition = stats
    ? [
        { name: 'Settled', value: withdrawalDone },
        { name: 'Pending', value: stats.pendingWithdrawals || 0 },
      ]
    : [];

  const activityComposition = stats
    ? [
        { name: 'Orders', value: stats.totalOrders || 0 },
        { name: 'Transactions', value: stats.totalTransactions || 0 },
      ]
    : [];

  const pendingRatio =
    stats && stats.totalWithdrawals
      ? Math.min(100, Math.round(((stats.pendingWithdrawals || 0) / stats.totalWithdrawals) * 100))
      : 0;

  return (
    <div className="pb-16">
      <PageHeader
        eyebrow="Dashboard"
        title="Platform overview"
        description="Real-time aggregate numbers across every user on CryptoVault."
      />

      <div className="px-4 sm:px-8 space-y-6">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-white/[0.07] bg-void-800/60 p-10 text-center text-sm text-ink-muted">
            {error}
          </div>
        ) : (
          <>
            {/* Stat cards — full colourful spread */}
            <motion.div
              initial="hidden"
              animate="show"
              variants={stagger}
              className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
            >
              <StatCard icon={Users} label="Total users" value={stats.totalUsers} accent="mint" />
              <StatCard
                icon={ArrowLeftRight}
                label="Total orders"
                value={formatCompactNumber(stats.totalOrders)}
                accent="neutral"
              />
              <StatCard
                icon={WalletIcon}
                label="Wallet balance"
                value={formatCurrency(stats.totalWalletBalance)}
                accent="mint"
              />
              <StatCard
                icon={Repeat}
                label="Transactions"
                value={formatCompactNumber(stats.totalTransactions)}
                accent="neutral"
              />
              <StatCard icon={Banknote} label="Withdrawals" value={stats.totalWithdrawals} accent="neutral" />
              <StatCard
                icon={Clock}
                label="Pending withdrawals"
                value={stats.pendingWithdrawals}
                sub={`${pendingRatio}% of total`}
                accent="carmine"
              />
            </motion.div>

            {/* Charts row */}
            <motion.div
              initial="hidden"
              animate="show"
              variants={stagger}
              className="grid lg:grid-cols-3 gap-4"
            >
              <ChartCard title="Withdrawal composition" className="lg:col-span-1">
                <div className="h-[220px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={withdrawalComposition}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={58}
                        outerRadius={82}
                        paddingAngle={4}
                        strokeWidth={0}
                        animationDuration={800}
                      >
                        <Cell fill="#D7FF4F" />
                        <Cell fill="#FB7185" />
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-5 text-xs mt-1">
                  <span className="flex items-center gap-1.5 text-ink-muted">
                    <span className="w-2 h-2 rounded-full bg-mint" /> Settled
                  </span>
                  <span className="flex items-center gap-1.5 text-ink-muted">
                    <span className="w-2 h-2 rounded-full bg-carmine-400" /> Pending
                  </span>
                </div>
              </ChartCard>

              <ChartCard title="Orders vs transactions" className="lg:col-span-1">
                <div className="h-[220px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={activityComposition}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={58}
                        outerRadius={82}
                        paddingAngle={4}
                        strokeWidth={0}
                        animationDuration={800}
                        animationBegin={100}
                      >
                        <Cell fill="#D7FF4F" />
                        <Cell fill="#55555D" />
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-5 text-xs mt-1">
                  <span className="flex items-center gap-1.5 text-ink-muted">
                    <span className="w-2 h-2 rounded-full bg-mint" /> Orders
                  </span>
                  <span className="flex items-center gap-1.5 text-ink-muted">
                    <span className="w-2 h-2 rounded-full bg-ink-600" /> Transactions
                  </span>
                </div>
              </ChartCard>

              <ChartCard title="Pending withdrawal load" className="lg:col-span-1">
                <div className="h-[220px] flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      innerRadius="70%"
                      outerRadius="100%"
                      barSize={16}
                      data={[{ name: 'pending', value: pendingRatio, fill: '#FB7185' }]}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                      <RadialBar background={{ fill: 'rgba(255,255,255,0.05)' }} dataKey="value" cornerRadius={12} animationDuration={900} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display text-3xl font-bold text-carmine-400">{pendingRatio}%</span>
                    <span className="text-[10px] text-ink-faint uppercase tracking-wide font-mono-tab mt-1">
                      of all withdrawals
                    </span>
                  </div>
                </div>
              </ChartCard>
            </motion.div>

            {/* Highlight banner */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="rounded-2xl border border-mint/20 bg-gradient-to-br from-mint-900/20 via-void-800/60 to-void-800/60 p-6 flex flex-wrap items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-mint/15 text-mint flex items-center justify-center">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <div className="font-display text-sm font-semibold text-ink">Platform is healthy</div>
                  <div className="text-xs text-ink-muted">
                    {stats.totalUsers} users have moved {formatCurrency(stats.totalWalletBalance)} in wallet balance
                    across {formatCompactNumber(stats.totalOrders)} orders.
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
