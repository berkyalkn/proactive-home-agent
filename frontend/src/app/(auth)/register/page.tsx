'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, ArrowRight, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/landing/Navbar/Navbar';
import '@/app/landing.css';
import s from '@/components/auth/auth.module.css';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState(false);

  const [strength, setStrength] = useState(0);

  useEffect(() => {
    let score = 0;
    if (password.length >= 8) score += 25;
    if (/[A-Z]/.test(password)) score += 25;
    if (/[0-9]/.test(password)) score += 25;
    if (/[^A-Za-z0-9]/.test(password)) score += 25;
    setStrength(score);
  }, [password]);

  const getStrengthClass = () => {
    if (strength <= 25) return s.strengthWeak;
    if (strength <= 50) return s.strengthFair;
    if (strength <= 75) return s.strengthGood;
    return s.strengthStrong;
  };

  const getStrengthText = () => {
    if (strength === 0) return '';
    if (strength <= 25) return 'Weak';
    if (strength <= 50) return 'Fair';
    if (strength <= 75) return 'Good';
    return 'Strong';
  };

  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await api.post('/auth/register', {
        username,
        email,
        password,
        role: 'user',
        face_embedding: null,
        voice_embedding: null,
      });

      setIsExiting(true);
      setTimeout(() => router.push('/login'), 600);
    } catch {
      setError('Registration failed. This username or email might already be taken.');
      setIsLoading(false);
    }
  };

  return (
    <div className="landing-scope">
      <div className={s.page}>
        <Navbar />

        {/* Animated background orbs */}
        <div className={s.orbCool} style={{ top: '-20%', right: '-10%' }} />
        <div className={s.orbWarm} style={{ bottom: '-20%', left: '-10%' }} />

        <main className={s.main}>
          <AnimatePresence>
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
                    <UserPlus size={28} />
                  </div>
                  <h1 className={s.title}>Join Homify</h1>
                  <p className={s.subtitle}>Start your journey with your AI assistant.</p>
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
                <form onSubmit={handleRegister} className={s.form}>
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
                    <label className={s.label}>Email Address</label>
                    <input
                      type="email"
                      className={s.input}
                      onChange={(e) => setEmail(e.target.value)}
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

                    {/* Password strength meter */}
                    {password.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className={s.strengthContainer}
                      >
                        <div className={s.strengthTrack}>
                          <motion.div
                            className={`${s.strengthFill} ${getStrengthClass()}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${strength}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <div className={s.strengthLabels}>
                          <span className={s.strengthLabel}>Security</span>
                          <span
                            className={`${s.strengthValue} ${
                              strength >= 75 ? s.strengthValueStrong : ''
                            }`}
                          >
                            {getStrengthText()}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isLoading || strength < 25}
                    className={s.btnPrimary}
                    style={{ marginTop: 8 }}
                  >
                    {isLoading ? 'Creating...' : 'Create Account'}
                    {!isLoading && <ArrowRight size={20} />}
                  </button>
                </form>

                {/* Login link */}
                <p className={s.footerText}>
                  Already registered?{' '}
                  <Link href="/login" className={s.footerLink}>
                    Log in
                  </Link>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}