'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Step1Init from '@/components/onboarding/Step1Init';
import Step2Hardware from '@/components/onboarding/Step2Hardware';
import Step3Biometrics from '@/components/onboarding/Step3Biometrics'; 
import Step4Emergency from '@/components/onboarding/Step4Emergency';  
import Step5Gestures from '@/components/onboarding/Step5Gestures';    
import Step6Finalize from '@/components/onboarding/Step6Finalize';   
import '@/app/landing.css';
import s from '@/components/auth/auth.module.css';

export interface OnboardingData {
    homeName: string; 
    assistantName: string;
    location: string;         
    householdType: string;    
    userAge: string;          
    topology: string;
    rooms: any[];
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  const [formData, setFormData] = useState<OnboardingData>({
    homeName: '',
    assistantName: '',
    location: '',
    householdType: '',
    userAge: '',
    topology: '',
    rooms: [],
  });

  const nextStep = () => { setDirection(1); setStep((prev) => prev + 1); };
  const prevStep = () => { setDirection(-1); setStep((prev) => prev - 1); };
  
  const updateFormData = (newData: Partial<OnboardingData>) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  };

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 400 : -400, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (dir: number) => ({ zIndex: 0, x: dir < 0 ? 400 : -400, opacity: 0 })
  };

  return (
    <div className="landing-scope">
      <div className={s.page}>
        {/* Animated background orbs (matching auth pages) */}
        <div className={s.orbWarm} style={{ top: '-20%', left: '-10%' }} />
        <div className={s.orbCool} style={{ bottom: '-20%', right: '-10%' }} />

        <main className={s.main}>
          <div style={{ width: '100%', maxWidth: 680, position: 'relative', zIndex: 10 }}>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                style={{ width: '100%' }}
              >
                {step === 1 && <Step1Init formData={formData} updateFormData={updateFormData} onNext={nextStep} onPrev={() => router.push('/login')} />}
                {step === 2 && <Step2Hardware formData={formData} updateFormData={updateFormData} onNext={nextStep} onPrev={prevStep} />}
                {step === 3 && <Step3Biometrics onNext={nextStep} onPrev={prevStep} />}
                {step === 4 && <Step4Emergency onNext={nextStep} onPrev={prevStep} />} 
                {step === 5 && <Step5Gestures onNext={nextStep} onPrev={prevStep} />} 
                {step === 6 && <Step6Finalize formData={formData} />}
              </motion.div>
            </AnimatePresence>

            {/* Dark-themed progress dots */}
            <div className={s.stepDots}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className={`${s.stepDot} ${
                    step === i ? s.stepDotActive : step > i ? s.stepDotDone : s.stepDotPending
                  }`}
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}