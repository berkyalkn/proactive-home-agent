"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, X, Phone, User, Settings2, CheckCircle, Loader2, MessageSquare, PhoneCall, Send, Bot, Palette, Timer, Activity, Info, Zap, Volume2, Baby } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  detect_glass_break: boolean;  
  detect_baby_cry: boolean;    
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

interface EmergencyManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onActiveStatusChange?: (isActive: boolean) => void;
}


const sectionHeadingStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: 'rgba(161, 161, 170, 0.9)',
  letterSpacing: '0.02em',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  paddingLeft: '14px',
  borderLeft: '3px solid rgba(244, 63, 94, 0.6)',
  lineHeight: '1',
};

const labelStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: 'rgba(113, 113, 122, 1)',
  letterSpacing: '0.02em',
  textTransform: 'uppercase' as const,
};

const inputStyle: React.CSSProperties = {
  fontSize: '16px',
  lineHeight: '1.5',
};

const selectStyle: React.CSSProperties = {
  fontSize: '16px',
  lineHeight: '1.5',
};

const protocolBoxBaseStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderRadius: '14px',
  display: 'flex',
  gap: '12px',
  alignItems: 'flex-start',
  transition: 'all 0.3s ease',
};

const protocolBoxSkyStyle: React.CSSProperties = {
  ...protocolBoxBaseStyle,
  background: 'rgba(255, 255, 255, 0.03)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(14, 165, 233, 0.12)',
};

const protocolBoxPurpleStyle: React.CSSProperties = {
  ...protocolBoxBaseStyle,
  background: 'rgba(255, 255, 255, 0.03)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(168, 85, 247, 0.12)',
};

const protocolIconWrapperStyle = (color: string): React.CSSProperties => ({
  width: '28px',
  height: '28px',
  borderRadius: '8px',
  background: color === 'sky' ? 'rgba(14, 165, 233, 0.15)' : 'rgba(168, 85, 247, 0.15)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  marginTop: '1px',
});

const protocolTextStyle: React.CSSProperties = {
  fontSize: '13px',
  lineHeight: '1.65',
  color: 'rgba(200, 210, 225, 0.75)',
};

const channelRowStyle = (isActive: boolean, accentColor: string): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  height: '48px',
  padding: '0 14px',
  borderRadius: '12px',
  cursor: 'pointer',
  transition: 'all 0.25s ease',
  border: `1px solid ${isActive ? (accentColor === 'emerald' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(14, 165, 233, 0.25)') : 'rgba(255,255,255,0.04)'}`,
  background: isActive
    ? (accentColor === 'emerald' ? 'rgba(16, 185, 129, 0.06)' : 'rgba(14, 165, 233, 0.06)')
    : 'rgba(255,255,255,0.01)',
});

const toggleTrackStyle = (isActive: boolean, accentColor: string): React.CSSProperties => {
  let bg = 'rgba(14, 165, 233, 0.7)'; 
  if (accentColor === 'emerald') bg = 'rgba(16, 185, 129, 0.7)';
  if (accentColor === 'purple') bg = 'rgba(168, 85, 247, 0.7)';
  if (accentColor === 'amber') bg = 'rgba(245, 158, 11, 0.7)';
  if (accentColor === 'indigo') bg = 'rgba(99, 102, 241, 0.7)';

  return {
    width: '36px',
    height: '20px',
    borderRadius: '10px',
    background: isActive ? bg : 'rgba(255,255,255,0.08)',
    position: 'relative' as const,
    transition: 'background 0.25s ease',
    flexShrink: 0,
    cursor: 'pointer',
  };
};

const toggleThumbStyle = (isActive: boolean): React.CSSProperties => ({
  width: '16px',
  height: '16px',
  borderRadius: '50%',
  background: '#fff',
  position: 'absolute' as const,
  top: '2px',
  left: isActive ? '18px' : '2px',
  transition: 'left 0.25s ease',
  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
});

