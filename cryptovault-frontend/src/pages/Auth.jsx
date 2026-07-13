import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { signup, signin, verifyTwoFactorOtp, sendForgotPasswordOtp, resetPassword, googleLoginUrl } from '../api/auth';
import { API_BASE_URL } from '../api/client';
import CandleChart from '../components/CandleChart';

function Field({ icon: Icon, error, ...props }) {
  return (
    <div>
      <div
        className={`flex items-center gap-3 rounded-xl border bg-void-900/60 px-4 py-3 transition-colors ${
          error ? 'border-carmine/50' : 'border-white/10 focus-within:border-mint/50'
        }`}
      >
        <Icon size={16} className={error ? 'text-carmine' : 'text-ink-faint'} />
        <input
          {...props}
          className="flex-1 bg-transparent outline-none text-sm text-ink placeholder:text-ink-faint"
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-carmine">{error}</p>}
    </div>
  );
}

function PasswordField({ value, onChange, error, placeholder = 'Password', name = 'password' }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <div
        className={`flex items-center gap-3 rounded-xl border bg-void-900/60 px-4 py-3 transition-colors ${
          error ? 'border-carmine/50' : 'border-white/10 focus-within:border-mint/50'
        }`}
      >
        <Lock size={16} className={error ? 'text-carmine' : 'text-ink-faint'} />
        <input
          type={show ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-sm text-ink placeholder:text-ink-faint"
          autoComplete={name === 'password' ? 'current-password' : 'new-password'}
        />
        <button type="button" onClick={() => setShow((s) => !s)} className="text-ink-faint hover:text-ink-muted" tabIndex={-1}>
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-carmine">{error}</p>}
    </div>
  );
}

function GoogleButton() {
  return (
    <a
      href={googleLoginUrl(API_BASE_URL)}
      className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/12 bg-white/[0.02] py-3 text-sm font-medium text-ink hover:bg-white/[0.05] transition-colors"
    >
      <svg width="16" height="16" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
      </svg>
      Continue with Google
    </a>
  );
}

// ---------- Forms ----------

function LoginForm({ onSwitch, onForgot }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [twoFactor, setTwoFactor] = useState(null); // { session }
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await signin(form);
      if (res.twoFactorAuthEnabled) {
        setTwoFactor({ session: res.session });
      } else if (res.jwt) {
        await login(res.jwt);
        navigate('/app');
      }
    } catch (err) {
      if (err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
        setErrors(err.fieldErrors);
      } else {
        setApiError(err.friendlyMessage || 'Unable to sign in. Check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (otp.length < 4) {
      setApiError('Enter the full code sent to your email.');
      return;
    }
    setOtpLoading(true);
    try {
      const res = await verifyTwoFactorOtp(otp, twoFactor.session);
      if (res.jwt) {
        await login(res.jwt);
        navigate('/app');
      }
    } catch (err) {
      setApiError(err.friendlyMessage || 'Invalid code. Try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  if (twoFactor) {
    return (
      <motion.form
        key="2fa"
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -16 }}
        onSubmit={handleOtpSubmit}
        className="space-y-5"
      >
        <button
          type="button"
          onClick={() => setTwoFactor(null)}
          className="flex items-center gap-1.5 text-xs text-ink-faint hover:text-ink-muted"
        >
          <ArrowLeft size={13} /> Back
        </button>
        <div className="w-11 h-11 rounded-xl bg-mint-900/60 text-mint flex items-center justify-center">
          <ShieldCheck size={20} />
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">Verify it's you</h2>
          <p className="text-sm text-ink-muted mt-1">Enter the 6-digit code we emailed to {form.email}.</p>
        </div>
        <Field
          icon={ShieldCheck}
          placeholder="000000"
          inputMode="numeric"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
        />
        {apiError && (
          <div className="text-sm text-carmine bg-carmine/10 border border-carmine/20 rounded-lg px-3.5 py-2.5">
            {apiError}
          </div>
        )}
        <button
          type="submit"
          disabled={otpLoading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-mint text-void font-display font-semibold text-sm py-3.5 shadow-mint hover:bg-mint-400 transition-colors disabled:opacity-60"
        >
          {otpLoading ? <Loader2 size={16} className="animate-spin" /> : <>Verify &amp; sign in <ArrowRight size={16} /></>}
        </button>
      </motion.form>
    );
  }

  return (
    <motion.form
      key="login"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <div>
        <h2 className="font-display text-2xl font-semibold text-ink">Welcome back</h2>
        <p className="text-sm text-ink-muted mt-1.5">Sign in to access your trading desk.</p>
      </div>

      <Field
        icon={Mail}
        type="email"
        placeholder="you@example.com"
        value={form.email}
        error={errors.email}
        onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: null }); }}
        autoComplete="email"
      />
      <PasswordField
        value={form.password}
        error={errors.password}
        onChange={(e) => { setForm({ ...form, password: e.target.value }); setErrors({ ...errors, password: null }); }}
      />

      <div className="flex justify-end -mt-2">
        <button type="button" onClick={onForgot} className="text-xs text-mint hover:text-mint-400">
          Forgot password?
        </button>
      </div>

      {apiError && (
        <div className="text-sm text-carmine bg-carmine/10 border border-carmine/20 rounded-lg px-3.5 py-2.5">
          {apiError}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-mint text-void font-display font-semibold text-sm py-3.5 shadow-mint hover:bg-mint-400 transition-colors disabled:opacity-60"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <>Sign in <ArrowRight size={16} /></>}
      </button>

      <div className="flex items-center gap-3 py-1">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-ink-faint">or</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <GoogleButton />

      <p className="text-center text-sm text-ink-muted pt-1">
        New to CryptoVault?{' '}
        <button type="button" onClick={onSwitch} className="text-mint hover:text-mint-400 font-medium">
          Create an account
        </button>
      </p>
    </motion.form>
  );
}

