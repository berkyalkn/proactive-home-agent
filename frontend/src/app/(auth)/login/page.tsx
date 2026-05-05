'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, LogIn, ArrowRight, ArrowLeft, Lock, Eye, EyeOff, AlertCircle, ScanFace, X, Loader2, Mail, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

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
    } catch (err) {
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
        image_base64: imageBase64
      });

      const token = res.data.access_token;
      localStorage.setItem('token', token);
      localStorage.setItem('username', res.data.username);

      stopCamera();
      setIsCameraActive(false);
      
      try {
        const meRes = await api.get('/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        setIsExiting(true);
        setTimeout(() => {
          if (meRes.data.is_onboarding_complete) {
            router.push('/dashboard');
          } else {
            router.push('/onboarding');
          }
        }, 600);
        
      } catch (meError) {
        setIsExiting(true);
        setTimeout(() => router.push('/onboarding'), 600);
      }

    } catch (err: any) {
      setError(err.response?.data?.detail || "Face not recognized. Try again.");
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
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      const token = res.data.access_token;
      localStorage.setItem('token', token);
      localStorage.setItem('username', res.data.username);
      
      try {
        const meRes = await api.get('/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        setIsExiting(true);
        
        setTimeout(() => {
          if (meRes.data.is_onboarding_complete) {
            router.push('/dashboard');
          } else {
            router.push('/onboarding');
          }
        }, 600);
        
      } catch (meError) {
        setIsExiting(true);
        setTimeout(() => router.push('/onboarding'), 600);
      }

    } catch (err: any) {
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
    } catch (err: any) {
      setForgotStatus('error');
      setForgotMessage(err.response?.data?.detail || "An error occurred.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden font-sans">
      
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-violet-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 pointer-events-none" />

      <nav className="fixed top-0 left-0 w-full z-50 bg-white/60 backdrop-blur-md border-b border-slate-200/60 transform-gpu">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-bold">
            <div className="p-1.5 bg-slate-100 hover:bg-indigo-50 rounded-lg transition-colors"><ArrowLeft className="h-4 w-4" /></div>
            <span className="text-sm">Home</span>
          </Link>
          <Link href="/" className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-md"><Home className="h-5 w-5 text-white" /></div>
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">HOMIFY</span>
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center p-6 z-10 mt-16">
        <AnimatePresence>
          {!isExiting && !isCameraActive && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)", y: -20 }} 
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="w-full max-w-md bg-white border border-slate-200 p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 relative"
            >
              <div className="flex flex-col items-center mb-8 text-center">
                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 mb-5 text-indigo-600"><LogIn className="h-7 w-7" /></div>
                <h1 className="text-3xl font-extrabold text-slate-900">Welcome Back</h1>
                <p className="text-slate-500 mt-2 font-medium">Access your proactive home manager.</p>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold">{error}</p>
                </motion.div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 ml-1 mb-1.5 block uppercase tracking-widest">Username</label>
                  <input type="text" autoFocus className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900" onChange={(e) => setUsername(e.target.value)} required />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 ml-1 mb-1.5 block uppercase tracking-widest">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input type={showPassword ? "text" : "password"} className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900" onChange={(e) => setPassword(e.target.value)} required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"><Eye className="h-5 w-5" /></button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 pb-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${rememberMe ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-50 border-slate-300'}`}>
                      {rememberMe && <div className="w-2 h-2 bg-white rounded-sm" />}
                    </div>
                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900" onClick={() => setRememberMe(!rememberMe)}>Remember me</span>
                  </label>
                  <button type="button" onClick={() => { setIsForgotModalOpen(true); setForgotStatus('idle'); setForgotEmail(''); }} className="text-sm font-bold text-indigo-600 hover:text-indigo-700">
                    Forgot?
                  </button>
                </div>

                <button type="submit" disabled={isLoading} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                  {isLoading ? "Authenticating..." : "Continue to Control Center"}
                  {!isLoading && <ArrowRight className="h-5 w-5" />}
                </button>
              </form>

              <div className="mt-6 flex items-center gap-4">
                <div className="flex-1 h-px bg-slate-200"></div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">OR</span><div className="flex-1 h-px bg-slate-200"></div>
              </div>

              <button onClick={openCamera} className="w-full mt-6 py-3.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                <ScanFace className="h-5 w-5" /> Login with Face ID
              </button>
              
              <p className="mt-8 text-center text-sm font-medium text-slate-500">
                New here? <Link href="/register" className="text-indigo-600 font-bold hover:text-indigo-700">Create an account</Link>
              </p>
            </motion.div>
          )}

          {isCameraActive && !isExiting && (
             <motion.div 
             initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
             className="w-full max-w-sm bg-white border border-slate-200 p-6 rounded-[2rem] shadow-2xl flex flex-col items-center relative overflow-hidden"
           >
             <button onClick={() => { stopCamera(); setIsCameraActive(false); }} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors z-20">
               <X className="h-5 w-5 text-slate-600" />
             </button>

             <div className="text-center mb-6 mt-4">
               <h2 className="text-xl font-bold text-slate-900">Face Recognition</h2>
               <p className="text-sm text-slate-500 mt-1 font-medium">Position your face in the frame.</p>
             </div>

             <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-indigo-100 mb-8 bg-slate-900 shadow-inner">
               <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
               {isScanningFace && (
                 <motion.div animate={{ y: [0, 256, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute top-0 left-0 w-full h-1 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,1)] z-10"/>
               )}
             </div>

             {error && <p className="text-red-500 text-sm font-bold mb-4 text-center">{error}</p>}

             <button onClick={handleFaceScan} disabled={isScanningFace} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70">
               {isScanningFace ? <><Loader2 className="animate-spin h-5 w-5" /> Verifying Identity...</> : <><ScanFace className="h-5 w-5" /> Scan Face</>}
             </button>

             <canvas ref={canvasRef} className="hidden" />
           </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isForgotModalOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
                onClick={() => setIsForgotModalOpen(false)}
              />
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed z-50 w-full max-w-sm bg-white border border-slate-200 p-8 rounded-[2rem] shadow-2xl"
              >
                <button onClick={() => setIsForgotModalOpen(false)} className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                </button>

                <div className="flex flex-col items-center text-center mb-6 mt-2">
                  <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100 mb-4 text-indigo-600">
                    {forgotStatus === 'success' ? <CheckCircle2 className="h-6 w-6 text-emerald-600" /> : <Mail className="h-6 w-6" />}
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900">Reset Password</h2>
                  <p className="text-sm text-slate-500 mt-2 font-medium leading-relaxed">
                    {forgotStatus === 'success' 
                      ? "Check your inbox. We've sent you instructions to reset your password." 
                      : "Enter the email address associated with your account."}
                  </p>
                </div>

                {forgotStatus === 'error' && (
                  <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-red-600 text-sm font-semibold">
                    <AlertCircle className="h-5 w-5 shrink-0" /> {forgotMessage}
                  </div>
                )}

                {forgotStatus !== 'success' ? (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div>
                      <input 
                        type="email" 
                        autoFocus
                        placeholder="alex@homify.com" 
                        className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900" 
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)} 
                        required 
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={forgotStatus === 'loading'}
                      className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {forgotStatus === 'loading' ? <><Loader2 className="animate-spin h-5 w-5" /> Sending...</> : "Send Reset Link"}
                    </button>
                  </form>
                ) : (
                  <button 
                    onClick={() => setIsForgotModalOpen(false)}
                    className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
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
  );
}