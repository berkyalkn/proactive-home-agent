"use client";

import { useState, useEffect, useRef } from "react";
import { Hand, X, Settings2, CheckCircle, Loader2, Zap, Lightbulb, Save, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface DeviceAction {
  device_id: string;
  device_name: string;
  action: string;
  label: string;
}

interface SecuritySettings {
  emergency_gesture: string;
  emergency_contact_name: string;
  emergency_phone: string;
  emergency_action_text: string;
  use_sms: boolean;
  use_voice_call: boolean;
  use_telegram: boolean;
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

export function GestureManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  const [actions, setActions] = useState<DeviceAction[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [security, setSecurity] = useState<SecuritySettings | null>(null);

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

  const fetchData = async () => {
    setLoading(true);
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
      mapData.mappings.forEach((m: any) => {
        currentMap[`${m.target_device_id}|${m.action}`] = m.gesture_name;
      });
      setMappings(currentMap);
      
      if (secData) {
        setSecurity(secData);
      }
      
      setHasChanges(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchData();
  }, [isOpen]);

  const handleAssign = (actionKey: string, newGesture: string) => {
    setMappings(prev => {
      const updated = { ...prev };
      if (newGesture) updated[actionKey] = newGesture;
      else delete updated[actionKey];
      return updated;
    });
    setHasChanges(true);
  };

  const handleSecurityGestureChange = (newGesture: string) => {
    if (security) {
      setSecurity({ ...security, emergency_gesture: newGesture });
      setHasChanges(true);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    const token = localStorage.getItem("token");
    
    try {
      const mappingsArray = Object.entries(mappings)
        .filter(([_, gestureName]) => gestureName !== "")
        .map(([actionKey, gestureName]) => {
          const [deviceId, action] = actionKey.split("|");
          return { gesture_name: gestureName, target_device_id: deviceId, action: action };
        });

      const savePromises = [
        fetch(`${API_URL}/gestures/mappings/bulk`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ mappings: mappingsArray })
        })
      ];

      if (security) {
        savePromises.push(
          fetch(`${API_URL}/gestures/security`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(security)
          })
        );
      }

      await Promise.all(savePromises);
      setHasChanges(false);
    } catch (e) {
      console.error("Bulk save failed", e);
    } finally {
      setSaving(false);
    }
  };

  const groupedActions = actions.reduce((acc, act) => {
    if (!acc[act.device_name]) acc[act.device_name] = [];
    acc[act.device_name].push(act);
    return acc;
  }, {} as Record<string, DeviceAction[]>);

  const assignedGestures = [
    ...Object.values(mappings),
    security?.emergency_gesture
  ].filter(Boolean) as string[];

  return (
    <div ref={containerRef} className={`relative transition-all duration-300 ${isOpen ? "z-[100]" : "z-40"}`}>
      <Button 
          onClick={() => setIsOpen(!isOpen)}
          variant="outline" 
          className={`h-11 px-4 flex items-center gap-3 transition-all duration-300 border-zinc-800 ${
            isOpen 
            ? "bg-zinc-800 text-white border-zinc-700 shadow-lg shadow-emerald-500/10" 
            : "bg-black/40 backdrop-blur text-zinc-100 hover:bg-zinc-900 hover:border-zinc-700" 
          }`}
      >
          {isOpen ? <X className="w-5 h-5"/> : <Hand className="w-5 h-5 text-emerald-400" />}
          <span className="hidden md:inline font-medium text-sm">Hand Control</span>
          {hasChanges && <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-pulse" />}
      </Button>

      {isOpen && (
        <Card className="absolute top-14 left-0 w-[450px] md:w-[500px] bg-black/95 backdrop-blur-xl border-zinc-800 shadow-2xl p-0 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-left rounded-xl flex flex-col max-h-[700px]">
            
            <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/50 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                        <Settings2 className="w-5 h-5 text-emerald-400"/>
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-zinc-100 leading-tight">Device Functions</h3>
                        <p className="text-xs text-zinc-500 mt-0.5">Assign hand gestures to commands</p>
                    </div>
                </div>
            </div>

            <div className="overflow-y-auto scrollbar-hide flex-1 pb-4">
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-zinc-600"/></div>
              ) : (
                <div className="p-5 space-y-6">
                  
                  <div className="relative overflow-hidden border border-rose-900/50 bg-rose-950/20 rounded-xl p-4">
                    <div className="absolute top-0 left-0 w-1 h-full bg-rose-500/80"></div>
                    <div className="flex items-center gap-2 mb-3">
                      <ShieldAlert className="w-5 h-5 text-rose-500 animate-pulse" />
                      <h4 className="text-sm font-bold text-rose-400">Emergency Protocol Trigger</h4>
                    </div>
                    
                    <div className="flex items-center justify-between pl-2">
                      <span className="text-xs font-medium text-zinc-400 w-1/2">SOS Gesture</span>
                      <div className="w-1/2 relative">
                        <select 
                          className={`w-full bg-zinc-950 border rounded-md p-1.5 text-xs focus:outline-none transition-colors appearance-none ${security?.emergency_gesture ? "border-rose-500/50 text-rose-400" : "border-zinc-800 text-zinc-500"}`}
                          value={security?.emergency_gesture || ""}
                          onChange={(e) => handleSecurityGestureChange(e.target.value)}
                        >
                          <option value="">-- Select SOS Gesture --</option>
                          {AVAILABLE_GESTURES.map(g => {
                            const isUsedByOther = assignedGestures.includes(g.id) && security?.emergency_gesture !== g.id;
                            if (isUsedByOther) return null;
                            return <option key={g.id} value={g.id}>{g.label}</option>;
                          })}
                        </select>
                        {security?.emergency_gesture && <CheckCircle className="w-3 h-3 text-rose-500 absolute right-6 top-2 pointer-events-none" />}
                      </div>
                    </div>
                  </div>

                  {Object.keys(groupedActions).length === 0 ? (
                    <div className="text-center py-8 text-zinc-500 text-sm">No compatible devices found.</div>
                  ) : (
                    Object.entries(groupedActions).map(([deviceName, deviceActions]) => {
                      const isBulb = deviceActions.some(a => a.action.includes('brightness'));
                      
                      return (
                        <div key={deviceName} className="space-y-3">
                          <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                            {isBulb ? <Lightbulb className="w-4 h-4 text-zinc-400"/> : <Zap className="w-4 h-4 text-zinc-400"/>}
                            <h4 className="text-sm font-bold text-zinc-300">{deviceName}</h4>
                          </div>

                          <div className="space-y-2 pl-2">
                            {deviceActions.map((act) => {
                              const actionKey = `${act.device_id}|${act.action}`;
                              const currentAssignedGesture = mappings[actionKey] || "";

                              return (
                                <div key={actionKey} className="flex items-center justify-between bg-zinc-900/40 p-2.5 rounded-lg border border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                                  <span className="text-xs font-medium text-zinc-400 w-1/2 truncate pr-2">
                                    {act.label.split(" - ")[1] || act.action}
                                  </span>
                                  
                                  <div className="w-1/2 relative">
                                    <select 
                                      className={`w-full bg-zinc-950 border rounded-md p-1.5 text-xs focus:outline-none transition-colors appearance-none ${currentAssignedGesture ? "border-emerald-500/50 text-emerald-400" : "border-zinc-800 text-zinc-500"}`}
                                      value={currentAssignedGesture}
                                      onChange={(e) => handleAssign(actionKey, e.target.value)}
                                    >
                                      <option value="">-- Select --</option>
                                      {AVAILABLE_GESTURES.map(g => {
                                        const isUsedByOther = assignedGestures.includes(g.id) && currentAssignedGesture !== g.id;
                                        if (isUsedByOther) return null; 
                                        return <option key={g.id} value={g.id}>{g.label}</option>;
                                      })}
                                    </select>
                                    {currentAssignedGesture && <CheckCircle className="w-3 h-3 text-emerald-500 absolute right-6 top-2 pointer-events-none" />}
                                  </div>
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

            <div className="p-4 border-t border-zinc-800 bg-zinc-950 shrink-0">
               <Button 
                 onClick={handleSaveAll}
                 disabled={!hasChanges || saving}
                 className={`w-full h-11 font-semibold transition-all ${hasChanges ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20" : "bg-zinc-800 text-zinc-500"}`}
               >
                 {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                 {saving ? "Saving Configuration..." : "Save Configuration"}
               </Button>
            </div>
        </Card>
      )}
    </div>
  );
}