'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, LogIn, ArrowRight, ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
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
        
        if (meRes.data.has_face) {
          console.log("Registered biometric profile detected, redirecting to Dashboard...");
          router.push('/dashboard');
        } else {
          console.log("The incomplete biometric profile is being forwarded to Onboarding...");
          router.push('/onboarding');
        }
      } catch (meError) {
        console.warn("The user profile could not be verified; for security reasons, they are being redirected to Onboarding.", meError);
        router.push('/onboarding'); 
      }

    } catch (err: any) {
      alert("Incorrect username or password! Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 flex flex-col relative overflow-hidden">
      
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-indigo-200/20 blur-[120px] rounded-full"
        />
        <motion.div 
          animate={{ x: [0, -80, 0], y: [0, 100, 0], scale: [1.1, 1, 1.1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-violet-200/10 blur-[120px] rounded-full"
        />
      </div>

      <nav className="fixed top-0 left-0 w-full z-50 bg-white/40 backdrop-blur-md border-b border-slate-200/40">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors group">
            <div className="p-1.5 bg-slate-100 group-hover:bg-indigo-50 rounded-lg transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">Home Page</span>
          </Link>

          <Link href="/" className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
              <Home className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">HOMIFY</span>
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center p-6 z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white/70 backdrop-blur-2xl border border-slate-200/60 p-8 rounded-[2rem] shadow-2xl shadow-indigo-100/50"
        >
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 mb-5 relative">
              <LogIn className="h-7 w-7 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome Back</h1>
            <p className="text-slate-500 mt-2">Access your proactive home manager.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-400 ml-1 mb-1.5 block tracking-widest">USERNAME</label>
              <input
                type="text"
                className="w-full px-4 py-3.5 rounded-xl bg-slate-50/50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 ml-1 mb-1.5 block tracking-widest">PASSWORD</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-slate-50/50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 group"
            >
              {isLoading ? "Authenticating..." : "Continue to Control Center"}
              {!isLoading && <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>
          
          <p className="mt-8 text-center text-sm text-slate-500">
            New here? <Link href="/register" className="text-indigo-600 font-bold hover:underline">Create an account</Link>
          </p>
        </motion.div>
      </main>
    </div>
  );
}