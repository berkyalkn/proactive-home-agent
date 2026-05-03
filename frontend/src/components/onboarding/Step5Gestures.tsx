'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hand, ShieldAlert, Sparkles, Loader2, Lightbulb, Zap, Settings2, Save } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Props {
  onNext: () => void;
  onPrev?: () => void;
}

interface DeviceAction {
  device_id: string;
  device_name: string;
  action: string;
  label: string;
}

const AVAILABLE_GESTURES = [
  { id: "Thumb_Up", label: "Thumb Up (👍)" },
  { id: "Thumb_Down", label: "Thumb Down (👎)" },
  { id: "Open_Palm", label: "Open Palm (✋)" },
  { id: "Closed_Fist", label: "Closed Fist (✊)" },
  { id: "Pointing_Up", label: "Pointing Up (☝️)" },
  { id: "Victory", label: "Victory / Peace (✌️)" },
  { id: "ILoveYou", label: "I Love You (🤟)" },
];

export default function Step5Gestures({ onNext, onPrev }: Props) {
  const [mode, setMode] = useState<'intro' | 'setup' | 'saving'>('intro');
  const [loadingData, setLoadingData] = useState(false);
  
  const [actions, setActions] = useState<DeviceAction[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [sosGesture, setSosGesture] = useState<string>("");

  const fetchData = async () => {
    setLoadingData(true);
    setMode('setup');
    const token = localStorage.getItem("token");
    try {
      const [actionsRes, mapRes, secRes] = await Promise.all([
        fetch(`${API_URL}/gestures/available-actions`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/gestures/mappings`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/gestures/security`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      const actionsData = await actionsRes.json();
      const mapData = await mapRes.json();
      const secData = await secRes.json();
      
      setActions(actionsData.available_actions || []);
      
      const currentMap: Record<string, string> = {};
      if (mapData.mappings) {
        mapData.mappings.forEach((m: any) => {
          currentMap[`${m.target_device_id}|${m.action}`] = m.gesture_name;
        });
      }
      setMappings(currentMap);
      
      if (secData && secData.emergency_gesture) {
        setSosGesture(secData.emergency_gesture);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingData(false);
    }
  };

  const handleAssign = (actionKey: string, newGesture: string) => {
    setMappings(prev => {
      const updated = { ...prev };
      if (newGesture) updated[actionKey] = newGesture;
      else delete updated[actionKey];
      return updated;
    });
  };

  const handleSaveAll = async () => {
    setMode('saving'); 
    const token = localStorage.getItem("token");
    
    try {
      const mappingsArray = Object.entries(mappings)
        .filter(([_, gestureName]) => gestureName !== "")
        .map(([actionKey, gestureName]) => {
          const [deviceId, action] = actionKey.split("|");
          return { gesture_name: gestureName, target_device_id: deviceId, action: action };
        });

      const secRes = await fetch(`${API_URL}/gestures/security`, { headers: { Authorization: `Bearer ${token}` } });
      const currentSecurity = await secRes.json();

      await Promise.all([
        fetch(`${API_URL}/gestures/mappings/bulk`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ mappings: mappingsArray })
        }),
        fetch(`${API_URL}/gestures/security`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ...currentSecurity, emergency_gesture: sosGesture })
        })
      ]);

      setTimeout(() => onNext(), 2500); 
    } catch (e) {
      console.error("Save failed", e);
      onNext();
    }
  };

  const groupedActions = actions.reduce((acc, act) => {
    if (!acc[act.device_name]) acc[act.device_name] = [];
    acc[act.device_name].push(act);
    return acc;
  }, {} as Record<string, DeviceAction[]>);

  const assignedGestures = [...Object.values(mappings), sosGesture].filter(Boolean);

  return (
    <div className="bg-white border border-slate-200 p-8 md:p-10 rounded-[2rem] shadow-xl shadow-slate-200/50 text-center min-h-[500px] flex flex-col items-center justify-center transform-gpu relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-50 to-white pointer-events-none" />

      <AnimatePresence mode="wait">
        
        {mode === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full relative z-10 flex flex-col h-full">
            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="flex justify-center mb-6">
                <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600 shadow-sm relative">
                    <Hand className="w-10 h-10" />
                </div>
                </div>

                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Hand Control</h2>
                <p className="text-slate-500 mb-8 max-w-sm mx-auto font-medium leading-relaxed">
                Your security protocol is ready. Now, map specific hand gestures to control your smart home devices instantly.
                </p>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-3 shrink-0 w-full max-w-xs mx-auto">
                <button onClick={fetchData} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 order-1">
                    <Settings2 className="w-5 h-5" /> Map Gestures
                </button>
                <div className="flex gap-3 order-2">
                    {onPrev && (
                        <button onClick={onPrev} className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all">
                            Back
                        </button>
                    )}
                    <button onClick={onNext} className="flex-1 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold rounded-xl transition-all">
                        Skip
                    </button>
                </div>
            </div>
          </motion.div>
        )}

        {mode === 'setup' && (
          <motion.div key="setup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full relative z-10 flex flex-col h-full">
            
            <div className="flex-1 flex flex-col w-full h-[480px]">
                <h3 className="text-2xl font-extrabold text-slate-900 mb-1">Gesture Mapping</h3>
                <p className="text-sm text-slate-500 mb-4 font-medium">Assign gestures to devices and secure your home.</p>

                {loadingData ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto scrollbar-hide text-left space-y-6 pr-2 pb-4">
                        
                        <div className="border border-rose-200 bg-rose-50/50 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>
                            <div className="flex items-center gap-2 mb-4 pl-1">
                                <ShieldAlert className="w-5 h-5 text-rose-500 animate-pulse" />
                                <h4 className="text-sm font-extrabold text-rose-800">Emergency Trigger</h4>
                            </div>
                            <div className="flex flex-col pl-1">
                                <label className="text-[10px] font-extrabold text-slate-500 ml-1 mb-1.5 block tracking-widest uppercase">Select SOS Gesture</label>
                                <select 
                                    className="w-full px-4 py-3 rounded-xl bg-white border border-rose-200 focus:border-rose-400 outline-none transition-colors text-sm font-bold text-rose-700 shadow-sm cursor-pointer"
                                    value={sosGesture}
                                    onChange={(e) => setSosGesture(e.target.value)}
                                >
                                    <option value="">-- Unassigned --</option>
                                    {AVAILABLE_GESTURES.map(g => {
                                        const isUsed = assignedGestures.includes(g.id) && sosGesture !== g.id;
                                        if (isUsed) return null;
                                        return <option key={g.id} value={g.id}>{g.label}</option>;
                                    })}
                                </select>
                            </div>
                        </div>

                        {Object.keys(groupedActions).length === 0 ? (
                            <div className="text-center py-6 text-slate-500 text-sm">No compatible devices found in your home yet.</div>
                        ) : (
                            Object.entries(groupedActions).map(([deviceName, deviceActions]) => {
                                const isBulb = deviceActions.some(a => a.action.includes('brightness'));
                                return (
                                    <div key={deviceName} className="space-y-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:border-indigo-100 transition-colors">
                                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                            {isBulb ? <Lightbulb className="w-5 h-5 text-indigo-500"/> : <Zap className="w-5 h-5 text-indigo-500"/>}
                                            <h4 className="text-sm font-extrabold text-slate-800 tracking-tight">{deviceName}</h4>
                                        </div>
                                        <div className="space-y-3">
                                            {deviceActions.map((act) => {
                                                const actionKey = `${act.device_id}|${act.action}`;
                                                const currentAssigned = mappings[actionKey] || "";
                                                return (
                                                    <div key={actionKey} className="flex items-center justify-between gap-3">
                                                        <span className="text-[11px] font-extrabold text-slate-500 tracking-wider uppercase w-1/2">
                                                            {act.label.split(" - ")[1] || act.action}
                                                        </span>
                                                        <select 
                                                            className={`w-1/2 px-3 py-2.5 rounded-xl border text-xs font-bold outline-none transition-colors cursor-pointer ${currentAssigned ? "border-indigo-300 text-indigo-700 bg-indigo-50/50 shadow-sm" : "bg-slate-50 border-slate-200 text-slate-600 hover:border-indigo-200"}`}
                                                            value={currentAssigned}
                                                            onChange={(e) => handleAssign(actionKey, e.target.value)}
                                                        >
                                                            <option value="">-- Select --</option>
                                                            {AVAILABLE_GESTURES.map(g => {
                                                                const isUsed = assignedGestures.includes(g.id) && currentAssigned !== g.id;
                                                                if (isUsed) return null; 
                                                                return <option key={g.id} value={g.id}>{g.label}</option>;
                                                            })}
                                                        </select>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            <div className="mt-4 pt-6 border-t border-slate-100 flex gap-3 shrink-0 w-full">
                {onPrev && (
                    <button onClick={onPrev} className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all">
                        Back
                    </button>
                )}
                <button onClick={onNext} className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all">
                    Skip
                </button>
                <button onClick={handleSaveAll} className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2">
                    <Save className="w-4 h-4" /> Finalize Setup
                </button>
            </div>
          </motion.div>
        )}

        {mode === 'saving' && (
          <motion.div key="saving" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center w-full relative z-10 h-64">
            <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-indigo-600" />
              <Sparkles className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">Syncing Your Home</h3>
            <p className="text-sm font-medium text-slate-500">
                Compiling database schemas and encrypting biometric signatures...
            </p>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}