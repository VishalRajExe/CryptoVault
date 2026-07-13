import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Mail, Loader2, CheckCircle2, KeyRound, Smartphone, Pencil } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { sendVerificationOtp, verifyAccountOtp, enableTwoFactor, updateMobile } from '../../api/auth';
import { useToast } from '../../context/ToastContext';

function OtpInline({ onSubmit, loading, onCancel }) {
  const [otp, setOtp] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(otp);
      }}
      className="flex items-center gap-2 mt-3"
    >
      <input
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
        placeholder="000000"
        inputMode="numeric"
        maxLength={6}
        className="w-32 rounded-lg border border-white/10 bg-void-900/60 px-3 py-2 text-sm text-ink font-mono-tab outline-none focus:border-mint/50"
        autoFocus
      />
      <button
        type="submit"
        disabled={loading}
        className="px-3.5 py-2 rounded-lg bg-mint text-void text-xs font-display font-semibold hover:bg-mint-400 transition-colors disabled:opacity-60"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : 'Verify'}
      </button>
      <button type="button" onClick={onCancel} className="text-xs text-ink-faint hover:text-ink-muted">
        Cancel
      </button>
    </form>
  );
}

function MobileNumberCard({ mobile, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(mobile || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { push } = useToast();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!value.trim()) {
      setError('Enter a mobile number.');
      return;
    }
    setLoading(true);
    try {
      await updateMobile(value.trim());
      push('Mobile number updated.', 'success');
      onSaved(value.trim());
      setEditing(false);
    } catch (err) {
      setError(err.friendlyMessage || 'Could not update mobile number.');
    } finally {
      setLoading(false);
    }
  };

  if (editing) {
    return (
      <div className="rounded-2xl border border-white/[0.07] bg-void-800/60 p-5">
        <div className="flex items-start gap-3 mb-3">
          <Smartphone size={16} className="text-ink-faint mt-0.5 shrink-0" />
          <div className="text-sm text-ink font-medium">Mobile number</div>
        </div>
        <form onSubmit={submit} className="flex items-center gap-2">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="+1 555 123 4567"
            autoFocus
            className="flex-1 min-w-0 rounded-lg border border-white/10 bg-void-900/60 px-3 py-2 text-sm text-ink outline-none focus:border-mint/50 placeholder:text-ink-faint"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-3.5 py-2 rounded-lg bg-mint text-void text-xs font-display font-semibold hover:bg-mint-400 transition-colors disabled:opacity-60 shrink-0"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setValue(mobile || '');
              setError('');
            }}
            className="text-xs text-ink-faint hover:text-ink-muted shrink-0"
          >
            Cancel
          </button>
        </form>
        {error && <p className="text-xs text-carmine mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-void-800/60 p-5 flex items-start gap-3">
      <Smartphone size={16} className="text-ink-faint mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm text-ink font-medium mb-0.5">Mobile number</div>
        <p className="text-xs text-ink-muted">{mobile || 'Not added yet'}</p>
      </div>
      <button
        onClick={() => setEditing(true)}
        className="shrink-0 text-ink-faint hover:text-ink p-1"
        aria-label="Edit mobile number"
      >
        <Pencil size={14} />
      </button>
    </div>
  );
}

