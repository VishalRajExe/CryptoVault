import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Zap,
  Wallet,
  LineChart,
  Star,
  Lock,
  ArrowRight,
  Smartphone,
  KeyRound,
  Eye,
  Plus,
  Minus,
  Globe2,
} from 'lucide-react';
import { useState } from 'react';
import Navbar from '../components/Navbar';
import TickerTape from '../components/TickerTape';
import HeroDashboard from '../components/HeroDashboard';
import Sparkline from '../components/Sparkline';
import { generateCandles } from '../utils/chartData';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

function SectionEyebrow({ children }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="w-1.5 h-1.5 rounded-full bg-mint" />
      <span className="font-mono-tab text-xs tracking-[0.18em] uppercase text-mint">{children}</span>
    </div>
  );
}

const features = [
  {
    icon: Zap,
    title: 'Sub-second order routing',
    desc: 'Market and limit orders settle against live order books the instant you confirm — no queue, no slippage surprises.',
    accent: 'mint',
  },
  {
    icon: Wallet,
    title: 'One vault, every asset',
    desc: 'Deposit, withdraw, and transfer wallet-to-wallet from a single balance. Your portfolio updates in real time as positions move.',
    accent: 'violet',
  },
  {
    icon: ShieldCheck,
    title: 'Two-factor by default',
    desc: 'Email and device verification gate every sign-in. Enable OTP-based 2FA in one tap from Security settings.',
    accent: 'mint',
  },
  {
    icon: LineChart,
    title: 'Live market intelligence',
    desc: 'Track trending coins, search the full market, and chart price history from 24 hours to all-time in one terminal.',
    accent: 'violet',
  },
  {
    icon: Star,
    title: 'Watchlists that matter',
    desc: 'Pin the assets you actually trade. Your watchlist syncs across sessions the moment you add a coin.',
    accent: 'mint',
  },
  {
    icon: Lock,
    title: 'Bank-grade custody',
    desc: 'Withdrawals route to verified payment details only, with every transfer logged to an auditable wallet ledger.',
    accent: 'violet',
  },
];

const steps = [
  {
    n: '01',
    title: 'Create your vault',
    desc: 'Register with your email and set a password. We verify your identity before your first trade clears.',
  },
  {
    n: '02',
    title: 'Fund your wallet',
    desc: 'Deposit instantly. Your balance is available the moment funds are confirmed — no multi-day holds.',
  },
  {
    n: '03',
    title: 'Trade with conviction',
    desc: 'Buy and sell across major assets with live pricing, then track performance from your portfolio dashboard.',
  },
];

const faqs = [
  {
    q: 'How fast are deposits reflected in my balance?',
    a: 'Deposits post to your wallet balance immediately after confirmation, so you can place an order the moment funds land.',
  },
  {
    q: 'Is two-factor authentication required?',
    a: 'It is optional but strongly recommended. Once enabled from Security settings, every sign-in requires an emailed one-time code in addition to your password.',
  },
  {
    q: 'Can I withdraw to my bank account?',
    a: 'Yes. Add your account holder name, account number, IFSC, and bank name once under Payment Details, then submit a withdrawal request from your wallet.',
  },
  {
    q: 'What happens if I forget my password?',
    a: 'Request a reset from the sign-in screen. We send a one-time code to your email that lets you set a new password in under a minute.',
  },
];

