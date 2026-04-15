import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Server, Cpu, PlugZap, Lightbulb, Cctv, Plus, Trash2, Sofa, BedDouble, Coffee, Droplets, MapPin, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { OnboardingData } from '@/app/onboarding/page';

interface Props {
  formData: OnboardingData;
  updateFormData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
}

const ROOM_TYPES = [
  { id: "livingroom", label: "Living Room", icon: Sofa },
  { id: "bedroom", label: "Bedroom", icon: BedDouble },
  { id: "guestroom", label: "Guest Room", icon: Coffee },
  { id: "bathroom", label: "Bathroom", icon: Droplets },
  { id: "kitchen", label: "Kitchen", icon: MapPin },
];

export default function Step2Hardware({ formData, updateFormData, onNext }: Props) {
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  const [isBuildingRoom, setIsBuildingRoom] = useState(formData.rooms.length === 0);
  const [draftRoom, setDraftRoom] = useState({
    name: "",
    type: "livingroom",
    hasSensor: false,
    hasPlug: false,
    hasLight: false,
    hasCamera: false
  });

  const saveRoom = () => {
    if (!draftRoom.name.trim()) {
      alert("Please enter a name for the room.");
      return;
    }
    const newRooms = [...formData.rooms, draftRoom];
    updateFormData({ rooms: newRooms, topology: "Custom Build" });
    
    setDraftRoom({ name: "", type: "livingroom", hasSensor: false, hasPlug: false, hasLight: false, hasCamera: false });
    setIsBuildingRoom(false);
  };

  const removeRoom = (index: number) => {
    const newRooms = formData.rooms.filter((_, i) => i !== index);
    updateFormData({ rooms: newRooms });
    if (newRooms.length === 0) setIsBuildingRoom(true);
  };

  const startProvisioning = async () => {
    setIsProvisioning(true);
    setLogs(["Initiating secure connection..."]);
    
    const fakeLogs = ["Building spatial nodes...", "Registering hardware signatures...", "Encrypting topology..."];
    fakeLogs.forEach((log, idx) => setTimeout(() => setLogs(p => [...p, log]), (idx + 1) * 600));

    try {
      await api.post('/onboarding/setup', formData);
      setTimeout(() => {
        setLogs(p => [...p, "Setup complete!"]);
        setTimeout(() => { setIsProvisioning(false); onNext(); }, 1000);
      }, fakeLogs.length * 600 + 500);
    } catch (error) {
      setLogs(p => [...p, "Error saving configuration!"]);
      setTimeout(() => { setIsProvisioning(false); onNext(); }, 2000); 
    }
  };

  return (
    <div className="bg-white/60 backdrop-blur-xl border border-slate-200/60 p-8 rounded-3xl shadow-xl shadow-slate-200/50 min-h-[500px] flex flex-col">
      
      <AnimatePresence mode="wait">
        
        {isProvisioning ? (
          <motion.div key="provisioning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full justify-center">
            <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-2">Finalizing Ecosystem</h2>
            <p className="text-slate-500 text-center mb-6">Wiring your custom topology to the LangGraph core.</p>
            <div className="bg-slate-900 rounded-2xl p-6 font-mono text-sm text-emerald-400 flex-1 overflow-y-auto border border-slate-700 shadow-inner">
              <div className="flex items-center gap-3 mb-4 text-indigo-400"><Server className="w-5 h-5 animate-pulse" /><span>Writing to database...</span></div>
              {logs.map((log, i) => <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-2"><span className="text-slate-500">[{new Date().toISOString().split('T')[1].slice(0,-1)}]</span> {log}</motion.div>)}
            </div>
          </motion.div>
        ) : 


        isBuildingRoom ? (
          <motion.div key="builder" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Add a New Room</h2>
            <p className="text-slate-500 text-sm mb-6">Configure the space and select available hardware.</p>

            <div className="space-y-5 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 ml-1 mb-1.5 block tracking-widest">ROOM NAME</label>
                  <input type="text" placeholder="e.g. Berkay's Cave" value={draftRoom.name} onChange={e => setDraftRoom({...draftRoom, name: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 ml-1 mb-1.5 block tracking-widest">ROOM TYPE</label>
                  <select value={draftRoom.type} onChange={e => setDraftRoom({...draftRoom, type: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none appearance-none">
                    {ROOM_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 ml-1 mb-2 block tracking-widest">HARDWARE IN THIS ROOM</label>
                <div className="grid grid-cols-2 gap-3">
                  
                  <button onClick={() => setDraftRoom({...draftRoom, hasSensor: !draftRoom.hasSensor})} className={`p-4 rounded-xl border text-left transition-all ${draftRoom.hasSensor ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
                    <Cpu className={`w-6 h-6 mb-2 ${draftRoom.hasSensor ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <div className={`font-bold text-sm ${draftRoom.hasSensor ? 'text-indigo-900' : 'text-slate-600'}`}>Sensor Node</div>
                    <div className="text-[10px] text-slate-400 mt-1">Temp, Hum, Motion</div>
                  </button>

                  <button onClick={() => setDraftRoom({...draftRoom, hasLight: !draftRoom.hasLight})} className={`p-4 rounded-xl border text-left transition-all ${draftRoom.hasLight ? 'bg-amber-50 border-amber-500 shadow-sm' : 'bg-white border-slate-200 hover:border-amber-300'}`}>
                    <Lightbulb className={`w-6 h-6 mb-2 ${draftRoom.hasLight ? 'text-amber-600' : 'text-slate-400'}`} />
                    <div className={`font-bold text-sm ${draftRoom.hasLight ? 'text-amber-900' : 'text-slate-600'}`}>Smart Bulb</div>
                    <div className="text-[10px] text-slate-400 mt-1">Tapo L530 or similar</div>
                  </button>

                  <button onClick={() => setDraftRoom({...draftRoom, hasPlug: !draftRoom.hasPlug})} className={`p-4 rounded-xl border text-left transition-all ${draftRoom.hasPlug ? 'bg-emerald-50 border-emerald-500 shadow-sm' : 'bg-white border-slate-200 hover:border-emerald-300'}`}>
                    <PlugZap className={`w-6 h-6 mb-2 ${draftRoom.hasPlug ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div className={`font-bold text-sm ${draftRoom.hasPlug ? 'text-emerald-900' : 'text-slate-600'}`}>Smart Plugs</div>
                    <div className="text-[10px] text-slate-400 mt-1">Appliances & Outlets</div>
                  </button>

                  <button onClick={() => setDraftRoom({...draftRoom, hasCamera: !draftRoom.hasCamera})} className={`p-4 rounded-xl border text-left transition-all ${draftRoom.hasCamera ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
                    <Cctv className={`w-6 h-6 mb-2 ${draftRoom.hasCamera ? 'text-blue-600' : 'text-slate-400'}`} />
                    <div className={`font-bold text-sm ${draftRoom.hasCamera ? 'text-blue-900' : 'text-slate-600'}`}>CCTV / Cam</div>
                    <div className="text-[10px] text-slate-400 mt-1">RTSP Live Feed</div>
                  </button>

                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              {formData.rooms.length > 0 && (
                <button onClick={() => setIsBuildingRoom(false)} className="px-6 py-3.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">
                  Cancel
                </button>
              )}
              <button onClick={saveRoom} className="flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                Save Room Configuration <CheckCircle2 className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ) : 


        (
          <motion.div key="summary" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col h-full">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Your Smart Topology</h2>
            <p className="text-slate-500 text-sm mb-6">Review your configured spaces before finalizing the setup.</p>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {formData.rooms.map((room, idx) => {
                const RoomIcon = ROOM_TYPES.find(t => t.id === room.type)?.icon || MapPin;
                return (
                  <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-sm group">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><RoomIcon className="w-6 h-6" /></div>
                      <div>
                        <div className="font-bold text-slate-800">{room.name}</div>
                        <div className="flex gap-2 mt-1">
                          {room.hasSensor && <Cpu className="w-4 h-4 text-slate-400" />}
                          {room.hasLight && <Lightbulb className="w-4 h-4 text-amber-400" />}
                          {room.hasPlug && <PlugZap className="w-4 h-4 text-emerald-400" />}
                          {room.hasCamera && <Cctv className="w-4 h-4 text-blue-400" />}
                          {!room.hasSensor && !room.hasLight && !room.hasPlug && !room.hasCamera && <span className="text-xs text-slate-400">Empty room</span>}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => removeRoom(idx)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                );
              })}

              <button onClick={() => setIsBuildingRoom(true)} className="w-full py-4 border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 rounded-2xl flex items-center justify-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-all">
                <Plus className="w-5 h-5" /> Add Another Room
              </button>
            </div>

            <button onClick={startProvisioning} className="w-full py-4 mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 group">
              Finalize Home Setup <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}