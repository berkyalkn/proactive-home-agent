'use client';
import { Bot, ChevronRight, MapPin, Users, User, Home, Sparkles, ChevronDown } from 'lucide-react';
import { OnboardingData } from '@/app/onboarding/page';

interface Props {
  formData: OnboardingData;
  updateFormData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrev?: () => void;
}

export default function Step1Init({ formData, updateFormData, onNext, onPrev }: Props) {
  const isComplete = formData.homeName && formData.assistantName && formData.location && formData.householdType && formData.userAge;

  return (
    <div className="bg-white border border-slate-200 p-8 md:p-10 rounded-[2rem] shadow-xl shadow-slate-200/50 w-full max-w-2xl mx-auto relative overflow-hidden transform-gpu">
      
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-50 to-white pointer-events-none" />

      <div className="flex flex-col items-center mb-8 relative z-10">
        <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/30 mb-5 relative transform-gpu">
          <Bot className="w-8 h-8 text-white" />
          <div className="absolute -top-2 -right-2 p-1.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 text-center tracking-tight mb-2">Welcome to Homify</h2>
        <p className="text-slate-500 text-center font-medium">Let's give your AI assistant some context.</p>
      </div>
      
      <div className="space-y-5 relative z-10">
        
        <div className="flex items-start gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
          <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <p className="text-[13px] font-medium text-indigo-900/80 leading-relaxed">
            <strong className="text-indigo-700">Why do we need this?</strong> The LangGraph AI Agent uses your household type and age to tailor proactive decisions (e.g., enabling quiet hours for roommates or adjusting climate for kids).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-[11px] uppercase font-bold text-slate-400 ml-1 mb-1.5 flex items-center gap-1.5 tracking-widest">
              <Home className="w-3.5 h-3.5" /> Home Name
            </label>
            <input 
              type="text" 
              placeholder="e.g. Berkay's Villa" 
              value={formData.homeName} 
              onChange={(e) => updateFormData({ homeName: e.target.value })} 
              className="w-full px-4 py-3.5 text-sm font-medium text-slate-900 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none transition-all" 
            />
          </div>
          <div>
            <label className="text-[11px] uppercase font-bold text-slate-400 ml-1 mb-1.5 flex items-center gap-1.5 tracking-widest">
              <Bot className="w-3.5 h-3.5" /> Assistant Name
            </label>
            <input 
              type="text" 
              placeholder="e.g. Bob" 
              value={formData.assistantName} 
              onChange={(e) => updateFormData({ assistantName: e.target.value })} 
              className="w-full px-4 py-3.5 text-sm font-medium text-slate-900 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none transition-all" 
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] uppercase font-bold text-slate-400 ml-1 mb-1.5 flex items-center gap-1.5 tracking-widest">
            <MapPin className="w-3.5 h-3.5" /> Location (For Weather AI)
          </label>
          <input 
            type="text" 
            placeholder="e.g. Istanbul, Turkey" 
            value={formData.location} 
            onChange={(e) => updateFormData({ location: e.target.value })} 
            className="w-full px-4 py-3.5 text-sm font-medium text-slate-900 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none transition-all" 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="relative">
            <label className="text-[11px] uppercase font-bold text-slate-400 ml-1 mb-1.5 flex items-center gap-1.5 tracking-widest">
              <Users className="w-3.5 h-3.5" /> Household Type
            </label>
            <div className="relative">
              <select 
                value={formData.householdType} 
                onChange={(e) => updateFormData({ householdType: e.target.value })} 
                className="w-full px-4 py-3.5 text-sm font-medium text-slate-900 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="" disabled>Select dynamic...</option>
                <option value="Living Alone">Living Alone (Optimal)</option>
                <option value="Couple / Roommates">Couple / Roommates</option>
                <option value="Family with Kids">Family with Kids</option>
                <option value="Living with Pets">Living with Pets (Pet-Safe)</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="relative">
            <label className="text-[11px] uppercase font-bold text-slate-400 ml-1 mb-1.5 flex items-center gap-1.5 tracking-widest">
              <User className="w-3.5 h-3.5" /> Your Age Group
            </label>
            <div className="relative">
              <select 
                value={formData.userAge} 
                onChange={(e) => updateFormData({ userAge: e.target.value })} 
                className="w-full px-4 py-3.5 text-sm font-medium text-slate-900 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="" disabled>Select group...</option>
                <option value="18-30">18 - 30</option>
                <option value="31-50">31 - 50</option>
                <option value="51-65">51 - 65</option>
                <option value="65+">65+</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex gap-3 shrink-0 w-full">
            {onPrev && (
                <button 
                    onClick={onPrev} 
                    className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all"
                >
                    Back to Login
                </button>
            )}
            
            <button 
                disabled={!isComplete} 
                onClick={onNext} 
                className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group disabled:cursor-not-allowed transform-gpu hover:-translate-y-0.5 will-change-transform disabled:hover:translate-y-0 disabled:shadow-none"
            >
                {isComplete ? "Initialize Core System" : "Complete Fields to Continue"} 
                <ChevronRight className={`w-5 h-5 ${isComplete ? "group-hover:translate-x-1 transition-transform" : ""}`} />
            </button>
        </div>

      </div>
    </div>
  );
}