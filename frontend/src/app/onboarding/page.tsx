'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Step1Init from '@/components/onboarding/Step1Init';
import Step2Hardware from '@/components/onboarding/Step2Hardware';
import Step3Network from '@/components/onboarding/Step3Network';
import Step4Biometrics from '@/components/onboarding/Step4Biometrics';

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
  
  const updateFormData = (newData: Partial<OnboardingData>) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  };

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 400 : -400, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (dir: number) => ({ zIndex: 0, x: dir < 0 ? 400 : -400, opacity: 0 })
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 flex flex-col items-center justify-center overflow-hidden relative">
      <div className="fixed inset-0 pointer-events-none opacity-60">
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 8, repeat: Infinity }} className="absolute top-[10%] left-[20%] w-[40vw] h-[40vw] bg-indigo-200/40 blur-[120px] rounded-full" />
        <motion.div animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 10, repeat: Infinity }} className="absolute bottom-[10%] right-[20%] w-[30vw] h-[30vw] bg-violet-200/40 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-2xl px-6 relative z-10">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div key={step} custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease: "easeInOut" }} className="w-full">
            
            {step === 1 && <Step1Init formData={formData} updateFormData={updateFormData} onNext={nextStep} />}
            {step === 2 && <Step2Hardware formData={formData} updateFormData={updateFormData} onNext={nextStep} />}
            {step === 3 && <Step3Network onNext={nextStep} />}
            {step === 4 && <Step4Biometrics />}

          </motion.div>
        </AnimatePresence>

        <div className="flex justify-center gap-3 mt-10 relative z-10">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step === i ? 'w-10 bg-indigo-600' : step > i ? 'w-6 bg-indigo-300' : 'w-4 bg-slate-200'}`} />
          ))}
        </div>
      </div>
    </div>
  );
}