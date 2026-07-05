import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, X } from 'lucide-react';

const STORAGE_KEY = 'cv_age_confirmed';

/**
 * 18+ age confirmation modal. Shows on first visit, persists in localStorage.
 */
export default function AgeConfirmation() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const confirmed = localStorage.getItem(STORAGE_KEY);
    if (!confirmed) {
      setShow(true);
    }
  }, []);

  const handleConfirm = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShow(false);
  };

  const handleDecline = () => {
    window.location.href = 'https://www.google.com';
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-void-950/95 backdrop-blur-xl flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md rounded-2xl glass-card p-8 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-violet-600/15 text-violet-400 flex items-center justify-center mx-auto mb-6">
              <ShieldAlert size={28} />
            </div>

            <h2 className="font-display text-xl font-bold text-ink mb-3">
              Age Verification
            </h2>

            <p className="text-sm text-ink-muted leading-relaxed mb-6">
              CryptoVault is a cryptocurrency trading platform intended for users who are{' '}
              <strong className="text-ink">18 years of age or older</strong>. By continuing,
              you confirm that you meet this requirement and understand the risks associated
              with digital asset trading.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleDecline}
                className="flex-1 py-3 rounded-xl border border-white/10 text-ink-muted text-sm font-display font-semibold hover:bg-white/[0.05] transition-colors"
              >
                I'm under 18
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-3 rounded-xl bg-mint text-void text-sm font-display font-semibold shadow-mint hover:bg-mint-400 transition-all"
              >
                I'm 18 or older
              </button>
            </div>

            <p className="text-[10px] text-ink-faint mt-4">
              By clicking "I'm 18 or older", you agree to our Terms of Service and Privacy Policy.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
