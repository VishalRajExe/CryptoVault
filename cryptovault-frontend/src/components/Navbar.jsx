import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const links = [
  { label: 'Markets', href: '#markets' },
  { label: 'Platform', href: '#platform' },
  { label: 'Security', href: '#security' },
  { label: 'Pricing', href: '#pricing' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-void-950/85 backdrop-blur-xl border-b border-white/[0.06]' : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-mint to-violet flex items-center justify-center">
            <span className="absolute inset-0 rounded-lg bg-mint blur-md opacity-40 group-hover:opacity-70 transition-opacity" />
            <svg viewBox="0 0 24 24" className="w-4 h-4 relative z-10" fill="none">
              <path d="M12 2L4 6v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V6l-8-4z" fill="#05070D" />
            </svg>
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            CryptoVault
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-sm text-ink-muted hover:text-ink transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <button
              onClick={() => navigate('/app')}
              className="px-4 py-2 rounded-lg bg-mint text-void font-display text-sm font-semibold hover:bg-mint-400 transition-colors shadow-mint"
            >
              Open Terminal
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate('/auth?mode=login')}
                className="px-4 py-2 text-sm text-ink-muted hover:text-ink transition-colors"
              >
                Log in
              </button>
              <button
                onClick={() => navigate('/auth?mode=register')}
                className="px-4 py-2 rounded-lg bg-mint text-void font-display text-sm font-semibold hover:bg-mint-400 transition-colors shadow-mint"
              >
                Get started
              </button>
            </>
          )}
        </div>

        <button
          className="md:hidden text-ink p-2"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="md:hidden bg-void-950/98 backdrop-blur-xl border-t border-white/[0.06] px-5 py-4 flex flex-col gap-4"
        >
          {links.map((l) => (
            <a key={l.label} href={l.href} className="text-sm text-ink-muted" onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => navigate('/auth?mode=login')}
              className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-sm text-ink"
            >
              Log in
            </button>
            <button
              onClick={() => navigate('/auth?mode=register')}
              className="flex-1 px-4 py-2.5 rounded-lg bg-mint text-void font-display text-sm font-semibold"
            >
              Get started
            </button>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
