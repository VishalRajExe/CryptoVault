import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, FileText } from 'lucide-react';
import Navbar from '../components/Navbar';

const sections = [
  {
    title: '1. Acceptance of Terms',
    content: `By accessing or using CryptoVault ("the Platform"), you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use our services. CryptoVault reserves the right to modify these terms at any time, and your continued use of the Platform constitutes acceptance of any changes.`,
  },
  {
    title: '2. Eligibility',
    content: `You must be at least 18 years of age and have the legal capacity to enter into a binding agreement to use CryptoVault. By creating an account, you represent and warrant that you meet these requirements. Users who are found to be under the minimum age requirement will have their accounts terminated immediately.`,
  },
  {
    title: '3. Account Registration & Security',
    content: `You are responsible for maintaining the confidentiality of your account credentials. You agree to notify CryptoVault immediately of any unauthorized access to your account. We strongly recommend enabling two-factor authentication (2FA) for enhanced security. CryptoVault is not liable for any loss resulting from unauthorized access to your account.`,
  },
  {
    title: '4. Trading & Transactions',
    content: `All trades executed on CryptoVault are final and irreversible once confirmed. Cryptocurrency prices are volatile and can change rapidly. CryptoVault does not guarantee any specific returns on investments. Users are solely responsible for their trading decisions and should only trade with funds they can afford to lose.`,
  },
  {
    title: '5. Deposits & Withdrawals',
    content: `Deposits are processed through our integrated payment providers (Razorpay/Stripe). Withdrawal requests are subject to review and may take 1-3 business days to process. CryptoVault reserves the right to request additional verification before processing withdrawals. Minimum and maximum withdrawal limits may apply.`,
  },
  {
    title: '6. Fees',
    content: `CryptoVault may charge transaction fees, withdrawal fees, or other applicable charges. All fee schedules are available on the Platform and may be updated from time to time. Users will be notified of any fee changes in advance.`,
  },
  {
    title: '7. Privacy & Data Protection',
    content: `CryptoVault collects, stores, and processes user data in accordance with applicable data protection laws. We implement industry-standard security measures to protect your personal and financial information. For full details, please refer to our Privacy Policy.`,
  },
  {
    title: '8. Prohibited Activities',
    content: `Users are prohibited from: (a) using the Platform for money laundering or terrorist financing, (b) manipulating markets or engaging in fraudulent trading, (c) creating multiple accounts, (d) using automated bots without authorization, (e) attempting to exploit system vulnerabilities, (f) violating any applicable laws or regulations.`,
  },
  {
    title: '9. Limitation of Liability',
    content: `CryptoVault shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Platform. Our total liability shall not exceed the amount of fees paid by you in the twelve months preceding the claim. Cryptocurrency trading involves significant risk, and past performance does not guarantee future results.`,
  },
  {
    title: '10. Contact',
    content: `For questions about these Terms and Conditions, please contact us at support@cryptovault.com. We will respond to your inquiry within 2 business days.`,
  },
];

export default function TermsAndConditions() {
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
            <div className="w-12 h-12 rounded-xl bg-violet-600/15 text-violet-400 flex items-center justify-center">
              <FileText size={22} />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">Terms & Conditions</h1>
              <p className="text-sm text-ink-muted">Last updated: July 2026</p>
            </div>
          </div>

          <div className="space-y-8">
            {sections.map((s, i) => (
              <motion.section
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-2xl glass-card p-6"
                id={`section-${i + 1}`}
              >
                <h2 className="font-display text-base font-semibold text-ink mb-3">{s.title}</h2>
                <p className="text-sm text-ink-muted leading-relaxed">{s.content}</p>
              </motion.section>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
