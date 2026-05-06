'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Phone, User, MessageSquare, PhoneCall, Send, Bot, Settings2, ArrowRight, Loader2, Palette, Timer, Activity, Info } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Props {
  onNext: () => void;
  onPrev?: () => void;
}

interface SecuritySettings {
  emergency_gesture: string;
  emergency_cancel_gesture: string;
  emergency_contact_name: string;
  emergency_phone: string;
  emergency_light_color: string; 
  emergency_duration: number;    
  emergency_action_text: string;
  use_sms: boolean;
  use_voice_call: boolean;
  use_telegram: boolean;
  use_fall_detection: boolean;
  is_active: boolean;
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

export default function Step4Emergency({ onNext, onPrev }: Props) {
  const [mode, setMode] = useState<'intro' | 'setup'>('intro');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [assignedDeviceGestures, setAssignedDeviceGestures] = useState<string[]>([]);
  
  const [security, setSecurity] = useState<SecuritySettings>({
    emergency_gesture: "Closed_Fist",
    emergency_cancel_gesture: "Open_Palm",
    emergency_contact_name: "",
    emergency_phone: "",
    emergency_light_color: "red",
    emergency_duration: 10,
    emergency_action_text: "Intruder detected! The authorities have been notified.",
    use_sms: true,
    use_voice_call: true,
    use_telegram: true,
    use_fall_detection: true,
    is_active: true
  });

  const fetchData = async () => {
    setLoading(true);
    setMode('setup');
    const token = localStorage.getItem("token");
    try {
      const [secRes, mapRes] = await Promise.all([
        fetch(`${API_URL}/gestures/security`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/gestures/mappings`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      const data = await secRes.json();
      const mapData = await mapRes.json();
      
      if (data && data.is_active !== undefined) {
        setSecurity({
          emergency_gesture: data.emergency_gesture || "Closed_Fist",
          emergency_cancel_gesture: data.emergency_cancel_gesture || "Open_Palm",
          emergency_contact_name: data.emergency_contact_name || "",
          emergency_phone: data.emergency_phone || "",
          emergency_light_color: data.emergency_light_color || "red",
          emergency_duration: data.emergency_duration || 10,
          emergency_action_text: data.emergency_action_text || "Unauthorized entry detected! Authorities notified. I'm calling the police",
          use_sms: data.use_sms ?? true,
          use_voice_call: data.use_voice_call ?? true,
          use_telegram: data.use_telegram ?? true,
          use_fall_detection: data.use_fall_detection ?? true,
          is_active: true
        });
      }

      if (mapData && mapData.mappings) {
        const usedGestures = mapData.mappings.map((m: any) => m.gesture_name);
        setAssignedDeviceGestures(usedGestures);
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof SecuritySettings, value: any) => {
    setSecurity(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveAndNext = async () => {
    setSaving(true);
    const token = localStorage.getItem("token");
    
    try {
      await fetch(`${API_URL}/gestures/security`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(security)
      });
      onNext();
    } catch (e) {
      console.error("Save failed", e);
      onNext();
    }
  };

  return (
    <div className="bg-white border border-slate-200 p-8 md:p-10 rounded-[2rem] shadow-xl shadow-slate-200/50 text-center min-h-[500px] flex flex-col items-center justify-center transform-gpu relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-rose-50 to-white pointer-events-none" />

      <AnimatePresence mode="wait">
        
        {mode === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full relative z-10 flex flex-col h-full">
            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="flex justify-center mb-6">
                <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 shadow-sm">
                    <ShieldAlert className="w-10 h-10" />
                </div>
                </div>

                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Security Protocol</h2>
                <p className="text-slate-500 mb-8 max-w-sm mx-auto font-medium leading-relaxed">
                Before we map your smart devices, let's configure your Emergency SOS alerts. Who should the house contact if you're in danger?
                </p>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-3 shrink-0 w-full max-w-xs mx-auto">
                <button onClick={fetchData} className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 order-1">
                    <Settings2 className="w-5 h-5" /> Setup Protocols
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
                <h3 className="text-2xl font-extrabold text-slate-900 mb-1">SOS Contacts & Alerts</h3>
                <p className="text-sm text-slate-500 mb-4 font-medium">Define how the system reacts during a lockdown.</p>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto scrollbar-hide text-left space-y-4 pr-2 pb-4">
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-extrabold text-slate-400 ml-1 mb-1.5 flex items-center gap-1 tracking-widest uppercase"><User className="w-3 h-3"/> Contact Name</label>
                                <input 
                                    type="text" placeholder="e.g. Tuna" 
                                    value={security.emergency_contact_name} onChange={(e) => handleChange("emergency_contact_name", e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-rose-400 outline-none transition-colors text-sm font-medium text-slate-700"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-extrabold text-slate-400 ml-1 mb-1.5 flex items-center gap-1 tracking-widest uppercase"><Phone className="w-3 h-3"/> Phone Number</label>
                                <input 
                                    type="text" placeholder="+90 555..." 
                                    value={security.emergency_phone} onChange={(e) => handleChange("emergency_phone", e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-rose-400 outline-none transition-colors text-sm font-medium text-slate-700"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                            <div className="space-y-2">
                                <label className="text-[10px] font-extrabold text-slate-400 ml-1 mb-1.5 flex items-center gap-1 tracking-widest uppercase">SOS Trigger (4s)</label>
                                <select 
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-rose-400 outline-none transition-colors text-sm font-medium text-slate-700 cursor-pointer"
                                    value={security.emergency_gesture}
                                    onChange={(e) => handleChange("emergency_gesture", e.target.value)}
                                >
                                    {AVAILABLE_GESTURES.map(g => {
                                        const isUsedByCancel = security.emergency_cancel_gesture === g.id;
                                        const isUsedByDevice = assignedDeviceGestures.includes(g.id);
                                        const isDisabled = isUsedByCancel || isUsedByDevice;
                                        return (
                                            <option key={g.id} value={g.id} disabled={isDisabled}>
                                                {g.label} {isUsedByDevice ? "(Used by Device)" : ""}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-extrabold text-slate-400 ml-1 mb-1.5 flex items-center gap-1 tracking-widest uppercase">SOS Cancel (2s)</label>
                                <select 
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-400 outline-none transition-colors text-sm font-medium text-slate-700 cursor-pointer"
                                    value={security.emergency_cancel_gesture}
                                    onChange={(e) => handleChange("emergency_cancel_gesture", e.target.value)}
                                >
                                    {AVAILABLE_GESTURES.map(g => {
                                        const isUsedByTrigger = security.emergency_gesture === g.id;
                                        const isUsedByDevice = assignedDeviceGestures.includes(g.id);
                                        const isDisabled = isUsedByTrigger || isUsedByDevice;
                                        return (
                                            <option key={g.id} value={g.id} disabled={isDisabled}>
                                                {g.label} {isUsedByDevice ? "(Used by Device)" : ""}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </div>

                        <div className="mt-1 p-3 bg-sky-50 border border-sky-100 rounded-xl flex gap-3 text-left">
                            <Info className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-sky-700 leading-relaxed font-medium">
                                <strong>How it works:</strong> Hold the Trigger Gesture for <strong>4 seconds</strong> to initiate. The smart bulbs will flash <strong>RED for 1 second</strong> to silently confirm. You then have a <strong>4-second window</strong> to abort the lockdown by holding the Cancel Gesture for <strong>2 seconds</strong>.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                            <div>
                                <label className="text-[10px] font-extrabold text-slate-500 ml-1 mb-1.5 flex items-center gap-1 tracking-widest uppercase"><Palette className="w-3 h-3"/> Alert Color</label>
                                <select 
                                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-rose-400 outline-none transition-colors text-sm font-bold text-slate-700 shadow-sm cursor-pointer"
                                    value={security.emergency_light_color}
                                    onChange={(e) => handleChange("emergency_light_color", e.target.value)}
                                >
                                    <option value="red">Flashing Red</option>
                                    <option value="blue">Flashing Blue</option>
                                    <option value="police">Police Strobe (Red/Blue)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-extrabold text-slate-500 ml-1 mb-1.5 flex items-center gap-1 tracking-widest uppercase"><Timer className="w-3 h-3"/> Duration</label>
                                <select 
                                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-rose-400 outline-none transition-colors text-sm font-bold text-slate-700 shadow-sm cursor-pointer"
                                    value={security.emergency_duration}
                                    onChange={(e) => handleChange("emergency_duration", parseInt(e.target.value))}
                                >
                                    <option value={10}>10 Seconds</option>
                                    <option value={20}>20 Seconds</option>
                                    <option value={30}>30 Seconds</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-extrabold text-slate-400 ml-1 mb-1.5 block tracking-widest uppercase">Smart Sensors</label>
                            <label className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${security.use_fall_detection ? "bg-purple-50 border-purple-200 shadow-sm" : "bg-white border-slate-200"}`}>
                                <input type="checkbox" className="hidden" checked={security.use_fall_detection} onChange={(e) => handleChange("use_fall_detection", e.target.checked)} />
                                <Activity className={`w-4 h-4 mr-3 ${security.use_fall_detection ? "text-purple-500" : "text-slate-400"}`} />
                                <span className={`text-sm font-bold ${security.use_fall_detection ? "text-purple-700" : "text-slate-500"}`}>Enable AI Fall Detection</span>
                            </label>
                            
                            {security.use_fall_detection && (
                                <div className="mt-2 p-3 bg-purple-50 border border-purple-100 rounded-xl flex gap-3 text-left animate-in fade-in slide-in-from-top-1">
                                    <Info className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                                    <p className="text-xs text-purple-700 leading-relaxed font-medium">
                                        <strong>Protocol Flow:</strong> Upon detecting a fall, the AI will ask if you are okay and activate the microphone for <strong>10 seconds</strong>. You can abort the emergency alert by saying keywords like <strong>"I'm fine", "Okay", or "Cancel"</strong>, or by showing the <strong>Cancel Gesture</strong> to the camera.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-extrabold text-slate-400 ml-1 mb-1.5 block tracking-widest uppercase">Omnichannel Alerts</label>
                            <div className="grid grid-cols-1 gap-2">
                                <label className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${security.use_sms ? "bg-emerald-50 border-emerald-200 shadow-sm" : "bg-white border-slate-200"}`}>
                                    <input type="checkbox" className="hidden" checked={security.use_sms} onChange={(e) => handleChange("use_sms", e.target.checked)} />
                                    <MessageSquare className={`w-4 h-4 mr-3 ${security.use_sms ? "text-emerald-500" : "text-slate-400"}`} />
                                    <span className={`text-sm font-bold ${security.use_sms ? "text-emerald-700" : "text-slate-500"}`}>Send SMS Alert</span>
                                </label>
                                <label className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${security.use_voice_call ? "bg-emerald-50 border-emerald-200 shadow-sm" : "bg-white border-slate-200"}`}>
                                    <input type="checkbox" className="hidden" checked={security.use_voice_call} onChange={(e) => handleChange("use_voice_call", e.target.checked)} />
                                    <PhoneCall className={`w-4 h-4 mr-3 ${security.use_voice_call ? "text-emerald-500" : "text-slate-400"}`} />
                                    <span className={`text-sm font-bold ${security.use_voice_call ? "text-emerald-700" : "text-slate-500"}`}>Make Voice Call (AI TTS)</span>
                                </label>
                                <label className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${security.use_telegram ? "bg-sky-50 border-sky-200 shadow-sm" : "bg-white border-slate-200"}`}>
                                    <input type="checkbox" className="hidden" checked={security.use_telegram} onChange={(e) => handleChange("use_telegram", e.target.checked)} />
                                    <Send className={`w-4 h-4 mr-3 ${security.use_telegram ? "text-sky-500" : "text-slate-400"}`} />
                                    <span className={`text-sm font-bold ${security.use_telegram ? "text-sky-700" : "text-slate-500"}`}>Send Telegram Push</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex flex-col pt-1">
                            <label className="text-[10px] font-extrabold text-slate-400 ml-1 mb-1.5 flex items-center gap-1 tracking-widest uppercase"><Bot className="w-3 h-3"/> AI Voice Announcement</label>
                            <textarea 
                                rows={2} placeholder="What should the AI say to the intruder?"
                                value={security.emergency_action_text} onChange={(e) => handleChange("emergency_action_text", e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-rose-400 outline-none transition-colors text-sm font-medium text-slate-700 resize-none shadow-sm"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-4 pt-6 border-t border-slate-100 flex gap-3 shrink-0 w-full">
                <div className="flex gap-2">
                    {onPrev && (
                        <button onClick={onPrev} className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all">
                            Back
                        </button>
                    )}
                    <button onClick={onNext} className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all">
                        Skip
                    </button>
                </div>
                <button onClick={handleSaveAndNext} disabled={saving} className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2">
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Save & Continue <ArrowRight className="w-4 h-4" /></>}
                </button>   
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}