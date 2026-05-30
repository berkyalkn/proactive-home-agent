'use client';
import { useState, useRef, useEffect } from 'react';
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

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isScanningFace, setIsScanningFace] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [forgotMessage, setForgotMessage] = useState('');

  const router = useRouter();

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const openCamera = async () => {
    setError(null);
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setError("Camera access denied or device not found.");
      setIsCameraActive(false);
    }
  };

  const handleFaceScan = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsScanningFace(true);
    setError(null);

    const context = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context?.drawImage(videoRef.current, 0, 0);

    const imageBase64 = canvasRef.current.toDataURL('image/jpeg', 0.8);

    try {
      const res = await api.post('/auth/biometric-login', {
        image_base64: imageBase64,
      });

      const token = res.data.access_token;
      localStorage.setItem('token', token);
      localStorage.setItem('username', res.data.username);

      stopCamera();
      setIsCameraActive(false);

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
    } catch (err) {
      const errorObj = err as { response?: { data?: { detail?: string } } };
      setError(errorObj.response?.data?.detail || "Face not recognized. Try again.");
      setIsScanningFace(false);
    }
  };

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
            {!isExiting && !isCameraActive && (
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

                {/* Face ID */}
                <button onClick={openCamera} className={s.btnSecondary} style={{ marginTop: 24 }}>
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

            {/* ── Camera Card (Face ID) ── */}
            {isCameraActive && !isExiting && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={s.cameraCard}
              >
                <button
                  onClick={() => {
                    stopCamera();
                    setIsCameraActive(false);
                  }}
                  className={s.cameraClose}
                >
                  <X size={20} />
                </button>

                <div className={s.cameraHeader}>
                  <h2 className={s.cameraTitle}>Face Recognition</h2>
                  <p className={s.cameraSubtitle}>Position your face in the frame.</p>
                </div>

                <div className={s.cameraCircle}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={s.cameraVideo}
                  />
                  {isScanningFace && (
                    <motion.div
                      animate={{ y: [0, 256, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className={s.scanLine}
                    />
                  )}
                </div>

                {error && <p className={s.cameraError}>{error}</p>}

                <button
                  onClick={handleFaceScan}
                  disabled={isScanningFace}
                  className={s.btnPrimary}
                >
                  {isScanningFace ? (
                    <>
                      <Loader2 size={20} className={s.spin} /> Verifying Identity...
                    </>
                  ) : (
                    <>
                      <ScanFace size={20} /> Scan Face
                    </>
                  )}
                </button>

                <canvas ref={canvasRef} className={s.hidden} />
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
                        placeholder="alex@homify.com"
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