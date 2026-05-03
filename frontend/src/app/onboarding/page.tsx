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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center overflow-hidden relative">
      
      <div className="fixed inset-0 pointer-events-none transform-gpu">
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-violet-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70" />
      </div>

      <div className="w-full max-w-2xl px-6 relative z-10">
      <AnimatePresence mode="wait" custom={direction}>
          <motion.div key={step} custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease: "easeInOut" }} className="w-full">
            
            {step === 1 && <Step1Init formData={formData} updateFormData={updateFormData} onNext={nextStep} onPrev={() => router.push('/login')} />}
            {step === 2 && <Step2Hardware formData={formData} updateFormData={updateFormData} onNext={nextStep} onPrev={prevStep} />}
            {step === 3 && <Step3Biometrics onNext={nextStep} onPrev={prevStep} />}
            {step === 4 && <Step4Emergency onNext={nextStep} onPrev={prevStep} />} 
            {step === 5 && <Step5Gestures onNext={nextStep} onPrev={prevStep} />} 
            {step === 6 && <Step6Finalize formData={formData} />}

          </motion.div>
        </AnimatePresence>

        <div className="flex justify-center gap-3 mt-10 relative z-10">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-500 transform-gpu ${step === i ? 'w-10 bg-indigo-600' : step > i ? 'w-6 bg-indigo-300' : 'w-4 bg-slate-200'}`} />
          ))}
        </div>
      </div>
    </div>
  );
}