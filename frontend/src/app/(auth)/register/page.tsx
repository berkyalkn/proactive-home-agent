'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { Home, UserPlus, ArrowRight, ArrowLeft, Lock } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/auth/register', {
        username,
        password,
        role: "user", 
        face_embedding: null, 
        voice_embedding: null
      });
      setTimeout(() => router.push('/login'), 500);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 flex flex-col">

      <nav className="bg-white/70 backdrop-blur-xl border-b border-slate-200/60">
        <div className="container mx-auto px-6 py-4">
          <Link href="/" className="flex items-center gap-3 w-fit">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
              <Home className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">HOMIFY</span>
          </Link>
        </div>
      </nav>


      <nav className="fixed top-0 left-0 w-full z-50 bg-white/40 backdrop-blur-md border-b border-slate-200/40">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors group"
          >
            <div className="p-1.5 bg-slate-100 group-hover:bg-indigo-50 rounded-lg transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">Return to Home Page</span>
          </Link>

          <Link href="/" className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
              <Home className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">HOMIFY</span>
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-slate-200/60 p-8 rounded-3xl shadow-xl shadow-slate-100/50"
        >

          <div className="flex flex-col items-center mb-10 text-center">
            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 mb-5 relative">
              <UserPlus className="h-7 w-7 text-indigo-600" />
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"
              />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create Account</h1>
            <p className="text-slate-500 mt-2 max-w-xs">Start your proactive smart home journey in seconds.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="relative">
              <label className="text-xs font-semibold text-slate-400 ml-1 mb-1.5 block">USERNAME</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="agent_bob"
                  className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-900 placeholder:text-slate-400"
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="relative">
              <label className="text-xs font-semibold text-slate-400 ml-1 mb-1.5 block">PASSWORD</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-900 placeholder:text-slate-400"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 group"
            >
              {isLoading ? "Creating..." : "Get Started Now"}
              {!isLoading && <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>
          
          <p className="mt-8 text-center text-sm text-slate-500">
            Already have an account? <Link href="/login" className="text-indigo-600 font-semibold hover:text-indigo-700">Log In</Link>
          </p>
        </motion.div>
      </main>
    </div>
  );
}