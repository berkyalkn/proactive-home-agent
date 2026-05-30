'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Hand, Sparkles, Loader2, Lightbulb, Zap, Settings2, Save, ChevronDown 
} from 'lucide-react';
import { OnboardingData } from '@/app/onboarding/page';
import s from '@/components/auth/auth.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Props {
  formData: OnboardingData;
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

export default function Step5Gestures({ 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  formData, 
  onNext, 
  onPrev 
}: Props) {
  const [mode, setMode] = useState<'intro' | 'setup' | 'saving'>('intro');
  const [loadingData, setLoadingData] = useState(false);
  
  const [actions, setActions] = useState<DeviceAction[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  
  const [reservedGestures, setReservedGestures] = useState<string[]>([]);

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
        mapData.mappings.forEach((m: { target_device_id: string; action: string; gesture_name: string }) => {
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
    } catch (e) {
      console.error("Failed to load gesture actions:", e);
      alert("Failed to load available device actions from backend. Please make sure the Raspberry Pi is online.");
      setMode('intro');
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
        .filter((entry) => entry[1] !== "")
        .map(([actionKey, gestureName]) => {
          const [deviceId, action] = actionKey.split("|");
          return { gesture_name: gestureName, target_device_id: deviceId, action: action };
        });

      await fetch(`${API_URL}/gestures/mappings/bulk`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ mappings: mappingsArray })
      });

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

  const assignedGestures = Object.values(mappings);

  return (
    <div className={s.cardWide} style={{ minHeight: 500, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
      <AnimatePresence mode="wait">
        
        {mode === 'intro' && (
          <motion.div 
            key="intro" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }} 
            className="w-full relative z-10 flex flex-col h-full"
          >
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className={s.headerIcon} style={{ background: 'rgba(196, 168, 224, 0.1)', borderColor: 'rgba(196, 168, 224, 0.15)', color: 'var(--accent-orange)' }}>
                <Hand size={28} />
              </div>

              <h1 className={s.title}>Hand Control</h1>
              <p className={s.subtitle} style={{ maxWidth: 440, margin: '8px auto 0' }}>
                Your security protocol is ready. Now, map specific hand gestures to control your smart home devices instantly.
              </p>
            </div>
            
            <div className={s.actionRow} style={{ width: '100%', display: 'flex', gap: 12, alignItems: 'stretch' }}>
              {onPrev && (
                <button 
                  onClick={onPrev} 
                  className={s.btnSecondary} 
                  style={{ width: 90, flex: '0 0 90px', padding: '16px' }}
                >
                  Back
                </button>
              )}
              <button 
                onClick={onNext} 
                className={s.btnSecondary} 
                style={{ width: 90, flex: '0 0 90px', padding: '16px' }}
              >
                Skip
              </button>
              <button 
                onClick={fetchData} 
                className={s.btnPrimary} 
                style={{ flex: 1, padding: '16px' }}
              >
                <Settings2 size={20} /> Map Gestures
              </button>
            </div>
          </motion.div>
        )}

        {mode === 'setup' && (
          <motion.div 
            key="setup" 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }} 
            className="w-full relative z-10 flex flex-col h-full"
          >
            <div className="flex-1 flex flex-col w-full h-[480px]">
              <h3 className={s.title} style={{ fontSize: 24, textAlign: 'left', marginBottom: 4 }}>Gesture Mapping</h3>
              <p className={s.subtitle} style={{ textAlign: 'left', marginBottom: 24 }}>Assign gestures to devices. (Security gestures are hidden)</p>

              {loadingData ? (
                <div className="flex-1 flex items-center justify-center" style={{ minHeight: 200 }}>
                  <Loader2 className={`${s.spin} text-[var(--accent-orange)]`} size={32} />
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto scrollbar-hide text-left space-y-6 pr-2 pb-4">
                  
                  {Object.keys(groupedActions).length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-sm">No compatible devices found in your home yet.</div>
                  ) : (
                    Object.entries(groupedActions).map(([deviceName, deviceActions]) => {
                      const isBulb = deviceActions.some(a => a.action.includes('brightness') || a.device_name.toLowerCase().includes('light'));
                      return (
                        <div 
                          key={deviceName} 
                          className="space-y-4 border rounded-2xl p-5 transition-colors" 
                          style={{ 
                            background: 'rgba(255, 255, 255, 0.02)', 
                            borderColor: 'var(--border-card)',
                            marginBottom: '24px'
                          }}
                        >
                          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                            {isBulb ? (
                              <Lightbulb size={18} className="text-[var(--accent-peach)]" />
                            ) : (
                              <Zap size={18} className="text-[var(--accent-orange)]" />
                            )}
                            <h4 className="text-sm font-extrabold text-[var(--text-primary)] tracking-tight">{deviceName}</h4>
                          </div>
                          
                          <div className="space-y-3">
                            {deviceActions.map((act) => {
                              const actionKey = `${act.device_id}|${act.action}`;
                              const currentAssigned = mappings[actionKey] || "";
                              return (
                                <div key={actionKey} className="flex items-center justify-between gap-3" style={{ padding: '4px 0' }}>
                                  <span 
                                    className="text-[11px] font-extrabold tracking-wider uppercase w-1/2"
                                    style={{ 
                                      paddingLeft: '12px', 
                                      color: 'rgba(255, 255, 255, 0.75)' 
                                    }}
                                  >
                                    {act.label.split(" - ")[1] || act.action}
                                  </span>
                                  <div className={s.selectWrapper} style={{ width: '50%' }}>
                                    <select 
                                      className={s.selectInput}
                                      value={currentAssigned}
                                      onChange={(e) => handleAssign(actionKey, e.target.value)}
                                      style={currentAssigned ? { borderColor: 'rgba(196, 168, 224, 0.4)', background: 'rgba(196, 168, 224, 0.06)' } : {}}
                                    >
                                      <option value="">-- Select --</option>
                                      {AVAILABLE_GESTURES.map(g => {
                                        const isUsedByOtherDevice = assignedGestures.includes(g.id) && currentAssigned !== g.id;
                                        const isReservedForSecurity = reservedGestures.includes(g.id);
                                        
                                        if (isUsedByOtherDevice || isReservedForSecurity) return null; 
                                        return <option key={g.id} value={g.id}>{g.label}</option>;
                                      })}
                                    </select>
                                    <ChevronDown size={16} className={s.selectChevron} />
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

            <div className={s.actionRow} style={{ width: '100%', display: 'flex', gap: 12, alignItems: 'stretch' }}>
              {onPrev && (
                <button 
                  onClick={onPrev} 
                  className={s.btnSecondary} 
                  style={{ width: 90, flex: '0 0 90px', padding: '16px' }}
                >
                  Back
                </button>
              )}
              <button 
                onClick={onNext} 
                className={s.btnSecondary} 
                style={{ width: 90, flex: '0 0 90px', padding: '16px' }}
              >
                Skip
              </button>
              <button 
                onClick={handleSaveAll} 
                className={s.btnPrimary} 
                style={{ flex: 1, padding: '16px' }}
              >
                <Save size={20} /> Finalize Setup
              </button>
            </div>
          </motion.div>
        )}

        {mode === 'saving' && (
          <motion.div 
            key="saving" 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="flex flex-col items-center justify-center w-full relative z-10 h-64"
          >
            <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border-4 border-white/5 border-t-[var(--accent-orange)]" />
              <Sparkles className="w-8 h-8 text-[var(--accent-orange)]" />
            </div>
            <h3 className={s.title}>Syncing Your Home</h3>
            <p className={s.subtitle} style={{ marginTop: 8 }}>
                Compiling database schemas and encrypting biometric signatures...
            </p>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}