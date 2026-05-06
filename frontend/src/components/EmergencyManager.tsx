"use client";

import { useState, useEffect, useRef } from "react";
import { ShieldAlert, X, Phone, User, Settings2, CheckCircle, Loader2, MessageSquare, PhoneCall, Send, Bot, Palette, Timer, Activity, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

export function EmergencyManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
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

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const fetchSecuritySettings = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const [secRes, mapRes] = await Promise.all([
        fetch(`${API_URL}/gestures/security`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/gestures/mappings`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      const data = await secRes.json();
      const mapData = await mapRes.json();
      
      if (data) {
        setSecurity({
          emergency_gesture: data.emergency_gesture || "Closed_Fist",
          emergency_cancel_gesture: data.emergency_cancel_gesture || "Open_Palm",
          emergency_contact_name: data.emergency_contact_name || "",
          emergency_phone: data.emergency_phone || "",
          emergency_light_color: data.emergency_light_color || "red",
          emergency_duration: data.emergency_duration || 10,
          emergency_action_text: data.emergency_action_text || "Intruder detected! The authorities have been notified.",
          use_sms: data.use_sms ?? true,
          use_voice_call: data.use_voice_call ?? true,
          use_telegram: data.use_telegram ?? true,
          use_fall_detection: data.use_fall_detection ?? true,
          is_active: data.is_active ?? true
        });
      }

      if (mapData && mapData.mappings) {
        const usedGestures = mapData.mappings.map((m: any) => m.gesture_name);
        setAssignedDeviceGestures(usedGestures);
      }
      
      setHasChanges(false);
    } catch (e) {
      console.error("Failed to fetch security settings", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchSecuritySettings();
  }, [isOpen]);

  const handleChange = (field: keyof SecuritySettings, value: any) => {
    setSecurity(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem("token");
    try {
      await fetch(`${API_URL}/gestures/security`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(security)
      });
      setHasChanges(false);
    } catch (e) {
      console.error("Failed to save security settings", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative transition-all duration-300 ${isOpen ? "z-[100]" : "z-40"}`}>
      <Button 
          onClick={() => setIsOpen(!isOpen)}
          variant="outline" 
          className={`h-11 px-4 flex items-center gap-3 transition-all duration-300 border-zinc-800 ${
            isOpen 
            ? "bg-rose-900/50 text-white border-rose-700 shadow-lg shadow-rose-500/20" 
            : "bg-black/40 backdrop-blur text-zinc-100 hover:bg-rose-950/30 hover:border-rose-900/50 hover:text-rose-400" 
          }`}
      >
          {isOpen ? <X className="w-5 h-5"/> : <ShieldAlert className="w-5 h-5" />}
          <span className="hidden md:inline font-medium text-sm">Security Hub</span>
          {hasChanges && <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-pulse" />}
      </Button>

      {isOpen && (
        <Card className="absolute top-14 left-0 w-[400px] md:w-[450px] bg-black/95 backdrop-blur-xl border-zinc-800 shadow-2xl p-0 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-left rounded-xl flex flex-col max-h-[85vh]">
            
            <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-rose-950/20 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-500/20 rounded-lg">
                        <ShieldAlert className="w-5 h-5 text-rose-400"/>
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-rose-100 leading-tight">Emergency Protocol</h3>
                        <p className="text-xs text-rose-400/70 mt-0.5">Configure SOS actions and notifications</p>
                    </div>
                </div>
            </div>

            <div className="p-5 space-y-6 overflow-y-auto scrollbar-hide">
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-zinc-600"/></div>
              ) : (
                <>
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Emergency Contact</h4>
                    
                    <div className="flex items-center bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-1 focus-within:border-rose-500/50 transition-colors">
                      <div className="pl-3 pr-2 text-zinc-500"><User className="w-4 h-4" /></div>
                      <input 
                        type="text" 
                        placeholder="Contact Name (e.g. Tuna)" 
                        value={security.emergency_contact_name}
                        onChange={(e) => handleChange("emergency_contact_name", e.target.value)}
                        className="w-full bg-transparent p-2 text-sm text-zinc-200 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-1 focus-within:border-rose-500/50 transition-colors">
                      <div className="pl-3 pr-2 text-zinc-500"><Phone className="w-4 h-4" /></div>
                      <input 
                        type="text" 
                        placeholder="Phone Number (+90...)" 
                        value={security.emergency_phone}
                        onChange={(e) => handleChange("emergency_phone", e.target.value)}
                        className="w-full bg-transparent p-2 text-sm text-zinc-200 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800/50">
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-500 flex items-center gap-1 tracking-widest uppercase">SOS Trigger (4s)</label>
                          <select 
                              className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-2.5 text-sm text-zinc-200 focus:outline-none focus:border-rose-500/50 cursor-pointer transition-colors"
                              value={security.emergency_gesture}
                              onChange={(e) => handleChange("emergency_gesture", e.target.value)}
                          >
                              {AVAILABLE_GESTURES.map(g => {
                                  const isUsedByCancel = security.emergency_cancel_gesture === g.id;
                                  const isUsedByDevice = assignedDeviceGestures.includes(g.id);
                                  const isDisabled = isUsedByCancel || isUsedByDevice;
                                  return (
                                      <option key={g.id} value={g.id} disabled={isDisabled}>
                                          {g.label} {isUsedByDevice ? "(Used)" : ""}
                                      </option>
                                  );
                              })}
                          </select>
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-500 flex items-center gap-1 tracking-widest uppercase">SOS Cancel (2s)</label>
                          <select 
                              className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-2.5 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer transition-colors"
                              value={security.emergency_cancel_gesture}
                              onChange={(e) => handleChange("emergency_cancel_gesture", e.target.value)}
                          >
                              {AVAILABLE_GESTURES.map(g => {
                                  const isUsedByTrigger = security.emergency_gesture === g.id;
                                  const isUsedByDevice = assignedDeviceGestures.includes(g.id);
                                  const isDisabled = isUsedByTrigger || isUsedByDevice;
                                  return (
                                      <option key={g.id} value={g.id} disabled={isDisabled}>
                                          {g.label} {isUsedByDevice ? "(Used)" : ""}
                                      </option>
                                  );
                              })}
                          </select>
                      </div>
                  </div>

                  <div className="mt-1 p-3 bg-sky-950/20 border border-sky-500/30 rounded-lg flex gap-3 text-left">
                      <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-sky-100/80 leading-relaxed">
                          <strong>Protocol Flow:</strong> Hold trigger for <strong>4s</strong> to initiate. The smart bulbs will flash <strong>RED for 1s</strong> to silently confirm. You then have a <strong>4s window</strong> to abort the lockdown by holding the Cancel Gesture for <strong>2s</strong>.
                      </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800/50">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 flex items-center gap-1 tracking-widest uppercase"><Palette className="w-3 h-3"/> Alert Color</label>
                        <select 
                            className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-2.5 text-sm text-zinc-200 focus:outline-none focus:border-rose-500/50 cursor-pointer transition-colors"
                            value={security.emergency_light_color}
                            onChange={(e) => handleChange("emergency_light_color", e.target.value)}
                        >
                            <option value="red">Flashing Red</option>
                            <option value="blue">Flashing Blue</option>
                            <option value="police">Police Strobe</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 flex items-center gap-1 tracking-widest uppercase"><Timer className="w-3 h-3"/> Duration</label>
                        <select 
                            className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-2.5 text-sm text-zinc-200 focus:outline-none focus:border-rose-500/50 cursor-pointer transition-colors"
                            value={security.emergency_duration}
                            onChange={(e) => handleChange("emergency_duration", parseInt(e.target.value))}
                        >
                            <option value={10}>10 Seconds</option>
                            <option value={20}>20 Seconds</option>
                            <option value={30}>30 Seconds</option>
                        </select>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-zinc-800/50">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Smart Sensors</h4>
                    <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${security.use_fall_detection ? "bg-purple-950/20 border-purple-500/30" : "bg-zinc-900/30 border-zinc-800/50"}`}>
                        <input 
                          type="checkbox" 
                          className="hidden" 
                          checked={security.use_fall_detection} 
                          onChange={(e) => handleChange("use_fall_detection", e.target.checked)} 
                        />
                        <Activity className={`w-4 h-4 mr-3 ${security.use_fall_detection ? "text-purple-400" : "text-zinc-600"}`} />
                        <span className={`text-sm font-medium ${security.use_fall_detection ? "text-purple-100" : "text-zinc-500"}`}>Enable AI Fall Detection</span>
                        {security.use_fall_detection && <CheckCircle className="w-4 h-4 text-purple-500 ml-auto" />}
                    </label>
                    
                    {security.use_fall_detection && (
                        <div className="mt-2 p-3 bg-purple-950/10 border border-purple-500/20 rounded-lg flex gap-3 text-left animate-in fade-in slide-in-from-top-1">
                            <Info className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-purple-100/80 leading-relaxed">
                                <strong>Protocol Flow:</strong> Upon detecting a fall, the AI will ask if you are okay and activate the microphone for <strong>10 seconds</strong>. You can abort the emergency alert by saying keywords like <strong>"I'm fine", "Okay", or "Cancel"</strong>, or by showing the <strong>Cancel Gesture</strong> to the camera.
                            </p>
                        </div>
                    )}
                  </div>

                  <div className="space-y-3 pt-2 border-t border-zinc-800/50">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Alert Channels</h4>
                    
                    <div className="grid grid-cols-1 gap-2">
                      <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${security.use_sms ? "bg-emerald-950/20 border-emerald-500/30" : "bg-zinc-900/30 border-zinc-800/50"}`}>
                        <input 
                          type="checkbox" 
                          className="hidden" 
                          checked={security.use_sms} 
                          onChange={(e) => handleChange("use_sms", e.target.checked)} 
                        />
                        <MessageSquare className={`w-4 h-4 mr-3 ${security.use_sms ? "text-emerald-400" : "text-zinc-600"}`} />
                        <span className={`text-sm font-medium ${security.use_sms ? "text-emerald-100" : "text-zinc-500"}`}>Send SMS Alert</span>
                        {security.use_sms && <CheckCircle className="w-4 h-4 text-emerald-500 ml-auto" />}
                      </label>

                      <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${security.use_voice_call ? "bg-emerald-950/20 border-emerald-500/30" : "bg-zinc-900/30 border-zinc-800/50"}`}>
                        <input 
                          type="checkbox" 
                          className="hidden" 
                          checked={security.use_voice_call} 
                          onChange={(e) => handleChange("use_voice_call", e.target.checked)} 
                        />
                        <PhoneCall className={`w-4 h-4 mr-3 ${security.use_voice_call ? "text-emerald-400" : "text-zinc-600"}`} />
                        <span className={`text-sm font-medium ${security.use_voice_call ? "text-emerald-100" : "text-zinc-500"}`}>Make Voice Call (Robot TTS)</span>
                        {security.use_voice_call && <CheckCircle className="w-4 h-4 text-emerald-500 ml-auto" />}
                      </label>

                      <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${security.use_telegram ? "bg-sky-950/20 border-sky-500/30" : "bg-zinc-900/30 border-zinc-800/50"}`}>
                        <input 
                          type="checkbox" 
                          className="hidden" 
                          checked={security.use_telegram} 
                          onChange={(e) => handleChange("use_telegram", e.target.checked)} 
                        />
                        <Send className={`w-4 h-4 mr-3 ${security.use_telegram ? "text-sky-400" : "text-zinc-600"}`} />
                        <span className={`text-sm font-medium ${security.use_telegram ? "text-sky-100" : "text-zinc-500"}`}>Send Telegram Push</span>
                        {security.use_telegram && <CheckCircle className="w-4 h-4 text-sky-500 ml-auto" />}
                      </label>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-zinc-800/50">
                     <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                       <Bot className="w-4 h-4" /> AI Voice Announcement
                     </h4>
                     <textarea 
                        rows={3}
                        placeholder="What should the AI say to the intruder?"
                        value={security.emergency_action_text}
                        onChange={(e) => handleChange("emergency_action_text", e.target.value)}
                        className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-3 text-sm text-zinc-300 focus:outline-none focus:border-rose-500/50 resize-none transition-colors"
                      />
                  </div>
                </>
              )}
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-950 shrink-0">
               <Button 
                 onClick={handleSave}
                 disabled={!hasChanges || saving}
                 className={`w-full h-11 font-semibold transition-all ${hasChanges ? "bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-900/20" : "bg-zinc-800 text-zinc-500"}`}
               >
                 {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldAlert className="w-4 h-4 mr-2" />}
                 {saving ? "Updating Protocols..." : "Save Security Protocol"}
               </Button>
            </div>
        </Card>
      )}
    </div>
  );
}