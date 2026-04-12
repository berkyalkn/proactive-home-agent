import { Bot, ChevronRight, MapPin, Users, User } from 'lucide-react';
import { OnboardingData } from '@/app/onboarding/page';

interface Props {
  formData: OnboardingData;
  updateFormData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
}

export default function Step1Init({ formData, updateFormData, onNext }: Props) {
  const isComplete = formData.homeName && formData.assistantName && formData.location && formData.householdType && formData.userAge;

  return (
    <div className="bg-white/60 backdrop-blur-xl border border-slate-200/60 p-10 rounded-3xl shadow-xl shadow-slate-200/50">
      
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/30">
          <Bot className="w-8 h-8 text-white" />
        </div>
      </div>
      <h2 className="text-3xl font-extrabold text-slate-900 text-center tracking-tight mb-2">Welcome to Homify</h2>
      <p className="text-slate-500 text-center mb-8">Let's set up your smart home assistant.</p>
      
      <div className="space-y-5">
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 ml-1 mb-1.5 block tracking-wider">HOME NAME</label>
            <input type="text" placeholder="e.g. My Home" value={formData.homeName} onChange={(e) => updateFormData({ homeName: e.target.value })} className="w-full px-4 py-3 text-sm rounded-xl bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 ml-1 mb-1.5 block tracking-wider">ASSISTANT NAME</label>
            <input type="text" placeholder="e.g. Leo" value={formData.assistantName} onChange={(e) => updateFormData({ assistantName: e.target.value })} className="w-full px-4 py-3 text-sm rounded-xl bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" />
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase font-bold text-slate-400 ml-1 mb-1.5 flex items-center gap-1 tracking-wider">
            <MapPin className="w-3 h-3" /> LOCATION
          </label>
          <input type="text" placeholder="e.g. Istanbul, Turkey" value={formData.location} onChange={(e) => updateFormData({ location: e.target.value })} className="w-full px-4 py-3 text-sm rounded-xl bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 ml-1 mb-1.5 flex items-center gap-1 tracking-wider">
              <Users className="w-3 h-3" /> WHO LIVES HERE?
            </label>
            <select value={formData.householdType} onChange={(e) => updateFormData({ householdType: e.target.value })} className="w-full px-4 py-3 text-sm rounded-xl bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all appearance-none text-slate-700">
              <option value="" disabled>Select...</option>
              <option value="Living Alone">Living Alone</option>
              <option value="Couple / Roommates">Couple / Roommates</option>
              <option value="Family with Kids">Family with Kids</option>
              <option value="Living with Pets">Living with Pets</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 ml-1 mb-1.5 flex items-center gap-1 tracking-wider">
              <User className="w-3 h-3" /> YOUR AGE GROUP
            </label>
            <select value={formData.userAge} onChange={(e) => updateFormData({ userAge: e.target.value })} className="w-full px-4 py-3 text-sm rounded-xl bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all appearance-none text-slate-700">
              <option value="" disabled>Select...</option>
              <option value="18-30">18 - 30</option>
              <option value="31-50">31 - 50</option>
              <option value="51-65">51 - 65</option>
              <option value="65+">65+</option>
            </select>
          </div>
        </div>

        <button disabled={!isComplete} onClick={onNext} className="w-full py-4 mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group">
          Next Step <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}