export default function Security() {
  const { user, refresh, setUser } = useAuth();
  const { push } = useToast();
  const [sendingVerify, setSendingVerify] = useState(false);
  const [verifyStep, setVerifyStep] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const [sending2fa, setSending2fa] = useState(false);
  const [twoFaStep, setTwoFaStep] = useState(false);
  const [twoFaLoading, setTwoFaLoading] = useState(false);

  const isEmailVerified = !!(user?.isVerified || user?.verified);
  const is2faEnabled = !!(user?.twoFactorAuth?.isEnabled || user?.twoFactorAuth?.enabled);

  const handleSendVerify = async () => {
    setSendingVerify(true);
    try {
      await sendVerificationOtp('EMAIL');
      setVerifyStep(true);
      push('Verification code sent to your email.', 'info');
    } catch (e) {
      push(e.friendlyMessage || 'Could not send code.', 'error');
    } finally {
      setSendingVerify(false);
    }
  };

  const handleVerify = async (otp) => {
    if (otp.length < 4) return;
    setVerifyLoading(true);
    try {
      const updatedUser = await verifyAccountOtp(otp);
      push('Email verified successfully.', 'success');
      setVerifyStep(false);
      if (updatedUser) {
        setUser(updatedUser);
      } else {
        setUser((prev) => (prev ? { ...prev, isVerified: true, verified: true, status: 'VERIFIED' } : prev));
      }
      await refresh();
    } catch (e) {
      push(e.friendlyMessage || e.response?.data?.message || 'Invalid code.', 'error');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleSend2fa = async () => {
    setSending2fa(true);
    try {
      await sendVerificationOtp('EMAIL');
      setTwoFaStep(true);
      push('Verification code sent to your email.', 'info');
    } catch (e) {
      push(e.friendlyMessage || 'Could not send code.', 'error');
    } finally {
      setSending2fa(false);
    }
  };

  const handleEnable2fa = async (otp) => {
    if (otp.length < 4) return;
    setTwoFaLoading(true);
    try {
      const updatedUser = await enableTwoFactor(otp);
      push('Two-factor authentication enabled.', 'success');
      setTwoFaStep(false);
      if (updatedUser) {
        setUser(updatedUser);
      } else {
        setUser((prev) => (prev ? {
          ...prev,
          twoFactorAuth: {
            ...prev?.twoFactorAuth,
            isEnabled: true,
            enabled: true
          }
        } : prev));
      }
      await refresh();
    } catch (e) {
      push(e.friendlyMessage || 'Invalid code.', 'error');
    } finally {
      setTwoFaLoading(false);
    }
  };


  return (
    <div className="pb-16">
      <PageHeader eyebrow="Account" title="Security" description="Verify your identity and harden how you sign in." />

      <div className="px-4 sm:px-8 space-y-6 max-w-2xl">
        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/[0.07] bg-void-800/60 p-6 flex items-center gap-4"
        >
          <div className="w-14 h-14 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center font-display text-lg font-semibold shrink-0">
            {(user?.fullName || user?.email || 'U').slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="font-display text-base font-semibold text-ink">{user?.fullName || 'Trader'}</div>
            <div className="text-sm text-ink-muted">{user?.email}</div>
            {user?.mobile && <div className="text-xs text-ink-faint mt-0.5">{user.mobile}</div>}
          </div>
        </motion.div>

        {/* Email verification - Hidden for Admin */}
        {user?.role !== 'ROLE_ADMIN' && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="rounded-2xl border border-white/[0.07] bg-void-800/60 p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-mint-900/60 text-mint flex items-center justify-center shrink-0">
              <Mail size={17} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-display text-sm font-semibold text-ink">Email verification</span>
                {isEmailVerified && (
                  <span className="flex items-center gap-1 text-[11px] text-mint bg-mint-900/40 px-2 py-0.5 rounded-full border border-mint/20">
                    <CheckCircle2 size={11} /> Verified
                  </span>
                )}
              </div>
              <p className="text-sm text-ink-muted">Confirm ownership of {user?.email} to unlock full account access.</p>

              {!isEmailVerified && !verifyStep && (
                <button
                  onClick={handleSendVerify}
                  disabled={sendingVerify}
                  className="mt-3 px-4 py-2 rounded-lg bg-mint text-void text-xs font-display font-semibold hover:bg-mint-400 transition-colors disabled:opacity-60 inline-flex items-center gap-2"
                >
                  {sendingVerify ? <Loader2 size={14} className="animate-spin" /> : 'Send verification code'}
                </button>
              )}
              {verifyStep && (
                <OtpInline onSubmit={handleVerify} loading={verifyLoading} onCancel={() => setVerifyStep(false)} />
              )}
            </div>
          </div>
        </motion.div>
        )}

        {/* 2FA - Hidden for Admin */}
        {user?.role !== 'ROLE_ADMIN' && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="rounded-2xl border border-white/[0.07] bg-void-800/60 p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-violet-600/15 text-violet-400 flex items-center justify-center shrink-0">
              <ShieldCheck size={17} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-display text-sm font-semibold text-ink">Two-factor authentication</span>
                {is2faEnabled && (
                  <span className="flex items-center gap-1 text-[11px] text-mint bg-mint-900/40 px-2 py-0.5 rounded-full border border-mint/20">
                    <CheckCircle2 size={11} /> Enabled
                  </span>
                )}
              </div>
              <p className="text-sm text-ink-muted">
                Require a one-time email code on every sign-in, in addition to your password.
              </p>

              {!is2faEnabled && !twoFaStep && (
                <button
                  onClick={handleSend2fa}
                  disabled={sending2fa}
                  className="mt-3 px-4 py-2 rounded-lg bg-white/[0.06] border border-white/12 text-ink text-xs font-display font-semibold hover:bg-white/[0.1] transition-colors disabled:opacity-60 inline-flex items-center gap-2"
                >
                  {sending2fa ? <Loader2 size={14} className="animate-spin" /> : 'Enable 2FA'}
                </button>
              )}
              {twoFaStep && (
                <OtpInline onSubmit={handleEnable2fa} loading={twoFaLoading} onCancel={() => setTwoFaStep(false)} />
              )}
            </div>
          </div>
        </motion.div>
        )}

        {/* Info cards */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="grid sm:grid-cols-2 gap-4"
        >
          <div className="rounded-2xl border border-white/[0.07] bg-void-800/60 p-5 flex items-start gap-3">
            <KeyRound size={16} className="text-ink-faint mt-0.5 shrink-0" />
            <div>
              <div className="text-sm text-ink font-medium mb-0.5">Password</div>
              <p className="text-xs text-ink-muted">Reset it any time from the sign-in screen's "Forgot password" flow.</p>
            </div>
          </div>
          <MobileNumberCard
            mobile={user?.mobile}
            onSaved={(mobile) => setUser((prev) => (prev ? { ...prev, mobile } : prev))}
          />
        </motion.div>
      </div>
    </div>
  );
}