function RegisterForm({ onSwitch }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', mobile: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.mobile.trim()) e.mobile = 'Mobile number is required';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Use at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await signup(form);
      if (res.jwt) {
        await login(res.jwt);
        navigate('/app');
      }
    } catch (err) {
      if (err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
        setErrors(err.fieldErrors);
      } else {
        setApiError(err.friendlyMessage || 'Unable to create your account.');
      }
    } finally {
      setLoading(false);
    }
  };

  const strength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p) && /[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  return (
    <motion.form
      key="register"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div>
        <h2 className="font-display text-2xl font-semibold text-ink">Open your vault</h2>
        <p className="text-sm text-ink-muted mt-1.5">Set up your account in under a minute.</p>
      </div>

      <Field
        icon={User}
        placeholder="Full name"
        value={form.fullName}
        error={errors.fullName}
        onChange={(e) => { setForm({ ...form, fullName: e.target.value }); setErrors({ ...errors, fullName: null }); }}
        autoComplete="name"
      />
      <Field
        icon={Mail}
        type="email"
        placeholder="you@example.com"
        value={form.email}
        error={errors.email}
        onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: null }); }}
        autoComplete="email"
      />
      <Field
        icon={Phone}
        type="tel"
        placeholder="Mobile number"
        value={form.mobile}
        error={errors.mobile}
        onChange={(e) => { setForm({ ...form, mobile: e.target.value }); setErrors({ ...errors, mobile: null }); }}
        autoComplete="tel"
      />
      <div>
        <PasswordField
          name="newPassword"
          value={form.password}
          error={errors.password}
          onChange={(e) => { setForm({ ...form, password: e.target.value }); setErrors({ ...errors, password: null }); }}
          placeholder="Create a password"
        />
        {form.password && (
          <div className="flex gap-1.5 mt-2">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i < strength
                    ? strength <= 1
                      ? 'bg-carmine'
                      : strength <= 2
                      ? 'bg-amber-400'
                      : 'bg-mint'
                    : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {apiError && (
        <div className="text-sm text-carmine bg-carmine/10 border border-carmine/20 rounded-lg px-3.5 py-2.5">
          {apiError}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-mint text-void font-display font-semibold text-sm py-3.5 shadow-mint hover:bg-mint-400 transition-colors disabled:opacity-60"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <>Create account <ArrowRight size={16} /></>}
      </button>

      <div className="flex items-center gap-3 py-1">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-ink-faint">or</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <GoogleButton />

      <p className="text-center text-sm text-ink-muted pt-1">
        Already have a vault?{' '}
        <button type="button" onClick={onSwitch} className="text-mint hover:text-mint-400 font-medium">
          Sign in
        </button>
      </p>
    </motion.form>
  );
}

function ForgotPasswordForm({ onBack }) {
  const [step, setStep] = useState('request'); // request -> verify -> done
  const [email, setEmail] = useState('');
  const [session, setSession] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const requestOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email');
      return;
    }
    setLoading(true);
    try {
      const res = await sendForgotPasswordOtp({ sendTo: email, verificationType: 'EMAIL' });
      setSession(res.session);
      setStep('verify');
    } catch (err) {
      setError(err.friendlyMessage || 'Could not send code.');
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async (e) => {
    e.preventDefault();
    setError('');
    if (otp.length < 4 || password.length < 6) {
      setError('Enter the full code and a password of at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(session, { otp, password });
      setStep('done');
    } catch (err) {
      setError(err.friendlyMessage || 'Could not reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div key="forgot" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-ink-faint hover:text-ink-muted mb-5">
        <ArrowLeft size={13} /> Back to sign in
      </button>

      {step === 'request' && (
        <form onSubmit={requestOtp} className="space-y-5">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">Reset your password</h2>
            <p className="text-sm text-ink-muted mt-1">We'll email you a one-time code.</p>
          </div>
          <Field icon={Mail} type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          {error && <div className="text-sm text-carmine bg-carmine/10 border border-carmine/20 rounded-lg px-3.5 py-2.5">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-mint text-void font-display font-semibold text-sm py-3.5 shadow-mint hover:bg-mint-400 transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Send code'}
          </button>
        </form>
      )}

      {step === 'verify' && (
        <form onSubmit={submitReset} className="space-y-5">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">Check your inbox</h2>
            <p className="text-sm text-ink-muted mt-1">Enter the code and choose a new password.</p>
          </div>
          <Field icon={ShieldCheck} placeholder="000000" inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} />
          <PasswordField name="newPassword2" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" />
          {error && <div className="text-sm text-carmine bg-carmine/10 border border-carmine/20 rounded-lg px-3.5 py-2.5">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-mint text-void font-display font-semibold text-sm py-3.5 shadow-mint hover:bg-mint-400 transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Reset password'}
          </button>
        </form>
      )}

      {step === 'done' && (
        <div className="text-center py-6">
          <div className="w-12 h-12 rounded-full bg-mint-900/60 text-mint flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={22} />
          </div>
          <h2 className="font-display text-xl font-semibold text-ink mb-2">Password updated</h2>
          <p className="text-sm text-ink-muted mb-6">You can sign in with your new password now.</p>
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-xl bg-mint text-void font-display font-semibold text-sm shadow-mint hover:bg-mint-400 transition-colors"
          >
            Back to sign in
          </button>
        </div>
      )}
    </motion.div>
  );
}

export default function Auth() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get('mode') === 'register' ? 'register' : 'login');
  const [forgot, setForgot] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate('/app', { replace: true });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-void-950 text-ink font-body flex">
      {/* ---------- visual side ---------- */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden border-r border-white/[0.06]">
        <div className="absolute inset-0 bg-grid-faint bg-grid opacity-50" aria-hidden />
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-mint/[0.12] blur-[120px] rounded-full" aria-hidden />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet/[0.12] blur-[120px] rounded-full" aria-hidden />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link to="/" className="flex items-center gap-2 w-fit">
            <span className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-mint to-violet flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
                <path d="M12 2L4 6v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V6l-8-4z" fill="#05070D" />
              </svg>
            </span>
            <span className="font-display text-lg font-semibold text-ink">CryptoVault</span>
          </Link>

          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl border border-white/10 bg-void-800/80 backdrop-blur-xl shadow-panel p-6 mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-display text-sm font-semibold text-ink">BTC/USD</div>
                  <div className="text-[11px] text-ink-faint">Bitcoin · live</div>
                </div>
                <div className="text-right">
                  <div className="font-mono-tab text-mint text-base font-medium">$66,870.95</div>
                  <div className="font-mono-tab text-[11px] text-mint">+2.41%</div>
                </div>
              </div>
              <div className="h-32">
                <CandleChart width={460} height={128} count={36} volatility={0.018} />
              </div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-3xl font-semibold text-ink leading-tight max-w-md"
            >
              Markets don't wait. Neither should your terminal.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="mt-3 text-sm text-ink-muted max-w-sm"
            >
              Real-time pricing, instant settlement, and a wallet ledger you can audit at a glance.
            </motion.p>
          </div>

          <p className="text-xs text-ink-faint">© {new Date().getFullYear()} CryptoVault. All rights reserved.</p>
        </div>
      </div>

      {/* ---------- form side ---------- */}
      <div className="w-full lg:w-1/2 flex flex-col">
        <div className="flex items-center justify-between p-6 lg:hidden">
          <Link to="/" className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-mint to-violet flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none">
                <path d="M12 2L4 6v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V6l-8-4z" fill="#05070D" />
              </svg>
            </span>
            <span className="font-display text-base font-semibold text-ink">CryptoVault</span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-sm">
            {/* Toggle pill — side by side register/login */}
            {!forgot && (
              <div className="relative grid grid-cols-2 mb-9 rounded-xl border border-white/10 bg-void-900/60 p-1">
                <motion.div
                  className="absolute inset-y-1 w-[calc(50%-4px)] rounded-lg bg-mint"
                  animate={{ x: mode === 'login' ? 0 : '100%' }}
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
                <button
                  onClick={() => setMode('login')}
                  className={`relative z-10 py-2.5 text-sm font-display font-semibold rounded-lg transition-colors ${
                    mode === 'login' ? 'text-void' : 'text-ink-muted'
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => setMode('register')}
                  className={`relative z-10 py-2.5 text-sm font-display font-semibold rounded-lg transition-colors ${
                    mode === 'register' ? 'text-void' : 'text-ink-muted'
                  }`}
                >
                  Registration
                </button>
              </div>
            )}

            <AnimatePresence mode="wait">
              {forgot ? (
                <ForgotPasswordForm key="forgot" onBack={() => setForgot(false)} />
              ) : mode === 'login' ? (
                <LoginForm key="login" onSwitch={() => setMode('register')} onForgot={() => setForgot(true)} />
              ) : (
                <RegisterForm key="register" onSwitch={() => setMode('login')} />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
