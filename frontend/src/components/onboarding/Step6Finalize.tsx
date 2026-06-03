'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Activity, CheckCircle2, Loader2, BrainCircuit, ShieldCheck, Home, Hand, ShieldAlert, Layers } from 'lucide-react';
import { OnboardingData } from '@/app/onboarding/page';
import s from '@/components/auth/auth.module.css';

interface Props {
  formData: OnboardingData;
  onPrev?: () => void;
}

export default function Step6Finalize({ formData, onPrev }: Props) {
  const router = useRouter();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const BUILD_STEPS = [
    { id: 'db', label: `Personalizing ${formData.homeName || 'your home'}...`, icon: Home },
    { id: 'ws', label: `Connecting devices across ${formData.rooms?.length || 0} rooms...`, icon: Layers }, 
    { id: 'mqtt', label: 'Securing your privacy and Face ID...', icon: ShieldCheck },
    { id: 'sec', label: 'Activating your emergency SOS alerts...', icon: ShieldAlert }, 
    { id: 'gestures', label: 'Saving your custom hand gestures...', icon: Hand },
    { id: 'ai', label: `Waking up ${formData.assistantName || 'your smart assistant'}...`, icon: BrainCircuit },
  ];

  useEffect(() => {
    if (currentStepIndex < BUILD_STEPS.length) {
      const timer = setTimeout(() => {
        setCurrentStepIndex(prev => prev + 1);
      }, 1200); 
      return () => clearTimeout(timer);
    }
  }, [currentStepIndex, BUILD_STEPS.length]);

  const handleFinalize = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/onboarding/complete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.error("Failed to update onboarding status:", error);
    } finally {
      setIsSaving(false);
      router.push('/dashboard');
    }
  };

  const progress = Math.min((currentStepIndex / BUILD_STEPS.length) * 100, 100);
  const isFinished = currentStepIndex === BUILD_STEPS.length;

  return (
    <div className={s.cardWide} style={{ minHeight: 480, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
      <AnimatePresence mode="wait">
        
        {!isFinished ? (
          <motion.div 
            key="loading" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }} 
            className="w-full relative z-10 flex flex-col h-full text-left"
          >
            <div className="flex flex-col items-center" style={{ marginBottom: '32px' }}>
              <div className={s.headerIcon} style={{ background: 'rgba(196, 168, 224, 0.1)', borderColor: 'rgba(196, 168, 224, 0.15)', color: 'var(--accent-orange)' }}>
                <Activity size={28} className="animate-pulse" />
              </div>

              <h2 className={s.title} style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Almost Ready!</h2>
              <p className={s.subtitle} style={{ maxWidth: 440, margin: '8px auto 0', color: 'rgba(255, 255, 255, 0.8)' }}>
                Please wait while we put the finishing touches on your smart home.
              </p>
            </div>

            <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden relative" style={{ marginBottom: '24px' }}>
              <motion.div 
                className="h-full bg-gradient-to-r from-[var(--accent-orange)] to-[var(--accent-peach)] rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {BUILD_STEPS.map((step, index) => {
                const isCompleted = currentStepIndex > index;
                const isCurrent = currentStepIndex === index;

                return (
                  <div 
                    key={step.id} 
                    className="flex items-center justify-between p-4 rounded-xl border transition-all duration-300"
                    style={
                      isCurrent 
                        ? { background: 'rgba(196, 168, 224, 0.05)', borderColor: 'rgba(196, 168, 224, 0.25)' }
                        : { background: 'rgba(255, 255, 255, 0.02)', borderColor: 'var(--border-card)', opacity: index > currentStepIndex ? 0.3 : 1 }
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="p-2 rounded-lg transition-colors duration-300"
                        style={
                          isCompleted 
                            ? { background: 'rgba(196, 168, 224, 0.15)', color: 'var(--accent-orange)' }
                            : isCurrent 
                            ? { background: 'rgba(196, 168, 224, 0.1)', color: 'var(--accent-peach)' }
                            : { background: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255, 255, 255, 0.2)' }
                        }
                      >
                        <step.icon size={18} />
                      </div>
                      <span 
                        className="text-base font-semibold"
                        style={{ color: isCurrent || isCompleted ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.4)' }}
                      >
                        {step.label}
                      </span>
                    </div>
                    
                    <div>
                      {isCompleted ? (
                        <CheckCircle2 size={20} className="text-[var(--accent-orange)]" />
                      ) : isCurrent ? (
                        <Loader2 size={20} className="text-[var(--accent-peach)] animate-spin" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-white/10" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="success" 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
            className="w-full relative z-10 flex flex-col h-full text-left"
          >
            <div className="flex flex-col items-center" style={{ marginBottom: '32px' }}>
              <div className={s.headerIcon} style={{ background: 'rgba(196, 168, 224, 0.15)', borderColor: 'rgba(196, 168, 224, 0.3)', color: 'var(--accent-orange)', width: 64, height: 64, marginBottom: 16 }}>
                <CheckCircle2 size={36} className="text-[var(--accent-orange)]" />
              </div>

              <h2 className={s.title} style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Setup Complete!</h2>
              <p className={s.subtitle} style={{ maxWidth: 440, margin: '8px auto 0', color: 'rgba(255, 255, 255, 0.8)' }}>
                Congratulations! Your smart home is now active, secure, and proactive.
              </p>
            </div>

            <div>
              {/* Setup Summary Panel */}
              <div 
                className="border rounded-2xl p-5"
                style={{ background: 'rgba(255, 255, 255, 0.02)', borderColor: 'var(--border-card)', marginBottom: '20px' }}
              >
                <h4 
                  className="text-xs font-extrabold tracking-wider uppercase border-b border-white/5 pb-2"
                  style={{ 
                    color: 'rgba(255, 255, 255, 0.8)', 
                    paddingLeft: '12px' 
                  }}
                >
                  Setup Summary
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: '16px', columnGap: '16px', marginTop: '16px', marginLeft: '12px', marginBottom: '12px' }}>
                  <div>
                    <span className="block text-[11px] uppercase font-semibold" style={{ color: 'rgba(255, 255, 255, 0.8)', opacity: 0.65 }}>Home Name</span>
                    <span className="text-sm font-bold" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>{formData.homeName || 'My Home'}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] uppercase font-semibold" style={{ color: 'rgba(255, 255, 255, 0.8)', opacity: 0.65 }}>Smart Assistant</span>
                    <span className="text-sm font-bold" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>{formData.assistantName || 'HOMIEE'}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] uppercase font-semibold" style={{ color: 'rgba(255, 255, 255, 0.8)', opacity: 0.65 }}>Location / Rooms</span>
                    <span className="text-sm font-bold" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      {formData.location || 'Not Specified'} / {formData.rooms?.length || 0} Rooms
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] uppercase font-semibold" style={{ color: 'rgba(255, 255, 255, 0.8)', opacity: 0.65 }}>Topology</span>
                    <span className="text-sm font-bold" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>{formData.topology || 'Apartment'}</span>
                  </div>
                </div>
              </div>

              {/* List of Activated Features */}
              <div 
                className="border rounded-2xl p-5"
                style={{ background: 'rgba(255, 255, 255, 0.02)', borderColor: 'var(--border-card)', marginBottom: '28px' }}
              >
                <h4 
                  className="text-xs font-extrabold tracking-wider uppercase border-b border-white/5 pb-2"
                  style={{ 
                    color: 'rgba(255, 255, 255, 0.8)', 
                    paddingLeft: '12px' 
                  }}
                >
                  Activated Features
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px', marginLeft: '12px', marginBottom: '12px' }}>
                  <div className="flex items-center gap-3 text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    <CheckCircle2 size={16} className="text-[var(--accent-orange)] shrink-0" />
                    <span>Biometric Identity Verification (Face & Voice ID) active</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    <CheckCircle2 size={16} className="text-[var(--accent-orange)] shrink-0" />
                    <span>24/7 AI Fall Detection Security Protocol enabled</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    <CheckCircle2 size={16} className="text-[var(--accent-orange)] shrink-0" />
                    <span>Omnichannel (SMS, Call, Telegram) Emergency SOS online</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    <CheckCircle2 size={16} className="text-[var(--accent-orange)] shrink-0" />
                    <span>Custom Hand Gesture control configurations completed</span>
                  </div>
                </div>
              </div>

              {/* Action Row */}
              <div className={s.actionRow} style={{ width: '100%', display: 'flex', gap: 24, alignItems: 'stretch' }}>
                {onPrev && (
                  <button 
                    onClick={onPrev} 
                    className={s.btnSecondary} 
                    style={{ width: 90, flex: '0 0 90px', padding: '16px' }}
                  >
                    Back
                  </button>
                )}
                <button 
                  onClick={handleFinalize} 
                  disabled={isSaving}
                  className={s.btnPrimary} 
                  style={{ flex: 1, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={20} className="animate-spin" /> Finalizing...
                    </>
                  ) : (
                    'Open Dashboard'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}