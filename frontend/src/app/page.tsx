"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Home,
  Zap,
  Shield,
  Thermometer,
  ArrowRight,
  Smartphone,
  Brain,
  Wifi,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Automation",
    description: "Intelligent decisions that adapt to your lifestyle",
  },
  {
    icon: Shield,
    title: "Advanced Security",
    description: "Real-time monitoring with motion & camera alerts",
  },
  {
    icon: Thermometer,
    title: "Climate Control",
    description: "Temperature, humidity & air quality optimization",
  },
  {
    icon: Zap,
    title: "Energy Efficiency",
    description: "Smart power management to reduce your bills",
  },
];

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setIsLoggedIn(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 flex flex-col">
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-slate-200/60">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
              <Home className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">
              HOMIFY
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-5 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-all"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="max-w-4xl mx-auto text-center py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-sm text-indigo-700 font-medium mb-8">
              <Wifi className="h-4 w-4" />
              <span>Proactive Smart Home Platform</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
              Smart Home
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                Management.
              </span>
              <br />
              Made Simple.
            </h1>

            <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
              Your intelligent home assistant that learns, adapts, and keeps
              everything running smoothly — from lighting to security.
            </p>

            <div className="flex items-center gap-4 justify-center">
              <Link
                href={isLoggedIn ? "/dashboard" : "/register"}
                className="group inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
              >
                {isLoggedIn ? "Back to Dashboard" : "Get Started"}
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="max-w-5xl mx-auto w-full pb-20"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="group p-6 bg-white/60 backdrop-blur-sm border border-slate-200/60 rounded-2xl hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 hover:border-indigo-200/60 transition-all duration-300 cursor-default"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.4 + index * 0.1,
                  ease: "easeOut",
                }}
              >
                <div className="p-3 bg-indigo-50 rounded-xl w-fit mb-4 group-hover:bg-indigo-100 transition-colors">
                  <feature.icon className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1.5">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="max-w-3xl mx-auto w-full pb-16 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          <div className="relative p-8 bg-gradient-to-b from-indigo-50/80 to-white rounded-3xl border border-indigo-100/50">
            <div className="flex items-center justify-center gap-8 flex-wrap">
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center">
                  <Smartphone className="h-7 w-7 text-indigo-600" />
                </div>
                <span className="text-xs font-medium text-slate-500">Control</span>
              </div>
              <div className="text-slate-300 text-2xl">→</div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center">
                  <Brain className="h-7 w-7 text-violet-600" />
                </div>
                <span className="text-xs font-medium text-slate-500">AI Agent</span>
              </div>
              <div className="text-slate-300 text-2xl">→</div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
                  <Home className="h-7 w-7 text-emerald-600" />
                </div>
                <span className="text-xs font-medium text-slate-500">Smart Home</span>
              </div>
            </div>
            <p className="text-sm text-slate-400 mt-6">
              Manage your entire home from a single platform
            </p>
          </div>
        </motion.div>
      </main>

      <footer className="border-t border-slate-200/60 bg-white/50">
        <div className="container mx-auto px-6 py-6 flex items-center justify-between">
          <p className="text-sm text-slate-400">
            © 2026 Homify. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Home className="h-4 w-4" />
            <span>Proactive Smart Home</span>
          </div>
        </div>
      </footer>
    </div>
  );
}