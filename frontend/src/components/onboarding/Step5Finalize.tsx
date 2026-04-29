'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Activity, Server, CheckCircle2, Loader2, BrainCircuit, ShieldCheck, Home, Hand } from 'lucide-react';
import { OnboardingData } from '@/app/onboarding/page';

interface Props {
  formData: OnboardingData;
}

export default function Step5Finalize({ formData }: Props) {
  const router = useRouter();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const BUILD_STEPS = [
    { id: 'db', label: `Compiling rules for ${formData.homeName || 'your home'}`, icon: Home },
    { id: 'ws', label: `Wiring ${formData.rooms.length} spatial nodes`, icon: Server },
    { id: 'mqtt', label: 'Encrypting IoT & Biometric signatures', icon: ShieldCheck },
    { id: 'gestures', label: 'Syncing gesture mappings & SOS protocols', icon: Hand },
    { id: 'ai', label: `Initializing LangGraph Agent (${formData.assistantName || 'AI'})`, icon: BrainCircuit },
  ];

  useEffect(() => {
    if (currentStepIndex < BUILD_STEPS.length) {
      const timer = setTimeout(() => {
        setCurrentStepIndex(prev => prev + 1);
      }, 1600); 
      return () => clearTimeout(timer);
    } else {
      const finalTimer = setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
      return () => clearTimeout(finalTimer);
    }
  }, [currentStepIndex, BUILD_STEPS.length, router]);

  const progress = Math.min(((currentStepIndex) / BUILD_STEPS.length) * 100, 100);

  return (
    <div className="bg-white border border-slate-200 p-8 md:p-10 rounded-[2rem] shadow-xl shadow-slate-200/50 w-full max-w-2xl mx-auto relative overflow-hidden transform-gpu">
      
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-50 to-white pointer-events-none" />

      <div className="flex flex-col items-center mb-8 relative z-10">
        <div className="relative mb-5">
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} 
            transition={{ duration: 2, repeat: Infinity }} 
            className="absolute inset-0 bg-indigo-300 rounded-full blur-xl" 
          />
          <div className="relative p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/30 text-white transform-gpu">
            <Activity className="w-8 h-8" />
            <div className="absolute -top-2 -right-2 p-1.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm">
              <CheckCircle2 className="w-3 h-3 text-white" />
            </div>
          </div>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 text-center tracking-tight mb-2">Building Your Dashboard</h2>
        <p className="text-slate-500 text-center font-medium">Please wait while we assemble your Smart Home core.</p>
      </div>
      
      <div className="space-y-6 relative z-10">
        
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-indigo-600 rounded-full relative"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <div className="absolute top-0 right-0 bottom-0 w-20 bg-gradient-to-r from-transparent to-white/40 blur-[2px]" />
          </motion.div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
          {BUILD_STEPS.map((step, index) => {
            const isCompleted = currentStepIndex > index;
            const isCurrent = currentStepIndex === index;

            return (
              <div 
                key={step.id} 
                className={`flex items-center justify-between p-3 rounded-xl transition-all duration-500 ${
                  isCurrent ? 'bg-white shadow-sm border border-slate-200 scale-[1.02]' : 'border border-transparent'
                } ${index > currentStepIndex ? 'opacity-40' : 'opacity-100'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg transition-colors duration-500 ${isCompleted ? 'bg-emerald-100 text-emerald-600' : isCurrent ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
                    <step.icon className="w-4 h-4" />
                  </div>
                  <span className={`font-bold text-sm transition-colors duration-500 ${isCompleted ? 'text-slate-800' : isCurrent ? 'text-indigo-900' : 'text-slate-500'}`}>
                    {step.label}
                  </span>
                </div>
                
                <div>
                  {isCompleted ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </motion.div>
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-200" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <AnimatePresence>
          {currentStepIndex >= BUILD_STEPS.length && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="text-center pt-2"
            >
              <p className="text-emerald-600 font-bold text-sm flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> System Online. Redirecting...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}