export function EmergencyManager({ isOpen, onClose, onActiveStatusChange }: EmergencyManagerProps) {
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
    detect_glass_break: true, 
    detect_baby_cry: false,   
    is_active: true
  });

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
        const newSettings = {
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
          detect_glass_break: data.detect_glass_break ?? true, 
          detect_baby_cry: data.detect_baby_cry ?? false,      
          is_active: data.is_active ?? true
        };
        setSecurity(newSettings);
        onActiveStatusChange?.(newSettings.is_active);
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
    if (field === 'is_active') {
      onActiveStatusChange?.(value as boolean);
    }
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

  if (!isOpen) return null;

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 45, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      
      <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50, width: 460, maxWidth: 'calc(100vw - 20px)', background: 'linear-gradient(135deg, rgba(20, 22, 28, 0.7) 0%, rgba(20, 22, 28, 0.4) 100%)', backdropFilter: 'blur(40px)', borderRight: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: 'inset 1px 0 0 rgba(255, 255, 255, 0.05), 8px 0 40px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' as const }}>
          
          <div className="flex items-center justify-between shrink-0" style={{ paddingLeft: '28px', paddingRight: '20px', paddingTop: '20px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(159, 18, 57, 0.06)' }}>
              <div className="flex items-center gap-3">
                  <div style={{ padding: '8px', background: 'rgba(244, 63, 94, 0.15)', borderRadius: '10px' }}>
                      <ShieldAlert className="w-5 h-5 text-rose-400"/>
                  </div>
                  <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(255, 228, 230, 0.95)', lineHeight: '1.2' }}>Emergency Protocol</h3>
                      <p style={{ fontSize: '13px', color: 'rgba(244, 63, 94, 0.55)', marginTop: '2px' }}>Configure SOS actions and notifications</p>
                  </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
          </div>

          <div className="overflow-y-auto overflow-x-hidden scrollbar-hide flex-1" style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingLeft: '28px', paddingRight: '20px', paddingTop: '28px', paddingBottom: '28px' }}>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-zinc-600"/></div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={sectionHeadingStyle}>
                    <User style={{ width: '14px', height: '14px', color: 'rgba(161,161,170,0.6)' }} /> Emergency Contact
                  </h4>
                  
                  <div className="flex items-center bg-white/[0.02] border border-white/[0.05] rounded-xl focus-within:border-rose-500/35 focus-within:bg-rose-950/5 transition-all duration-300" style={{ padding: '4px 6px 4px 4px' }}>
                    <div style={{ paddingLeft: '10px', paddingRight: '8px', flexShrink: 0 }} className="text-zinc-500"><User className="w-4 h-4" /></div>
                    <input 
                      type="text" 
                      placeholder="Contact Name (e.g. Tuna)" 
                      value={security.emergency_contact_name}
                      onChange={(e) => handleChange("emergency_contact_name", e.target.value)}
                      style={{ ...inputStyle, minWidth: 0 }}
                      className="w-full bg-transparent p-2 text-zinc-200 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center bg-white/[0.02] border border-white/[0.05] rounded-xl focus-within:border-rose-500/35 focus-within:bg-rose-950/5 transition-all duration-300" style={{ padding: '4px 6px 4px 4px' }}>
                    <div style={{ paddingLeft: '10px', paddingRight: '8px', flexShrink: 0 }} className="text-zinc-500"><Phone className="w-4 h-4" /></div>
                    <input 
                      type="text" 
                      placeholder="Phone Number (+90...)" 
                      value={security.emergency_phone}
                      onChange={(e) => handleChange("emergency_phone", e.target.value)}
                      style={{ ...inputStyle, minWidth: 0 }}
                      className="w-full bg-transparent p-2 text-zinc-200 focus:outline-none"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h4 style={sectionHeadingStyle}>
                    <Settings2 style={{ width: '14px', height: '14px', color: 'rgba(161,161,170,0.6)' }} /> SOS Gestures
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <label style={labelStyle}>SOS Trigger (4s)</label>
                          <select 
                              className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 text-zinc-200 focus:outline-none focus:border-rose-500/35 hover:border-white/[0.1] hover:bg-white/[0.04] cursor-pointer transition-all duration-300"
                              style={{ ...selectStyle, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}
                              value={security.emergency_gesture}
                              onChange={(e) => handleChange("emergency_gesture", e.target.value)}
                          >
                              {AVAILABLE_GESTURES.map(g => {
                                  const isUsedByCancel = security.emergency_cancel_gesture === g.id;
                                  const isUsedByDevice = assignedDeviceGestures.includes(g.id);
                                  const isDisabled = isUsedByCancel || isUsedByDevice;
                                  return (
                                      <option key={g.id} value={g.id} disabled={isDisabled} className="bg-zinc-900 text-zinc-200">
                                          {g.label} {isUsedByDevice ? "(Used)" : ""}
                                      </option>
                                  );
                              })}
                          </select>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <label style={labelStyle}>SOS Cancel (2s)</label>
                          <select 
                              className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 text-zinc-200 focus:outline-none focus:border-emerald-500/35 hover:border-white/[0.1] hover:bg-white/[0.04] cursor-pointer transition-all duration-300"
                              style={{ ...selectStyle, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}
                              value={security.emergency_cancel_gesture}
                              onChange={(e) => handleChange("emergency_cancel_gesture", e.target.value)}
                          >
                              {AVAILABLE_GESTURES.map(g => {
                                  const isUsedByTrigger = security.emergency_gesture === g.id;
                                  const isUsedByDevice = assignedDeviceGestures.includes(g.id);
                                  const isDisabled = isUsedByTrigger || isUsedByDevice;
                                  return (
                                      <option key={g.id} value={g.id} disabled={isDisabled} className="bg-zinc-900 text-zinc-200">
                                          {g.label} {isUsedByDevice ? "(Used)" : ""}
                                      </option>
                                  );
                              })}
                          </select>
                      </div>
                  </div>

                  <div style={protocolBoxSkyStyle}>
                      <div style={protocolIconWrapperStyle('sky')}>
                        <Zap style={{ width: '14px', height: '14px', color: 'rgba(56, 189, 248, 0.9)' }} />
                      </div>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(186, 230, 253, 0.85)', marginBottom: '4px' }}>Protocol Flow</p>
                        <p style={protocolTextStyle}>
                            Hold trigger for <strong>4s</strong> to initiate. The smart bulbs will flash <strong>RED for 1s</strong> to silently confirm. You then have a <strong>4s window</strong> to abort the lockdown by holding the Cancel Gesture for <strong>2s</strong>.
                        </p>
                      </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h4 style={sectionHeadingStyle}>
                    <Palette style={{ width: '14px', height: '14px', color: 'rgba(161,161,170,0.6)' }} /> Alert Customization
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={labelStyle}>Alert Color</label>
                        <select 
                            className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 text-zinc-200 focus:outline-none focus:border-rose-500/35 hover:border-white/[0.1] hover:bg-white/[0.04] cursor-pointer transition-all duration-300"
                            style={{ ...selectStyle, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}
                            value={security.emergency_light_color}
                            onChange={(e) => handleChange("emergency_light_color", e.target.value)}
                        >
                            <option value="red" className="bg-zinc-900 text-zinc-200">Flashing Red</option>
                            <option value="blue" className="bg-zinc-900 text-zinc-200">Flashing Blue</option>
                            <option value="police" className="bg-zinc-900 text-zinc-200">Police Strobe</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={labelStyle}>Duration</label>
                        <select 
                            className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 text-zinc-200 focus:outline-none focus:border-rose-500/35 hover:border-white/[0.1] hover:bg-white/[0.04] cursor-pointer transition-all duration-300"
                            style={{ ...selectStyle, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}
                            value={security.emergency_duration}
                            onChange={(e) => handleChange("emergency_duration", parseInt(e.target.value))}
                        >
                            <option value={10} className="bg-zinc-900 text-zinc-200">10 Seconds</option>
                            <option value={20} className="bg-zinc-900 text-zinc-200">20 Seconds</option>
                            <option value={30} className="bg-zinc-900 text-zinc-200">30 Seconds</option>
                        </select>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h4 style={sectionHeadingStyle}>
                    <Activity style={{ width: '14px', height: '14px', color: 'rgba(161,161,170,0.6)' }} /> Smart Sensors
                  </h4>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    height: '48px',
                    padding: '0 14px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    border: `1px solid ${security.use_fall_detection ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255,255,255,0.04)'}`,
                    background: security.use_fall_detection ? 'rgba(168, 85, 247, 0.06)' : 'rgba(255,255,255,0.01)',
                  }}>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={security.use_fall_detection} 
                        onChange={(e) => handleChange("use_fall_detection", e.target.checked)} 
                      />
                      <Activity style={{ width: '16px', height: '16px', color: security.use_fall_detection ? 'rgba(192, 132, 252, 0.85)' : 'rgba(113, 113, 122, 0.5)', flexShrink: 0 }} />
                      <span style={{ fontSize: '16px', fontWeight: 500, color: security.use_fall_detection ? 'rgba(233, 213, 255, 0.9)' : 'rgba(161, 161, 170, 0.6)', flex: 1 }}>Enable AI Fall Detection</span>
                      <div style={toggleTrackStyle(security.use_fall_detection, 'purple')}>
                        <div style={toggleThumbStyle(security.use_fall_detection)} />
                      </div>
                  </label>
                  
                  {security.use_fall_detection && (
                      <div style={protocolBoxPurpleStyle} className="animate-in fade-in slide-in-from-top-1">
                          <div style={protocolIconWrapperStyle('purple')}>
                            <Zap style={{ width: '14px', height: '14px', color: 'rgba(192, 132, 252, 0.9)' }} />
                          </div>
                          <div>
                            <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(233, 213, 255, 0.85)', marginBottom: '4px' }}>Protocol Flow</p>
                            <p style={protocolTextStyle}>
                                Upon detecting a fall, the AI will ask if you are okay and activate the microphone for <strong>10 seconds</strong>. You can abort the emergency alert by saying keywords like <strong>&quot;I&apos;m fine&quot;, &quot;Okay&quot;, or &quot;Cancel&quot;</strong>, or by showing the <strong>Cancel Gesture</strong> to the camera.
                            </p>
                          </div>
                      </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h4 style={sectionHeadingStyle}>
                    <Volume2 style={{ width: '14px', height: '14px', color: 'rgba(161,161,170,0.6)' }} /> Acoustic Intelligence
                  </h4>
                  
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: '14px', height: '48px', padding: '0 14px',
                    borderRadius: '12px', cursor: 'pointer', transition: 'all 0.25s ease',
                    border: `1px solid ${security.detect_glass_break ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255,255,255,0.04)'}`,
                    background: security.detect_glass_break ? 'rgba(245, 158, 11, 0.06)' : 'rgba(255,255,255,0.01)',
                  }}>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={security.detect_glass_break} 
                        onChange={(e) => handleChange("detect_glass_break", e.target.checked)} 
                      />
                      <ShieldAlert style={{ width: '16px', height: '16px', color: security.detect_glass_break ? 'rgba(251, 191, 36, 0.85)' : 'rgba(113, 113, 122, 0.5)', flexShrink: 0 }} />
                      <span style={{ fontSize: '16px', fontWeight: 500, color: security.detect_glass_break ? 'rgba(253, 230, 138, 0.9)' : 'rgba(161, 161, 170, 0.6)', flex: 1 }}>Glass Break Detection</span>
                      <div style={toggleTrackStyle(security.detect_glass_break, 'amber')}>
                        <div style={toggleThumbStyle(security.detect_glass_break)} />
                      </div>
                  </label>

                  <label style={{
                    display: 'flex', alignItems: 'center', gap: '14px', height: '48px', padding: '0 14px',
                    borderRadius: '12px', cursor: 'pointer', transition: 'all 0.25s ease',
                    border: `1px solid ${security.detect_baby_cry ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255,255,255,0.04)'}`,
                    background: security.detect_baby_cry ? 'rgba(99, 102, 241, 0.06)' : 'rgba(255,255,255,0.01)',
                  }}>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={security.detect_baby_cry} 
                        onChange={(e) => handleChange("detect_baby_cry", e.target.checked)} 
                      />
                      <Baby style={{ width: '16px', height: '16px', color: security.detect_baby_cry ? 'rgba(129, 140, 248, 0.85)' : 'rgba(113, 113, 122, 0.5)', flexShrink: 0 }} />
                      <span style={{ fontSize: '16px', fontWeight: 500, color: security.detect_baby_cry ? 'rgba(199, 210, 254, 0.9)' : 'rgba(161, 161, 170, 0.6)', flex: 1 }}>Baby Cry Recognition</span>
                      <div style={toggleTrackStyle(security.detect_baby_cry, 'indigo')}>
                        <div style={toggleThumbStyle(security.detect_baby_cry)} />
                      </div>
                  </label>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <h4 style={sectionHeadingStyle}>
                    <PhoneCall style={{ width: '14px', height: '14px', color: 'rgba(161,161,170,0.6)' }} /> Alert Channels
                  </h4>
                  
                  <label style={channelRowStyle(security.use_sms, 'emerald')}>
                    <input type="checkbox" className="hidden" checked={security.use_sms} onChange={(e) => handleChange("use_sms", e.target.checked)} />
                    <MessageSquare style={{ width: '16px', height: '16px', color: security.use_sms ? 'rgba(52, 211, 153, 0.85)' : 'rgba(113, 113, 122, 0.5)', flexShrink: 0 }} />
                    <span style={{ fontSize: '16px', fontWeight: 500, color: security.use_sms ? 'rgba(209, 250, 229, 0.9)' : 'rgba(161, 161, 170, 0.6)', flex: 1 }}>Send SMS Alert</span>
                    <div style={toggleTrackStyle(security.use_sms, 'emerald')}>
                      <div style={toggleThumbStyle(security.use_sms)} />
                    </div>
                  </label>

                  <label style={channelRowStyle(security.use_voice_call, 'emerald')}>
                    <input type="checkbox" className="hidden" checked={security.use_voice_call} onChange={(e) => handleChange("use_voice_call", e.target.checked)} />
                    <PhoneCall style={{ width: '16px', height: '16px', color: security.use_voice_call ? 'rgba(52, 211, 153, 0.85)' : 'rgba(113, 113, 122, 0.5)', flexShrink: 0 }} />
                    <span style={{ fontSize: '16px', fontWeight: 500, color: security.use_voice_call ? 'rgba(209, 250, 229, 0.9)' : 'rgba(161, 161, 170, 0.6)', flex: 1 }}>Make Voice Call (Robot TTS)</span>
                    <div style={toggleTrackStyle(security.use_voice_call, 'emerald')}>
                      <div style={toggleThumbStyle(security.use_voice_call)} />
                    </div>
                  </label>

                  <label style={channelRowStyle(security.use_telegram, 'sky')}>
                    <input type="checkbox" className="hidden" checked={security.use_telegram} onChange={(e) => handleChange("use_telegram", e.target.checked)} />
                    <Send style={{ width: '16px', height: '16px', color: security.use_telegram ? 'rgba(56, 189, 248, 0.85)' : 'rgba(113, 113, 122, 0.5)', flexShrink: 0 }} />
                    <span style={{ fontSize: '16px', fontWeight: 500, color: security.use_telegram ? 'rgba(186, 230, 253, 0.9)' : 'rgba(161, 161, 170, 0.6)', flex: 1 }}>Send Telegram Push</span>
                    <div style={toggleTrackStyle(security.use_telegram, 'sky')}>
                      <div style={toggleThumbStyle(security.use_telegram)} />
                    </div>
                  </label>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                   <h4 style={sectionHeadingStyle}>
                     <Bot style={{ width: '14px', height: '14px', color: 'rgba(161,161,170,0.6)' }} /> AI Voice Announcement
                   </h4>
                   <textarea 
                      rows={3}
                      placeholder="What should the AI say to the intruder?"
                      value={security.emergency_action_text}
                      onChange={(e) => handleChange("emergency_action_text", e.target.value)}
                      style={{ fontSize: '16px', lineHeight: '1.6', boxSizing: 'border-box', maxWidth: '100%', padding: '16px 16px 16px 20px' }}
                      className="w-full bg-white/[0.01] border border-white/[0.05] hover:border-white/[0.08] rounded-2xl text-zinc-300 focus:outline-none focus:border-rose-500/30 resize-none transition-all duration-300 font-normal"
                    />
                </div>
              </>
            )}
          </div>

          <div className="shrink-0" style={{ position: 'sticky', bottom: 0, paddingLeft: '28px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(20px)' }}>
             <Button 
               onClick={handleSave}
               disabled={!hasChanges || saving}
               className={`w-full h-12 font-semibold transition-all rounded-xl ${hasChanges ? "bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-lg hover:shadow-rose-500/20" : "bg-zinc-800 text-zinc-500"}`}
               style={{ fontSize: '16px' }}
             >
               {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ShieldAlert className="w-5 h-5 mr-2" />}
               {saving ? "Updating Protocols..." : "Save Security Protocol"}
             </Button>
          </div>
      </div>
    </>
  );
}