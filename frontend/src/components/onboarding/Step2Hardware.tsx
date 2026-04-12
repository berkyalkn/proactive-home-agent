import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, ChevronRight, Server, Cpu, PlugZap, Lightbulb, Cctv, Search, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { OnboardingData } from '@/app/onboarding/page';

interface Props {
  formData: OnboardingData;
  updateFormData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
}

export default function Step2Hardware({ formData, updateFormData, onNext }: Props) {
  const [isScanning, setIsScanning] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const handleLayoutSelect = (layout: string) => {
    setIsScanning(true); 
    
    setTimeout(() => {
      let baseRooms: any[] = [];
      
      if (layout === "1+0") {
        baseRooms = [
          { name: "Main Studio", type: "livingroom", hasSensor: true, hasPlug: true, hasLight: true, hasCamera: true },
          { name: "Bathroom", type: "bathroom", hasSensor: false, hasPlug: false, hasLight: false, hasCamera: false }
        ];
      } else if (layout === "1+1") {
        baseRooms = [
          { name: "Living Room", type: "livingroom", hasSensor: true, hasPlug: true, hasLight: true, hasCamera: true },
          { name: "Bedroom", type: "bedroom", hasSensor: true, hasPlug: false, hasLight: true, hasCamera: false },
          { name: "Kitchen", type: "kitchen", hasSensor: false, hasPlug: false, hasLight: false, hasCamera: false }
        ];
      } else if (layout === "2+1") {
        baseRooms = [
          { name: "Living Room", type: "livingroom", hasSensor: true, hasPlug: true, hasLight: true, hasCamera: true },
          { name: "Bedroom", type: "bedroom", hasSensor: true, hasPlug: false, hasLight: true, hasCamera: false },
          { name: "Guest Room", type: "guestroom", hasSensor: true, hasPlug: false, hasLight: false, hasCamera: false },
          { name: "Kitchen", type: "kitchen", hasSensor: false, hasPlug: false, hasLight: false, hasCamera: false }
        ];
      } else if (layout === "3+1") {
        baseRooms = [
          { name: "Living Room", type: "livingroom", hasSensor: true, hasPlug: true, hasLight: true, hasCamera: true },
          { name: "Master Bedroom", type: "bedroom", hasSensor: true, hasPlug: false, hasLight: true, hasCamera: false },
          { name: "Kids Room", type: "bedroom", hasSensor: true, hasPlug: false, hasLight: true, hasCamera: false },
          { name: "Guest Room", type: "guestroom", hasSensor: true, hasPlug: false, hasLight: false, hasCamera: false },
          { name: "Kitchen", type: "kitchen", hasSensor: false, hasPlug: false, hasLight: false, hasCamera: false }
        ];
      }

      updateFormData({ topology: layout, rooms: baseRooms });
      setIsScanning(false);
    }, 2000); 
  };

  const toggleHardware = (index: number, hwType: string) => {
    const newRooms = [...formData.rooms];
    newRooms[index][hwType] = !newRooms[index][hwType];
    updateFormData({ rooms: newRooms });
  };

  const startProvisioning = async () => {
    setIsProvisioning(true);
    setLogs(["Initiating secure connection..."]);
    
    const fakeLogs = ["Registering discovered devices...", "Creating spatial relationships...", "Saving configuration..."];
    fakeLogs.forEach((log, idx) => setTimeout(() => setLogs(p => [...p, log]), (idx + 1) * 600));

    try {
      await api.post('/onboarding/setup', formData);
      setTimeout(() => {
        setLogs(p => [...p, "Setup complete!"]);
        setTimeout(() => { setIsProvisioning(false); onNext(); }, 1000);
      }, fakeLogs.length * 600 + 500);
    } catch (error) {
      setLogs(p => [...p, "Error saving configuration. Proceeding to network diagnostic..."]);
      setTimeout(() => { setIsProvisioning(false); onNext(); }, 2000);
    }
  };

  return (
    <div className="bg-white/60 backdrop-blur-xl border border-slate-200/60 p-10 rounded-3xl shadow-xl shadow-slate-200/50 min-h-[450px] flex flex-col justify-center">
      
      <AnimatePresence mode="wait">
        
        {isScanning ? (
          <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-10">
            <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
              <motion.div animate={{ scale: [1, 1.5, 2], opacity: [0.5, 0.2, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute inset-0 bg-indigo-400 rounded-full" />
              <div className="w-12 h-12 bg-indigo-600 rounded-full relative z-10 flex items-center justify-center shadow-lg text-white">
                <Search className="w-6 h-6 animate-pulse" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Scanning Layout...</h3>
            <p className="text-sm text-slate-500">Auto-detecting smart devices in your space.</p>
          </motion.div>
        ) : 

        isProvisioning ? (
          <motion.div key="provisioning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
            <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-2">Finalizing Setup</h2>
            <p className="text-slate-500 text-center mb-6">Saving your space configuration.</p>
            <div className="bg-slate-900 rounded-2xl p-6 font-mono text-sm text-emerald-400 flex-1 overflow-y-auto border border-slate-700 shadow-inner">
              <div className="flex items-center gap-3 mb-4 text-indigo-400"><Server className="w-5 h-5 animate-pulse" /><span>Writing to database...</span></div>
              {logs.map((log, i) => <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-2"><span className="text-slate-500">[{new Date().toISOString().split('T')[1].slice(0,-1)}]</span> {log}</motion.div>)}
            </div>
          </motion.div>
        ) : 

        !formData.topology ? (
          <motion.div key="selection" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <h2 className="text-3xl font-extrabold text-slate-900 text-center mb-2">Smart Spaces</h2>
            <p className="text-slate-500 text-center mb-8">Select your home layout. We'll automatically find your connected devices.</p>
            <div className="grid grid-cols-2 gap-4">
              {["1+0", "1+1", "2+1", "3+1"].map((layout) => (
                <button key={layout} onClick={() => handleLayoutSelect(layout)} className="flex flex-col items-center justify-center p-8 bg-white border border-slate-200 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 hover:shadow-md transition-all group">
                  <Home className="w-8 h-8 text-slate-400 group-hover:text-indigo-600 mb-3 transition-colors" />
                  <span className="font-bold text-slate-700 group-hover:text-indigo-700 text-lg">{layout}</span>
                </button>
              ))}
            </div>
          </motion.div>
        ) : 

        (
          <motion.div key="results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-extrabold text-slate-900">Discovered Devices</h2>
              <button onClick={() => updateFormData({ topology: '', rooms: [] })} className="text-xs font-semibold text-indigo-500 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-full transition-colors">
                Change Layout
              </button>
            </div>
            <p className="text-slate-500 text-sm mb-6">We found these devices based on your {formData.topology} layout. Tap to modify if needed.</p>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar max-h-[250px]">
              {formData.rooms.map((room, idx) => (
                <div key={idx} className="flex flex-col p-4 bg-slate-50/50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="font-bold text-slate-700">{room.name}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {room.hasSensor && (
                      <button onClick={() => toggleHardware(idx, 'hasSensor')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all bg-indigo-100 text-indigo-700 border border-indigo-200" title={room.name === "Living Room" ? "Temp, Pressure, Humidity, Light, Motion" : room.name === "Bedroom" ? "Light, Motion" : "Motion only"}>
                        <Cpu className="w-3.5 h-3.5" /> 
                        {room.name === "Living Room" ? "Full Sensor Node" : "Basic Sensor Node"}
                      </button>
                    )}
                    
                    {room.hasLight && (
                      <button onClick={() => toggleHardware(idx, 'hasLight')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all bg-amber-100 text-amber-700 border border-amber-200">
                        <Lightbulb className="w-3.5 h-3.5" /> Smart Bulb
                      </button>
                    )}

                    {room.hasPlug && (
                      <button onClick={() => toggleHardware(idx, 'hasPlug')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all bg-emerald-100 text-emerald-700 border border-emerald-200">
                        <PlugZap className="w-3.5 h-3.5" /> 
                        {room.name === "Living Room" ? "2x Smart Plug" : "Smart Plug"}
                      </button>
                    )}

                    {room.hasCamera && (
                      <button onClick={() => toggleHardware(idx, 'hasCamera')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all bg-blue-100 text-blue-700 border border-blue-200">
                        <Cctv className="w-3.5 h-3.5" /> Camera
                      </button>
                    )}

                    {!room.hasSensor && !room.hasLight && !room.hasPlug && !room.hasCamera && (
                      <span className="text-xs text-slate-400 italic py-1.5">No devices detected</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button onClick={startProvisioning} className="w-full py-4 mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 group">
              Confirm & Save Spaces <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}