function FeatureCard({ icon: Icon, title, desc, accent }) {
  const isMint = accent === 'mint';
  return (
    <motion.div
      variants={fadeUp}
      className="group relative rounded-2xl border border-white/[0.07] bg-void-800/60 p-6 hover:border-white/[0.14] transition-colors duration-300 overflow-hidden"
    >
      <div
        className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
          isMint ? 'bg-mint/20' : 'bg-violet/20'
        }`}
      />
      <div
        className={`relative w-10 h-10 rounded-xl flex items-center justify-center mb-5 ${
          isMint ? 'bg-mint-900/60 text-mint' : 'bg-violet-600/15 text-violet-400'
        }`}
      >
        <Icon size={18} strokeWidth={1.75} />
      </div>
      <h3 className="relative font-display text-base font-semibold text-ink mb-2">{title}</h3>
      <p className="relative text-sm text-ink-muted leading-relaxed">{desc}</p>
    </motion.div>
  );
}

function StatBlock({ value, label, suffix = '' }) {
  return (
    <motion.div variants={fadeUp} className="text-center sm:text-left">
      <div className="font-display text-3xl sm:text-4xl font-semibold text-ink">
        {value}
        <span className="text-mint">{suffix}</span>
      </div>
      <div className="text-xs text-ink-faint mt-1.5 tracking-wide uppercase font-mono-tab">{label}</div>
    </motion.div>
  );
}

function FaqItem({ q, a, isOpen, onClick }) {
  return (
    <div className="border-b border-white/[0.07]">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between gap-4 py-5 text-left"
      >
        <span className="font-display text-sm sm:text-base text-ink font-medium">{q}</span>
        <span className="shrink-0 w-6 h-6 rounded-full border border-white/15 flex items-center justify-center text-ink-muted">
          {isOpen ? <Minus size={13} /> : <Plus size={13} />}
        </span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden"
      >
        <p className="text-sm text-ink-muted leading-relaxed pb-5 pr-10">{a}</p>
      </motion.div>
    </div>
  );
}

const marketCoins = [
  { sym: 'BTC', name: 'Bitcoin', price: 66870.95, change: 2.41, color: '#D7FF4F' },
  { sym: 'ETH', name: 'Ethereum', price: 3482.11, change: 1.08, color: '#7C5CFF' },
  { sym: 'SOL', name: 'Solana', price: 168.42, change: -0.86, color: '#FF3B69' },
  { sym: 'XRP', name: 'XRP', price: 0.612, change: 4.32, color: '#D7FF4F' },
];

export default function Landing() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(0);
  const [sparks] = useState(() => marketCoins.map(() => generateCandles(28, 100, 0.025).map((c) => c.close)));

  return (
    <div className="min-h-screen bg-void-950 text-ink font-body overflow-x-hidden">
      <Navbar />

      {/* ---------------- HERO ---------------- */}
      <section className="relative pt-32 pb-10 sm:pt-40 sm:pb-16 px-5 sm:px-8">
        <div
          className="absolute inset-0 bg-grid-faint bg-grid opacity-60"
          style={{ maskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, black 40%, transparent 100%)' }}
          aria-hidden
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-mint/[0.08] blur-[140px] rounded-full" aria-hidden />

        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-[1.05fr_0.95fr] gap-16 items-center">
          <motion.div initial="hidden" animate="show" variants={stagger}>
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 mb-7"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse-glow" />
              <span className="text-xs text-ink-muted font-mono-tab">Markets open · settling in real time</span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="font-display text-[2.6rem] leading-[1.05] sm:text-6xl sm:leading-[1.04] font-semibold tracking-tight text-ink"
            >
              Trade digital assets
              <br />
              with <span className="text-transparent bg-clip-text bg-gradient-to-r from-mint to-violet-400">conviction</span>,
              <br />
              not guesswork.
            </motion.h1>

            <motion.p variants={fadeUp} className="mt-6 text-base sm:text-lg text-ink-muted max-w-lg leading-relaxed">
              CryptoVault is a precision trading desk for crypto — live order books,
              instant wallet settlement, and bank-grade custody, built for people who
              treat trading as a discipline.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-9 flex flex-wrap items-center gap-4">
              <button
                onClick={() => navigate('/auth?mode=register')}
                className="group relative px-6 py-3.5 rounded-xl bg-mint text-void font-display font-semibold text-sm overflow-hidden shadow-mint hover:shadow-[0_0_0_1px_rgba(215,255,79,0.3),0_12px_50px_-8px_rgba(215,255,79,0.55)] transition-shadow"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Open your vault
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
              <button
                onClick={() => navigate('/auth?mode=login')}
                className="px-6 py-3.5 rounded-xl border border-white/12 text-ink font-display font-semibold text-sm hover:bg-white/[0.04] transition-colors"
              >
                Sign in
              </button>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-10 flex items-center gap-6 text-xs text-ink-faint">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-mint" /> 2FA secured
              </span>
              <span className="flex items-center gap-1.5">
                <Lock size={14} className="text-mint" /> Encrypted wallets
              </span>
              <span className="flex items-center gap-1.5">
                <Globe2 size={14} className="text-mint" /> Global markets
              </span>
            </motion.div>
          </motion.div>

          <HeroDashboard />
        </div>
      </section>

      <TickerTape />

      {/* ---------------- MARKET SNAPSHOT ---------------- */}
      <section id="markets" className="py-24 px-5 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12"
          >
            <div>
              <SectionEyebrow>Live snapshot</SectionEyebrow>
              <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-semibold text-ink max-w-md">
                The market, refreshed every tick.
              </motion.h2>
            </div>
            <motion.p variants={fadeUp} className="text-sm text-ink-muted max-w-xs">
              A preview of what loads in your terminal — full top-50 rankings, search, and detail charts on every coin.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {marketCoins.map((c, idx) => (
              <motion.div
                key={c.sym}
                variants={fadeUp}
                className="rounded-2xl border border-white/[0.07] bg-void-800/60 p-5 hover:border-white/[0.15] transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-display text-[10px] font-bold"
                      style={{ background: `${c.color}22`, color: c.color }}
                    >
                      {c.sym.slice(0, 1)}
                    </div>
                    <div>
                      <div className="font-display text-sm font-semibold text-ink leading-none">{c.sym}</div>
                      <div className="text-[11px] text-ink-faint mt-1">{c.name}</div>
                    </div>
                  </div>
                  <span
                    className={`font-mono-tab text-[11px] px-1.5 py-0.5 rounded ${
                      c.change >= 0 ? 'text-mint bg-mint-900/40' : 'text-carmine bg-carmine/10'
                    }`}
                  >
                    {c.change >= 0 ? '+' : ''}
                    {c.change.toFixed(2)}%
                  </span>
                </div>
                <div className="h-10 -mx-1 mb-2">
                  <Sparkline data={sparks[idx]} width={240} height={40} color={c.color} />
                </div>
                <div className="font-mono-tab text-lg text-ink font-medium">
                  ${c.price < 1 ? c.price.toFixed(3) : c.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ---------------- FEATURES ---------------- */}
      <section id="platform" className="py-24 px-5 sm:px-8 bg-void-900/40 border-y border-white/[0.05]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="max-w-xl mb-14"
          >
            <SectionEyebrow>The terminal</SectionEyebrow>
            <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-semibold text-ink">
              Every module a trading desk needs, none it doesn't.
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-ink-muted text-sm sm:text-base">
              Built directly on top of CryptoVault's trading engine — wallets, orders, assets, and watchlists all stay in sync.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {features.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ---------------- HOW IT WORKS ---------------- */}
      <section className="py-24 px-5 sm:px-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[0.85fr_1.15fr] gap-16 items-start">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="lg:sticky lg:top-28"
          >
            <SectionEyebrow>Getting started</SectionEyebrow>
            <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-semibold text-ink mb-5">
              From sign-up to first trade in three steps.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-ink-muted text-sm sm:text-base mb-8">
              No paperwork queue, no waiting period on your balance. Your vault is ready the moment verification clears.
            </motion.p>
            <motion.div variants={fadeUp}>
              <button
                onClick={() => navigate('/auth?mode=register')}
                className="px-6 py-3.5 rounded-xl bg-mint text-void font-display font-semibold text-sm shadow-mint hover:bg-mint-400 transition-colors inline-flex items-center gap-2"
              >
                Create your vault <ArrowRight size={16} />
              </button>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="space-y-4"
          >
            {steps.map((s) => (
              <motion.div
                key={s.n}
                variants={fadeUp}
                className="flex gap-6 rounded-2xl border border-white/[0.07] bg-void-800/50 p-6 sm:p-7"
              >
                <span className="font-display text-3xl font-semibold text-white/10 leading-none shrink-0">
                  {s.n}
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold text-ink mb-1.5">{s.title}</h3>
                  <p className="text-sm text-ink-muted leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ---------------- SECURITY ---------------- */}
      <section id="security" className="py-24 px-5 sm:px-8 bg-void-900/40 border-y border-white/[0.05]">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
          >
            <SectionEyebrow>Security</SectionEyebrow>
            <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-semibold text-ink mb-5">
              Custody that takes nothing for granted.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-ink-muted text-sm sm:text-base mb-8 max-w-md">
              Every account ships with email verification and optional two-factor
              authentication. Every withdrawal checks against your saved bank details
              and a real-time balance — never an assumption.
            </motion.p>

            <motion.div variants={stagger} className="space-y-4">
              {[
                { icon: KeyRound, title: 'Encrypted credentials', desc: 'Passwords are hashed, never stored or transmitted in plain text.' },
                { icon: Smartphone, title: 'One-time codes by email', desc: 'A fresh OTP gates sign-in whenever 2FA is enabled on your account.' },
                { icon: Eye, title: 'Full transaction visibility', desc: 'Every deposit, transfer, and withdrawal is logged to your wallet ledger.' },
              ].map((item) => (
                <motion.div key={item.title} variants={fadeUp} className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-lg bg-mint-900/50 text-mint flex items-center justify-center shrink-0 mt-0.5">
                    <item.icon size={16} strokeWidth={1.75} />
                  </div>
                  <div>
                    <div className="font-display text-sm font-semibold text-ink">{item.title}</div>
                    <div className="text-sm text-ink-muted mt-0.5">{item.desc}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="absolute -inset-10 bg-violet/10 blur-[100px] rounded-full" aria-hidden />
            <div className="relative rounded-2xl border border-white/10 bg-void-800/80 backdrop-blur-xl shadow-panel p-7">
              <div className="flex items-center justify-between mb-6">
                <span className="font-display text-sm font-semibold text-ink">Two-factor authentication</span>
                <span className="w-10 h-5 rounded-full bg-mint/90 relative">
                  <span className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-void" />
                </span>
              </div>
              <p className="text-xs text-ink-faint mb-6">A code was sent to your email</p>
              <div className="flex gap-2.5 mb-7">
                {['4', '1', '9', '2', '0', '7'].map((d, i) => (
                  <div
                    key={i}
                    className={`w-10 h-12 rounded-lg border flex items-center justify-center font-mono-tab text-lg ${
                      i < 4 ? 'border-mint/40 bg-mint-900/30 text-mint' : 'border-white/10 text-ink-faint animate-blink'
                    }`}
                  >
                    {i < 4 ? d : ''}
                  </div>
                ))}
              </div>
              <div className="h-px bg-white/[0.07] mb-6" />
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-faint">Session</span>
                  <span className="font-mono-tab text-ink-muted">7f2a-91cd-44e0</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-faint">Device</span>
                  <span className="text-ink-muted">Verified · Chrome on macOS</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-faint">Status</span>
                  <span className="text-mint flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse-glow" /> Verifying
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ---------------- STATS ---------------- */}
      <section className="py-20 px-5 sm:px-8">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          variants={stagger}
          className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8"
        >
          <StatBlock value="120" suffix="+" label="Tradeable assets" />
          <StatBlock value="<1" suffix="s" label="Avg. order settlement" />
          <StatBlock value="24/7" label="Market access" />
          <StatBlock value="99.9" suffix="%" label="Platform uptime" />
        </motion.div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section className="py-24 px-5 sm:px-8 bg-void-900/40 border-y border-white/[0.05]">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="text-center mb-12"
          >
            <div className="flex justify-center">
              <SectionEyebrow>Questions</SectionEyebrow>
            </div>
            <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-semibold text-ink">
              Frequently asked
            </motion.h2>
          </motion.div>

          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }} variants={stagger}>
            {faqs.map((f, i) => (
              <motion.div key={f.q} variants={fadeUp}>
                <FaqItem q={f.q} a={f.a} isOpen={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? -1 : i)} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ---------------- FINAL CTA ---------------- */}
      <section className="relative py-28 px-5 sm:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-grid-faint bg-grid opacity-40" style={{ maskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black 20%, transparent 100%)' }} aria-hidden />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-mint/[0.1] blur-[150px] rounded-full" aria-hidden />
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
          className="relative max-w-3xl mx-auto text-center"
        >
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-5xl font-semibold text-ink leading-tight">
            Your vault is one sign-up away.
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-5 text-ink-muted text-base max-w-lg mx-auto">
            Join a desk built for traders who want speed, clarity, and custody they can verify — not just trust.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-9 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate('/auth?mode=register')}
              className="px-7 py-3.5 rounded-xl bg-mint text-void font-display font-semibold text-sm shadow-mint hover:bg-mint-400 transition-colors inline-flex items-center gap-2"
            >
              Open your vault <ArrowRight size={16} />
            </button>
          </motion.div>
        </motion.div>
      </section>

      <footer className="border-t border-white/[0.06] py-12 px-5 sm:px-8 bg-void-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-mint to-violet flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none">
                <path d="M12 2L4 6v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V6l-8-4z" fill="#05070D" />
              </svg>
            </span>
            <span className="font-display text-sm font-semibold text-ink">CryptoVault</span>
          </div>
          <p className="text-xs text-ink-faint text-center">
            Digital asset trading carries risk. CryptoVault is a demonstration trading interface.
          </p>
          <div className="flex items-center gap-6 text-xs text-ink-faint">
            <Link to="/faq" className="hover:text-ink-muted transition-colors">FAQ</Link>
            <Link to="/terms" className="hover:text-ink-muted transition-colors">Terms &amp; Conditions</Link>
            <span>© {new Date().getFullYear()} CryptoVault</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
