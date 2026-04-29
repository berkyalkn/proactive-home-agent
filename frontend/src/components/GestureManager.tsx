"use client";

import { useState, useEffect, useRef } from "react";
import { Hand, X, Settings2, HandMetal, ThumbsUp, ThumbsDown, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const AVAILABLE_GESTURES = [
  { id: "Thumb_Up", label: "Thumb Up", icon: ThumbsUp },
  { id: "Thumb_Down", label: "Thumb Down", icon: ThumbsDown },
  { id: "Open_Palm", label: "Open Palm", icon: Hand },
  { id: "Closed_Fist", label: "Closed Fist", icon: HandMetal },
  { id: "Pointing_Up", label: "Pointing Up", icon: Hand },
  { id: "Victory", label: "Victory / Peace", icon: Hand },
  { id: "ILoveYou", label: "Rock / I Love You", icon: HandMetal },
];

export function GestureManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actions, setActions] = useState<any[]>([]);
  const [mappings, setMappings] = useState<Record<string, any>>({});
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
      const [actionsRes, mapRes] = await Promise.all([
        fetch(`${API_URL}/gestures/available-actions`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/gestures/mappings`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      const actionsData = await actionsRes.json();
      const mapData = await mapRes.json();
      
      setActions(actionsData.available_actions || []);
      
      const currentMap: Record<string, any> = {};
      mapData.mappings.forEach((m: any) => {
        currentMap[m.gesture_name] = `${m.target_device_id}|${m.action}`;
      });
      setMappings(currentMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchData();
  }, [isOpen]);

  const handleAssign = async (gestureName: string, combinedValue: string) => {
    if (!combinedValue) return;
    
    const [deviceId, action] = combinedValue.split("|");
    const token = localStorage.getItem("token");
    
    setMappings(prev => ({ ...prev, [gestureName]: combinedValue }));

    try {
      await fetch(`${API_URL}/gestures/mappings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ gesture_name: gestureName, target_device_id: deviceId, action: action })
      });
    } catch (e) {
      console.error("Mapping failed", e);
    }
  };

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
          <span className="hidden md:inline font-medium text-sm">Gesture Control</span>
      </Button>

      {isOpen && (
        <Card className="absolute top-14 left-0 w-[450px] bg-black/95 backdrop-blur-xl border-zinc-800 shadow-2xl p-0 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-left rounded-xl">
            
            <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                        <Settings2 className="w-5 h-5 text-emerald-400"/>
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-zinc-100 leading-tight">Command Map</h3>
                        <p className="text-xs text-zinc-500 mt-0.5">Bind hand gestures to device actions</p>
                    </div>
                </div>
            </div>

            <div className="p-5 max-h-[500px] overflow-y-auto scrollbar-hide space-y-4">
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-zinc-600"/></div>
              ) : (
                AVAILABLE_GESTURES.map((gesture) => {
                  const Icon = gesture.icon;
                  const isAssigned = !!mappings[gesture.id];
                  
                  return (
                    <div key={gesture.id} className="flex flex-col gap-2 p-3 bg-zinc-900/40 rounded-xl border border-zinc-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${isAssigned ? "text-emerald-400" : "text-zinc-500"}`} />
                          <span className="text-sm font-semibold text-zinc-200">{gesture.label}</span>
                        </div>
                        {isAssigned && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                      </div>
                      
                      <select 
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500 transition-colors"
                        value={mappings[gesture.id] || ""}
                        onChange={(e) => handleAssign(gesture.id, e.target.value)}
                      >
                        <option value="">-- No Action Assigned --</option>
                        {actions.map((act, idx) => (
                          <option key={idx} value={`${act.device_id}|${act.action}`}>
                            {act.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )
                })
              )}
            </div>
        </Card>
      )}
    </div>
  );
}