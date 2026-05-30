'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, Phone, User, MessageSquare, PhoneCall, Send, 
  Bot, Settings2, ArrowRight, Loader2, Palette, Timer, 
  Activity, Info, ChevronDown 
} from 'lucide-react';
import s from '@/components/auth/auth.module.css';

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
          emergency_action_text: data.emergency_action_text || "Intruder detected! The authorities have been notified.",
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
      console.warn("Backend offline. Using default mock settings for security setup.", e);
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
      console.warn("Save failed, proceeding in mock mode.", e);
      onNext();
    }
  };

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
                <ShieldAlert size={28} />
              </div>

              <h1 className={s.title}>Security Protocol</h1>
              <p className={s.subtitle} style={{ maxWidth: 440, margin: '8px auto 0' }}>
                Before we map your smart devices, let&apos;s configure your Emergency SOS alerts. Who should the house contact if you&apos;re in danger?
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
                <Settings2 size={20} /> Setup Protocols
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
              <h3 className={s.title} style={{ fontSize: 24, textAlign: 'left', marginBottom: 4 }}>SOS Contacts & Alerts</h3>
              <p className={s.subtitle} style={{ textAlign: 'left', marginBottom: 24 }}>Define how the system reacts during a lockdown.</p>

              {loading ? (
                <div className="flex-1 flex items-center justify-center" style={{ minHeight: 200 }}>
                  <Loader2 className={`${s.spin} text-[var(--accent-orange)]`} size={32} />
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto scrollbar-hide text-left space-y-4 pr-2 pb-4">
                  
                  <div className={s.gridTwo}>
                    <div>
                      <label className={s.label}>
                        <User size={12} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }}/> Contact Name
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. Tuna" 
                        value={security.emergency_contact_name} 
                        onChange={(e) => handleChange("emergency_contact_name", e.target.value)}
                        className={s.input}
                      />
                    </div>
                    <div>
                      <label className={s.label}>
                        <Phone size={12} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }}/> Phone Number
                      </label>
                      <input 
                        type="text" 
                        placeholder="+90 555..." 
                        value={security.emergency_phone} 
                        onChange={(e) => handleChange("emergency_phone", e.target.value)}
                        className={s.input}
                      />
                    </div>
                  </div>

                  <div className={`${s.gridTwo} ${s.sectionDivider}`}>
                    <div>
                      <label className={s.label}>SOS Trigger (4s)</label>
                      <div className={s.selectWrapper}>
                        <select 
                          className={s.selectInput}
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
                        <ChevronDown size={16} className={s.selectChevron} />
                      </div>
                    </div>
                    <div>
                      <label className={s.label}>SOS Cancel (2s)</label>
                      <div className={s.selectWrapper}>
                        <select 
                          className={s.selectInput}
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
                        <ChevronDown size={16} className={s.selectChevron} />
                      </div>
                    </div>
                  </div>

                  <div className={s.infoBanner} style={{ marginTop: 12, marginBottom: 24 }}>
                    <Info size={18} className={s.infoBannerIcon} />
                    <p className={s.infoBannerText}>
                      <strong className={s.infoBannerStrong}>How it works:</strong> Hold the Trigger Gesture for <strong>4 seconds</strong> to initiate. The smart bulbs will flash <strong>orange-peach for 1 second</strong> to silently confirm. You then have a <strong>4-second window</strong> to abort the lockdown by holding the Cancel Gesture for <strong>2 seconds</strong>.
                    </p>
                  </div>

                  <div className={s.gridTwo}>
                    <div>
                      <label className={s.label}>
                        <Palette size={12} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }}/> Alert Color
                      </label>
                      <div className={s.selectWrapper}>
                        <select 
                          className={s.selectInput}
                          value={security.emergency_light_color}
                          onChange={(e) => handleChange("emergency_light_color", e.target.value)}
                        >
                          <option value="red">Flashing Orange-Peach</option>
                          <option value="blue">Warm White Glow</option>
                          <option value="police">Ambient Strobe (Peach/White)</option>
                        </select>
                        <ChevronDown size={16} className={s.selectChevron} />
                      </div>
                    </div>
                    <div>
                      <label className={s.label}>
                        <Timer size={12} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }}/> Duration
                      </label>
                      <div className={s.selectWrapper}>
                        <select 
                          className={s.selectInput}
                          value={security.emergency_duration}
                          onChange={(e) => handleChange("emergency_duration", parseInt(e.target.value))}
                        >
                          <option value={10}>10 Seconds</option>
                          <option value={20}>20 Seconds</option>
                          <option value={30}>30 Seconds</option>
                        </select>
                        <ChevronDown size={16} className={s.selectChevron} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3" style={{ marginTop: 16 }}>
                    <label className={s.label}>Smart Sensors</label>
                    <label 
                        className={`flex items-center border cursor-pointer transition-all duration-200 ${
                        security.use_fall_detection 
                          ? "bg-[rgba(196,168,224,0.08)] border-[rgba(196,168,224,0.25)] shadow-md" 
                          : "bg-[rgba(255,255,255,0.02)] border-[var(--border-card)] hover:bg-[rgba(255,255,255,0.04)]"
                      }`}
                      style={{ padding: '22px 24px', borderRadius: '16px' }}
                    >
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={security.use_fall_detection} 
                        onChange={(e) => handleChange("use_fall_detection", e.target.checked)} 
                      />
                      <Activity 
                        size={24} 
                        className={security.use_fall_detection ? "text-[var(--accent-peach)]" : "text-[var(--text-muted)]"} 
                        style={{ marginRight: '18px', flexShrink: 0 }}
                      />
                      <span 
                        className={security.use_fall_detection ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}
                        style={{ fontSize: '16px', fontWeight: 600 }}
                      >
                        Enable AI Fall Detection
                      </span>
                    </label>
                    
                    {security.use_fall_detection && (
                      <div className={s.infoBanner} style={{ marginTop: 12, marginBottom: 24 }}>
                        <Info size={18} className={s.infoBannerIcon} />
                        <p className={s.infoBannerText}>
                          <strong className={s.infoBannerStrong}>Protocol Flow:</strong> Upon detecting a fall, the AI will ask if you are okay and activate the microphone for <strong>10 seconds</strong>. You can abort the emergency alert by saying keywords like <strong>"I&apos;m fine", "Okay", or "Cancel"</strong>, or by showing the <strong>Cancel Gesture</strong> to the camera.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3" style={{ marginTop: 16 }}>
                    <label className={s.label}>Omnichannel Alerts</label>
                    <div className="grid grid-cols-1 gap-3">
                      <label 
                        className={`flex items-center border cursor-pointer transition-all duration-200 ${
                          security.use_sms 
                            ? "bg-[rgba(196,168,224,0.08)] border-[rgba(196,168,224,0.25)] shadow-md" 
                            : "bg-[rgba(255,255,255,0.02)] border-[var(--border-card)] hover:bg-[rgba(255,255,255,0.04)]"
                        }`}
                        style={{ padding: '22px 24px', borderRadius: '16px' }}
                      >
                        <input 
                          type="checkbox" 
                          className="hidden" 
                          checked={security.use_sms} 
                          onChange={(e) => handleChange("use_sms", e.target.checked)} 
                        />
                        <MessageSquare 
                          size={24} 
                          className={security.use_sms ? "text-[var(--accent-peach)]" : "text-[var(--text-muted)]"} 
                          style={{ marginRight: '18px', flexShrink: 0 }}
                        />
                        <span 
                          className={security.use_sms ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}
                          style={{ fontSize: '16px', fontWeight: 600 }}
                        >
                          Send SMS Alert
                        </span>
                      </label>

                      <label 
                        className={`flex items-center border cursor-pointer transition-all duration-200 ${
                          security.use_voice_call 
                            ? "bg-[rgba(196,168,224,0.08)] border-[rgba(196,168,224,0.25)] shadow-md" 
                            : "bg-[rgba(255,255,255,0.02)] border-[var(--border-card)] hover:bg-[rgba(255,255,255,0.04)]"
                        }`}
                        style={{ padding: '22px 24px', borderRadius: '16px' }}
                      >
                        <input 
                          type="checkbox" 
                          className="hidden" 
                          checked={security.use_voice_call} 
                          onChange={(e) => handleChange("use_voice_call", e.target.checked)} 
                        />
                        <PhoneCall 
                          size={24} 
                          className={security.use_voice_call ? "text-[var(--accent-peach)]" : "text-[var(--text-muted)]"} 
                          style={{ marginRight: '18px', flexShrink: 0 }}
                        />
                        <span 
                          className={security.use_voice_call ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}
                          style={{ fontSize: '16px', fontWeight: 600 }}
                        >
                          Make Voice Call (AI TTS)
                        </span>
                      </label>

                      <label 
                        className={`flex items-center border cursor-pointer transition-all duration-200 ${
                          security.use_telegram 
                            ? "bg-[rgba(196,168,224,0.08)] border-[rgba(196,168,224,0.25)] shadow-md" 
                            : "bg-[rgba(255,255,255,0.02)] border-[var(--border-card)] hover:bg-[rgba(255,255,255,0.04)]"
                        }`}
                        style={{ padding: '22px 24px', borderRadius: '16px' }}
                      >
                        <input 
                          type="checkbox" 
                          className="hidden" 
                          checked={security.use_telegram} 
                          onChange={(e) => handleChange("use_telegram", e.target.checked)} 
                        />
                        <Send 
                          size={24} 
                          className={security.use_telegram ? "text-[var(--accent-peach)]" : "text-[var(--text-muted)]"} 
                          style={{ marginRight: '18px', flexShrink: 0 }}
                        />
                        <span 
                          className={security.use_telegram ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}
                          style={{ fontSize: '16px', fontWeight: 600 }}
                        >
                          Send Telegram Push
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col pt-1" style={{ marginTop: 16 }}>
                    <label className={s.label}>
                      <Bot size={12} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }}/> AI Voice Announcement
                    </label>
                    <textarea 
                      rows={2} 
                      placeholder="What should the AI say to the intruder?"
                      value={security.emergency_action_text} 
                      onChange={(e) => handleChange("emergency_action_text", e.target.value)}
                      className={s.input}
                      style={{ resize: 'none' }}
                    />
                  </div>

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
                onClick={handleSaveAndNext} 
                disabled={saving} 
                className={s.btnPrimary} 
                style={{ flex: 1, padding: '16px' }}
              >
                {saving ? <Loader2 className={s.spin} size={20} /> : <>Save & Continue <ArrowRight size={20} /></>}
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}