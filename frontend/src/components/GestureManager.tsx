"use client";

import { useState, useEffect } from "react";
import { Hand, X, Settings2, CheckCircle, Loader2, Zap, Lightbulb, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

interface GestureManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onHasChanges?: (hasChanges: boolean) => void;
}

/* ─── Inline styles as typed objects ───────────────────────────── */

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: 'rgba(161, 161, 170, 0.9)',
  letterSpacing: '0.02em',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  paddingLeft: '14px',
  borderLeft: '3px solid rgba(16, 185, 129, 0.6)',
  lineHeight: '1',
};

export function GestureManager({ isOpen, onClose, onHasChanges }: GestureManagerProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  const [actions, setActions] = useState<DeviceAction[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  
  const [reservedGestures, setReservedGestures] = useState<string[]>([]);

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
      if (mapData.mappings) {
        mapData.mappings.forEach((m: any) => {
          currentMap[`${m.target_device_id}|${m.action}`] = m.gesture_name;
        });
      }
      setMappings(currentMap);
      
      if (secData) {
        const reserved = [];
        if (secData.emergency_gesture) reserved.push(secData.emergency_gesture);
        if (secData.emergency_cancel_gesture) reserved.push(secData.emergency_cancel_gesture);
        setReservedGestures(reserved);
      }
      
      setHasChanges(false);
      onHasChanges?.(false);
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
    onHasChanges?.(true);
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

      await fetch(`${API_URL}/gestures/mappings/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mappings: mappingsArray })
      });

      setHasChanges(false);
      onHasChanges?.(false);
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

  const assignedGestures = Object.values(mappings);

  if (!isOpen) return null;

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 45, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      
      <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50, width: 480, maxWidth: 'calc(100vw - 20px)', background: 'linear-gradient(135deg, rgba(20, 22, 28, 0.7) 0%, rgba(20, 22, 28, 0.4) 100%)', backdropFilter: 'blur(40px)', borderRight: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: 'inset 1px 0 0 rgba(255, 255, 255, 0.05), 8px 0 40px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' as const }}>
          
          {/* ── Header ─────────────────────────────────────────── */}
          <div className="flex items-center justify-between shrink-0" style={{ paddingLeft: '28px', paddingRight: '20px', paddingTop: '20px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(5, 150, 105, 0.06)' }}>
              <div className="flex items-center gap-3">
                  <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '10px' }}>
                      <Hand className="w-5 h-5 text-emerald-400"/>
                  </div>
                  <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(209, 250, 229, 0.95)', lineHeight: '1.2' }}>Hand Control</h3>
                      <p style={{ fontSize: '13px', color: 'rgba(16, 185, 129, 0.55)', marginTop: '2px' }}>Assign hand gestures to commands</p>
                  </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
          </div>

          {/* ── Scrollable Content ──────────────────────────────── */}
          <div className="overflow-y-auto overflow-x-hidden scrollbar-hide flex-1 pb-4">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-zinc-600"/></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingLeft: '28px', paddingRight: '20px', paddingTop: '28px', paddingBottom: '28px' }}>

                {Object.keys(groupedActions).length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 text-sm">No compatible devices found.</div>
                ) : (
                  Object.entries(groupedActions).map(([deviceName, deviceActions]) => {
                    const isBulb = deviceActions.some(a => a.action.includes('brightness'));
                    
                    return (
                      <div key={deviceName} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h4 style={sectionHeadingStyle}>
                          {isBulb ? <Lightbulb style={{ width: '14px', height: '14px', color: 'rgba(161,161,170,0.6)' }}/> : <Zap style={{ width: '14px', height: '14px', color: 'rgba(161,161,170,0.6)' }}/>} 
                          <span style={{ textTransform: 'capitalize' }}>{deviceName}</span>
                        </h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {deviceActions.map((act) => {
                            const actionKey = `${act.device_id}|${act.action}`;
                            const currentAssignedGesture = mappings[actionKey] || "";

                            return (
                                <div key={actionKey} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '48px', padding: '0 14px', borderRadius: '12px', transition: 'all 0.25s ease', border: `1px solid ${currentAssignedGesture ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.04)'}`, background: currentAssignedGesture ? 'rgba(16, 185, 129, 0.06)' : 'rgba(255,255,255,0.01)' }}>
                                  <span style={{ fontSize: '16px', fontWeight: 500, color: currentAssignedGesture ? 'rgba(209, 250, 229, 0.9)' : 'rgba(161, 161, 170, 0.6)', flex: 1 }}>
                                    {act.label.split(" - ")[1] || act.action}
                                  </span>
                                  
                                  <div style={{ width: '180px', position: 'relative' }}>
                                    <select 
                                      className="w-full bg-transparent border-none focus:outline-none appearance-none cursor-pointer"
                                      style={{ fontSize: '16px', color: currentAssignedGesture ? 'rgba(52, 211, 153, 0.9)' : 'rgba(161, 161, 170, 0.6)', textAlign: 'right', paddingRight: currentAssignedGesture ? '24px' : '0' }}
                                      value={currentAssignedGesture}
                                      onChange={(e) => handleAssign(actionKey, e.target.value)}
                                    >
                                      <option value="" className="bg-zinc-900 text-zinc-400">Unassigned</option>
                                      {AVAILABLE_GESTURES.map(g => {
                                        const isUsedByOther = assignedGestures.includes(g.id) && currentAssignedGesture !== g.id;
                                        const isReservedForSecurity = reservedGestures.includes(g.id);
                                        
                                        if (isUsedByOther || isReservedForSecurity) return null; 
                                        return <option key={g.id} value={g.id} className="bg-zinc-900 text-zinc-200">{g.label}</option>;
                                      })}
                                    </select>
                                    {currentAssignedGesture && <CheckCircle style={{ width: '16px', height: '16px', color: 'rgba(16, 185, 129, 0.8)' }} className="absolute right-0 top-[4px] pointer-events-none" />}
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

          {/* ── Sticky Bottom Bar ───────────────────────────────── */}
          <div className="shrink-0" style={{ position: 'sticky', bottom: 0, paddingLeft: '28px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(20px)' }}>
             <Button 
               onClick={handleSaveAll}
               disabled={!hasChanges || saving}
               className={`w-full h-12 font-semibold transition-all rounded-xl ${hasChanges ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg hover:shadow-emerald-500/20" : "bg-zinc-800 text-zinc-500"}`}
               style={{ fontSize: '16px' }}
             >
               {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
               {saving ? "Saving Configuration..." : "Save Configuration"}
             </Button>
          </div>
      </div>
    </>
  );
}