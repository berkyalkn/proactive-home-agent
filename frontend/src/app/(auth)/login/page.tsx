'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogIn, ArrowRight, Lock, Eye, EyeOff, AlertCircle,
  ScanFace, X, Loader2, Mail, CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/landing/Navbar/Navbar';
import '@/app/landing.css';
import s from '@/components/auth/auth.module.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState(false);


  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [forgotMessage, setForgotMessage] = useState('');

  const router = useRouter();


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);

      const res = await api.post('/auth/login', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const token = res.data.access_token;
      localStorage.setItem('token', token);
      localStorage.setItem('username', res.data.username);

      try {
        const meRes = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        setIsExiting(true);

        setTimeout(() => {
          if (meRes.data.is_onboarding_complete) {
            router.push('/dashboard');
          } else {
            router.push('/onboarding');
          }
        }, 600);
      } catch {
        setIsExiting(true);
        setTimeout(() => {
          router.push('/onboarding');
        }, 600);
      }
    } catch {
      setError("Incorrect username or password. Please try again.");
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotStatus('loading');
    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail });
      setForgotStatus('success');
      setForgotMessage(res.data.message);
    } catch (err) {
      const errorObj = err as { response?: { data?: { detail?: string } } };
      setForgotStatus('error');
      setForgotMessage(errorObj.response?.data?.detail || "An error occurred.");
    }
  };

  return (
    <div className="landing-scope">
      <div className={s.page}>
        <Navbar />

        {/* Animated background orbs */}
        <div className={s.orbWarm} style={{ top: '-20%', left: '-10%' }} />
        <div className={s.orbCool} style={{ bottom: '-20%', right: '-10%' }} />

        <main className={s.main}>
          <AnimatePresence>
            {/* ── Login Card ── */}
            {!isExiting && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)', y: -20 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className={s.card}
              >
                {/* Header */}
                <div>
                  <div className={s.headerIcon}>
                    <LogIn size={28} />
                  </div>
                  <h1 className={s.title}>Welcome Back</h1>
                  <p className={s.subtitle}>Access your proactive home manager.</p>
                </div>

                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={s.error}
                    style={{ marginTop: 24 }}
                  >
                    <AlertCircle size={20} className={s.errorIcon} />
                    <p className={s.errorText}>{error}</p>
                  </motion.div>
                )}

                {/* Form */}
                <form onSubmit={handleLogin} className={s.form}>
                  <div>
                    <label className={s.label}>Username</label>
                    <input
                      type="text"
                      autoFocus
                      className={s.input}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className={s.label}>Password</label>
                    <div className={s.inputWrapper}>
                      <Lock size={20} className={s.inputIcon} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className={`${s.input} ${s.inputPassword}`}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={s.inputToggle}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* Remember / Forgot */}
                  <div className={s.row}>
                    <label className={s.checkboxLabel} onClick={() => setRememberMe(!rememberMe)}>
                      <div className={`${s.checkbox} ${rememberMe ? s.checkboxActive : ''}`}>
                        {rememberMe && <div className={s.checkboxDot} />}
                      </div>
                      <span className={s.checkboxText}>Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotModalOpen(true);
                        setForgotStatus('idle');
                        setForgotEmail('');
                      }}
                      className={s.forgotLink}
                    >
                      Forgot?
                    </button>
                  </div>

                  {/* Submit */}
                  <button type="submit" disabled={isLoading} className={s.btnPrimary}>
                    {isLoading ? 'Authenticating...' : 'Continue to Control Center'}
                    {!isLoading && <ArrowRight size={20} />}
                  </button>
                </form>

                {/* Divider */}
                <div className={s.divider}>
                  <div className={s.dividerLine} />
                  <span className={s.dividerText}>OR</span>
                  <div className={s.dividerLine} />
                </div>

                {/* Face ID — temporarily disabled (Pi gallery empty after Mac migration) */}
                <button
                  disabled
                  title="Face ID is temporarily unavailable while the biometric system is being upgraded"
                  className={s.btnSecondary}
                  style={{ marginTop: 24, opacity: 0.4, cursor: 'not-allowed' }}
                >
                  <ScanFace size={20} /> Login with Face ID
                </button>

                {/* Register link */}
                <p className={s.footerText}>
                  New here?{' '}
                  <Link href="/register" className={s.footerLink}>
                    Create an account
                  </Link>
                </p>
              </motion.div>
            )}

          </AnimatePresence>

          {/* ── Forgot Password Modal ── */}
          <AnimatePresence>
            {isForgotModalOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={s.modalOverlay}
                  onClick={() => setIsForgotModalOpen(false)}
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className={s.modal}
                >
                  <button
                    onClick={() => setIsForgotModalOpen(false)}
                    className={s.modalClose}
                  >
                    <X size={20} />
                  </button>

                  <div style={{ textAlign: 'center', marginTop: 8 }}>
                    <div className={forgotStatus === 'success' ? s.modalIconSuccess : s.modalIcon}>
                      {forgotStatus === 'success' ? (
                        <CheckCircle2 size={24} />
                      ) : (
                        <Mail size={24} />
                      )}
                    </div>
                    <h2 className={s.modalTitle}>Reset Password</h2>
                    <p className={s.modalSubtitle}>
                      {forgotStatus === 'success'
                        ? "Check your inbox. We've sent you instructions to reset your password."
                        : 'Enter the email address associated with your account.'}
                    </p>
                  </div>

                  {forgotStatus === 'error' && (
                    <div className={s.error} style={{ marginTop: 20 }}>
                      <AlertCircle size={20} className={s.errorIcon} />
                      <span className={s.errorText}>{forgotMessage}</span>
                    </div>
                  )}

                  {forgotStatus !== 'success' ? (
                    <form onSubmit={handleForgotPassword} className={s.modalForm}>
                      <input
                        type="email"
                        autoFocus
                        placeholder="alex@homiee.com"
                        className={s.input}
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                      />
                      <button
                        type="submit"
                        disabled={forgotStatus === 'loading'}
                        className={s.btnPrimary}
                      >
                        {forgotStatus === 'loading' ? (
                          <>
                            <Loader2 size={20} className={s.spin} /> Sending...
                          </>
                        ) : (
                          'Send Reset Link'
                        )}
                      </button>
                    </form>
                  ) : (
                    <button
                      onClick={() => setIsForgotModalOpen(false)}
                      className={s.btnModalBack}
                    >
                      Back to Login
                    </button>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}