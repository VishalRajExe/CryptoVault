import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, HelpCircle, ChevronDown, Search } from 'lucide-react';
import Navbar from '../components/Navbar';

const faqs = [
  { q: 'How do I create a CryptoVault account?', a: 'Click "Get Started" on the homepage, fill in your details (name, email, mobile number, password), and submit the registration form. You\'ll be automatically logged in. We recommend verifying your email and enabling 2FA from the Security page for full account access.' },
  { q: 'How do I deposit funds?', a: 'Navigate to the Wallet page and click "Deposit". Enter the amount you wish to deposit and you\'ll be redirected to Razorpay\'s secure checkout to complete the payment. Once the payment is verified, your wallet balance updates instantly.' },
  { q: 'How do I withdraw funds?', a: 'First, add your bank details from the Wallet page. Then click "Withdraw", enter the amount, and submit your request. Withdrawal requests are reviewed by our team and typically processed within 1-3 business days.' },
  { q: 'How do I buy or sell cryptocurrency?', a: 'Go to the Markets page, find the coin you want to trade, and click "Trade". In the order modal, select Buy or Sell, enter the quantity, and confirm. The trade executes at the current market price and your wallet balance is updated accordingly.' },
  { q: 'What is two-factor authentication (2FA)?', a: '2FA adds an extra layer of security to your account. When enabled, you\'ll need to enter a one-time code sent to your email every time you sign in, in addition to your password. Enable it from the Security page.' },
  { q: 'How do I verify my email?', a: 'Go to the Security page and click "Send verification code". Check your email for the 6-digit code, enter it, and your account will be verified. Verified accounts have access to all platform features.' },
  { q: 'What is a watchlist?', a: 'Your watchlist is a personal collection of coins you\'re tracking. Star any coin from the Markets page to add it to your watchlist. You can view all your watched coins, their current prices, and trade directly from the Watchlist page.' },
  { q: 'How do wallet-to-wallet transfers work?', a: 'You can send funds to another CryptoVault user by entering their Wallet ID (visible on the Wallet page). Go to Wallet → Transfer, enter the recipient\'s ID, amount, and an optional note, then confirm the transfer.' },
  { q: 'Are my funds safe?', a: 'CryptoVault implements bank-grade security including encrypted data storage, secure payment processing through verified providers (Razorpay/Stripe), JWT-based authentication, and optional 2FA. We never store your payment card details on our servers.' },
  { q: 'How do I contact support?', a: 'You can reach us through the AI assistant chatbot (click the chat icon at the bottom right of any page) or email us at support@cryptovault.com. We aim to respond within 24 hours.' },
  { q: 'What cryptocurrencies can I trade?', a: 'CryptoVault supports trading all major cryptocurrencies listed on CoinGecko, including Bitcoin (BTC), Ethereum (ETH), Solana (SOL), and hundreds more. Browse the full list on the Markets page.' },
  { q: 'Is there a minimum trade amount?', a: 'There is no minimum trade amount — you can buy fractional amounts of any cryptocurrency. However, very small trades may not be practical due to the market price of the asset.' },
];

function FAQItem({ faq, isOpen, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl glass-card overflow-hidden"
    >
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span className="font-display text-sm font-semibold text-ink">{faq.q}</span>
        <ChevronDown
          size={16}
          className={`text-ink-faint shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5 text-sm text-ink-muted leading-relaxed border-t border-white/[0.06] pt-4">
              {faq.a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? faqs.filter(
        (f) =>
          f.q.toLowerCase().includes(search.toLowerCase()) ||
          f.a.toLowerCase().includes(search.toLowerCase())
      )
    : faqs;

  return (
    <div className="min-h-screen bg-void-950">
      <Navbar />
      <div className="max-w-3xl mx-auto px-5 sm:px-8 pt-24 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink mb-8 transition-colors"
          >
            <ArrowLeft size={14} /> Back to home
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-mint-900/60 text-mint flex items-center justify-center">
              <HelpCircle size={22} />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
                Frequently Asked Questions
              </h1>
              <p className="text-sm text-ink-muted">Everything you need to know about CryptoVault</p>
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-void-900/60 px-4 py-3 mb-8">
            <Search size={16} className="text-ink-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search FAQs…"
              className="flex-1 bg-transparent outline-none text-sm text-ink placeholder:text-ink-faint"
            />
          </div>

          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <HelpCircle size={28} className="mx-auto text-ink-faint mb-3" />
                <p className="text-sm text-ink-muted">No results found for "{search}"</p>
              </div>
            ) : (
              filtered.map((faq, i) => (
                <FAQItem
                  key={i}
                  faq={faq}
                  isOpen={openIndex === i}
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                />
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
