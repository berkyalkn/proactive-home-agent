"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Home,
  Zap,
  ShieldCheck,
  ArrowRight,
  Eye,
  Brain,
  Coffee,
  Moon,
  Sparkles,
  Smartphone
} from "lucide-react";

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setIsLoggedIn(true);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-100 selection:text-indigo-900 font-sans">
      
      <nav className="sticky top-0 z-50 bg-white/90 border-b border-slate-200 transform-gpu">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-md group-hover:shadow-indigo-500/30 transition-shadow will-change-transform">
              <Home className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">
              HOMIFY
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/dashboard" className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden md:block px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
                  Login
                </Link>
                <Link href="/register" className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm hover:shadow-indigo-500/20 transition-all">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center">
        
        <section className="w-full px-6 py-24 md:py-32 flex flex-col items-center text-center bg-gradient-to-b from-indigo-50/50 to-slate-50">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100/50 border border-indigo-200 rounded-full text-sm text-indigo-700 font-bold mb-8 shadow-sm">
              <Sparkles className="h-4 w-4" />
              <span>Meet the Next Generation of Smart Homes</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
              A home that <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                thinks for itself.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              Forget complicated apps and buttons. Homify learns your habits, sees when you enter a room, and takes care of your home—before you even have to ask.
            </p>

            <Link href={isLoggedIn ? "/dashboard" : "/register"} className="group inline-flex items-center gap-2 px-8 py-4 text-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-lg hover:shadow-indigo-500/30 transition-all transform-gpu hover:-translate-y-0.5 will-change-transform">
              {isLoggedIn ? "Open My Dashboard" : "Experience Homify"}
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </section>

        <section className="w-full max-w-5xl mx-auto px-6 py-20">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Why Homify?</h2>
            <p className="text-slate-500 text-lg">Because traditional smart homes aren't actually smart.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }} className="p-8 bg-slate-100 rounded-3xl border border-slate-200">
              <div className="w-12 h-12 bg-slate-200 text-slate-500 rounded-2xl flex items-center justify-center mb-6">
                <Smartphone className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">The Old Way: Reactive</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                You buy a smart bulb. To turn it on, you have to unlock your phone, find the app, wait for it to load, and press a button. It's just a glorified remote control.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }} className="p-8 bg-indigo-600 rounded-3xl border border-indigo-500 shadow-xl shadow-indigo-600/20 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
              <div className="w-12 h-12 bg-white/20 text-white rounded-2xl flex items-center justify-center mb-6 relative z-10">
                <Brain className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 relative z-10">The Homify Way: Proactive</h3>
              <p className="text-indigo-100 leading-relaxed relative z-10">
                You walk into the kitchen with groceries in your hands. Homify sees you, knows it's dark, and turns on the lights automatically. No apps, no buttons. Just living.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="w-full max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Designed for real life.</h2>
            <p className="text-slate-500 text-lg">How Homify makes your day easier, safer, and cheaper.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6">
                <Coffee className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Morning Routines</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                As soon as you wake up and enter the living room, the system gently turns on warm lights and starts the coffee maker.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Energy Saver</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Did you leave the heater on? Homify notices when a room is empty for too long and safely turns off high-power devices to lower your bills.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3 }} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Intelligent Security</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                It doesn't just detect motion; it recognizes faces. It knows the difference between you getting a midnight snack and a stranger at the door.
              </p>
            </motion.div>

          </div>
        </section>

        <section className="w-full bg-slate-900 text-white py-24 px-6 mt-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-16">How does it work?</h2>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-4 relative">
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-slate-800 -z-0 transform -translate-y-1/2"></div>

              <div className="flex-1 flex flex-col items-center relative z-10">
                <div className="w-20 h-20 rounded-full bg-slate-800 border-4 border-slate-900 flex items-center justify-center mb-4">
                  <Eye className="w-8 h-8 text-sky-400" />
                </div>
                <h3 className="font-bold text-lg mb-2">1. It Observes</h3>
                <p className="text-slate-400 text-sm px-4">Local cameras and sensors securely monitor the environment.</p>
              </div>

              <div className="flex-1 flex flex-col items-center relative z-10">
                <div className="w-20 h-20 rounded-full bg-indigo-600 border-4 border-slate-900 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(79,70,229,0.5)]">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">2. It Thinks</h3>
                <p className="text-slate-300 text-sm px-4">The built-in AI Agent processes data instantly without sending your life to the cloud.</p>
              </div>

              <div className="flex-1 flex flex-col items-center relative z-10">
                <div className="w-20 h-20 rounded-full bg-slate-800 border-4 border-slate-900 flex items-center justify-center mb-4">
                  <Home className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="font-bold text-lg mb-2">3. It Acts</h3>
                <p className="text-slate-400 text-sm px-4">Adjusts lights, locks doors, and manages power autonomously.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-950 text-slate-500 py-8 text-center text-sm border-t border-slate-900">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between">
          <p>© 2026 Homify. Privacy-First Smart Home.</p>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <Sparkles className="h-4 w-4" />
            <span>Built for the future.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}