'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, UserPlus, ArrowRight, ArrowLeft, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Link from 'next/link';

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

  const getStrengthColor = () => {
    if (strength === 0) return 'bg-slate-200';
    if (strength <= 25) return 'bg-red-500';
    if (strength <= 50) return 'bg-amber-500';
    if (strength <= 75) return 'bg-blue-500';
    return 'bg-emerald-500';
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
        role: "user", 
        face_embedding: null, 
        voice_embedding: null
      });
      
      setIsExiting(true);
      setTimeout(() => router.push('/login'), 600);
      
    } catch (err: any) {
      setError("Registration failed. This username or email might already be taken.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden font-sans">
      
      <div className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-violet-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 pointer-events-none" />
      <div className="absolute top-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 pointer-events-none" />

      <nav className="fixed top-0 left-0 w-full z-50 bg-white/60 backdrop-blur-md border-b border-slate-200/60 transform-gpu">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors group font-bold">
            <div className="p-1.5 bg-slate-100 group-hover:bg-indigo-50 rounded-lg transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </div>
            <span className="text-sm">Home</span>
          </Link>
          <Link href="/" className="flex items-center gap-3 group">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-md group-hover:shadow-indigo-500/30 transition-all transform-gpu">
              <Home className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">HOMIFY</span>
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center p-6 z-10 mt-16">
        <AnimatePresence>
          {!isExiting && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)", y: -20 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="w-full max-w-md bg-white border border-slate-200 p-8 rounded-[2rem] shadow-xl shadow-slate-200/50"
            >
              <div className="flex flex-col items-center mb-8 text-center">
                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 mb-5 text-indigo-600">
                  <UserPlus className="h-7 w-7" />
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Join Homify</h1>
                <p className="text-slate-500 mt-2 font-medium">Start your journey with your AI assistant.</p>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold">{error}</p>
                </motion.div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 ml-1 mb-1.5 block uppercase tracking-widest">Username</label>
                  <input
                    type="text"
                    autoFocus
                    className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium text-slate-900"
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 ml-1 mb-1.5 block uppercase tracking-widest">Email Address</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium text-slate-900"
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 ml-1 mb-1.5 block uppercase tracking-widest">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium text-slate-900"
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors">
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  
                  {password.length > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 px-1">
                      <div className="flex gap-1 h-1.5 w-full rounded-full overflow-hidden bg-slate-100">
                        <motion.div className={`h-full ${getStrengthColor()}`} initial={{ width: 0 }} animate={{ width: `${strength}%` }} transition={{ duration: 0.3 }} />
                      </div>
                      <div className="flex justify-between items-center mt-1.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Security</span>
                        <span className={`text-[10px] font-bold uppercase ${strength >= 75 ? 'text-emerald-600' : 'text-slate-500'}`}>{getStrengthText()}</span>
                      </div>
                    </motion.div>
                  )}
                </div>

                <button 
                  type="submit"
                  disabled={isLoading || strength < 25} 
                  className="w-full py-4 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed transform-gpu hover:-translate-y-0.5 will-change-transform"
                >
                  {isLoading ? "Creating..." : "Create Account"}
                  {!isLoading && <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />}
                </button>
              </form>
              
              <p className="mt-8 text-center text-sm font-medium text-slate-500">
                Already registered? <Link href="/login" className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors">Log in</Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}