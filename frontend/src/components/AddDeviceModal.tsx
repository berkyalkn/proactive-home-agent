"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, X, Loader2, Link as LinkIcon, CheckCircle2, Cpu, Lightbulb, PlugZap, Cctv, Plus, Unlink } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface DiscoveredDevice {
  id: string;
  display_name: string;
  ip: string;
  model: string;
  type: string;
}

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  deviceType: "outlet" | "bulb" | "camera" | "sensor_node";
  onSuccess: () => void;
}

const ICON_MAP = {
  outlet: PlugZap,
  bulb: Lightbulb,
  sensor_node: Cpu,
  camera: Cctv
};

const TITLE_MAP = {
  outlet: "Smart Plug",
  bulb: "Smart Light",
  sensor_node: "Sensor Node",
  camera: "Camera"
};

export function AddDeviceModal({ isOpen, onClose, roomId, deviceType, onSuccess }: AddDeviceModalProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<DiscoveredDevice[]>([]);
  
  const [selectedDevice, setSelectedDevice] = useState<DiscoveredDevice | null>(null);
  const [customName, setCustomName] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const Icon = ICON_MAP[deviceType];

  useEffect(() => {
    if (isOpen) {
      performScan();
    } else {
      setDiscoveredDevices([]);
      setSelectedDevice(null);
      setCustomName("");
      setError(null);
    }
  }, [isOpen]);

  const performScan = async () => {
    setIsScanning(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/discovery/scan`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Network scan failed.");
      const data = await res.json();
      
      const filtered = (data.discovered_devices || []).filter((d: DiscoveredDevice) => d.type === deviceType);
      
      setDiscoveredDevices(filtered);
      setIsScanning(false);

    } catch (e) {
      console.error("Scan failed:", e);
      setError("Failed to scan network. Please ensure devices are powered on.");
      setIsScanning(false);
    }
  };

  const handleSave = async () => {
    if (!selectedDevice) return;
    setIsSaving(true);
    setError(null);

    const finalName = customName.trim() !== "" ? customName : selectedDevice.display_name;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/rooms/${roomId}/devices`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          id: selectedDevice.id,
          display_name: finalName,
          ip: selectedDevice.ip,
          device_type: selectedDevice.type
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to add device.");
      }

      onSuccess(); 
      onClose();  

    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
        >
          <motion.div 
            initial={{ scale: 0.95, y: 20 }} 
            animate={{ scale: 1, y: 0 }} 
            exit={{ scale: 0.95, y: 20 }} 
            className="w-full max-w-md rounded-3xl shadow-2xl overflow-hidden transform-gpu"
            style={{ background: '#1a1d24', border: '1px solid rgba(255, 255, 255, 0.08)' }}
          >

            <div className="p-6 flex flex-col items-center justify-center relative" style={{ background: '#22262e', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <button 
                onClick={onClose} 
                className="absolute top-4 right-4 p-2 rounded-full transition-colors"
                style={{ background: 'rgba(255, 255, 255, 0.06)', color: 'rgba(255, 255, 255, 0.5)' }}
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="relative w-24 h-24 flex items-center justify-center mb-4">
                {isScanning && (
                  <>
                    <div className="absolute inset-0 rounded-full animate-ping opacity-75" style={{ border: '2px solid rgba(196, 168, 224, 0.4)', animationDuration: '2s' }}></div>
                    <div className="absolute inset-2 rounded-full animate-ping opacity-50" style={{ border: '2px solid rgba(196, 168, 224, 0.3)', animationDuration: '2.5s' }}></div>
                  </>
                )}
                <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-inner z-10" style={{ background: 'rgba(196, 168, 224, 0.12)', border: '1px solid rgba(196, 168, 224, 0.2)', color: '#c4a8e0' }}>
                  <Icon className={`w-8 h-8 ${isScanning ? "animate-pulse" : ""}`} />
                </div>
              </div>
              
              <h3 className="font-extrabold text-white text-lg">
                {isScanning ? `Looking for ${TITLE_MAP[deviceType]}s...` : `Add a ${TITLE_MAP[deviceType]}`}
              </h3>
              <p className="text-xs mt-1 text-center px-4" style={{ color: '#6b6f7a' }}>
                {isScanning ? "Searching your Wi-Fi network for available devices." : `Select a discovered device to add to this room.`}
              </p>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto" style={{ background: 'rgba(34, 38, 46, 0.5)' }}>
              {error && (
                <div className="mb-4 p-3 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2" style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#fb7185', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                  <X className="w-4 h-4" /> {error}
                </div>
              )}

              {isScanning ? (
                <div className="flex flex-col gap-3">
                  {[1, 2].map(i => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'rgba(255, 255, 255, 0.04)' }}></div>)}
                </div>
              ) : discoveredDevices.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {discoveredDevices.map(device => {
                    const isSelected = selectedDevice?.id === device.id;

                    const handleIdentify = async (e: React.MouseEvent) => {
                      e.stopPropagation();
                      const btn = e.currentTarget as HTMLButtonElement;
                      btn.classList.add('animate-pulse', 'text-amber-500');
                      try {
                        const token = localStorage.getItem('token');
                        await fetch(`${API_BASE_URL}/discovery/identify/${device.id}`, { 
                          method: 'POST',
                          headers: { Authorization: `Bearer ${token}` }
                        });
                      } catch (err) {
                        console.error("Identify ping failed");
                      }
                      setTimeout(() => btn.classList.remove('animate-pulse', 'text-amber-500'), 2000);
                    };

                    return (
                      <div key={device.id} className="flex flex-col gap-2 rounded-xl transition-all group" style={{ background: isSelected ? 'rgba(196, 168, 224, 0.08)' : '#282c35', border: isSelected ? '1px solid rgba(196, 168, 224, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)' }}>
                        
                        <div className="flex items-center justify-between p-3">
                          <button 
                            onClick={() => {
                              setSelectedDevice(isSelected ? null : device);
                              if (!isSelected) setCustomName("");
                              setError(null);
                            }} 
                            className="flex-1 text-left flex flex-col"
                          >
                            <div className="font-bold text-sm" style={{ color: isSelected ? '#c4a8e0' : '#f0f0f2' }}>
                              {device.display_name}
                            </div>
                            <div className="text-[10px] font-mono mt-0.5 uppercase tracking-wider" style={{ color: isSelected ? 'rgba(196, 168, 224, 0.6)' : '#6b6f7a' }}>
                              {device.id} • IP: {device.ip}
                            </div>
                          </button>
                          
                          <div className="flex items-center gap-2">
                            {(device.type === 'bulb' || device.type === 'outlet') && (
                              <button 
                                onClick={handleIdentify}
                                title="Blink to identify this device"
                                className="p-2 rounded-lg transition-colors"
                                style={{ color: '#6b6f7a', border: '1px solid transparent' }}
                              >
                                <Lightbulb className="w-4 h-4" />
                              </button>
                            )}

                            <button 
                              onClick={() => {
                                setSelectedDevice(isSelected ? null : device);
                                if (!isSelected) setCustomName("");
                                setError(null);
                              }}
                            >
                              {isSelected ? (
                                 <div className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1" style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#fb7185' }}>
                                   <Unlink className="w-3.5 h-3.5" /> Cancel
                                 </div>
                              ) : (
                                 <div className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1" style={{ background: 'rgba(196, 168, 224, 0.1)', color: '#c4a8e0' }}>
                                   <Plus className="w-3.5 h-3.5" /> Select
                                 </div>
                              )}
                            </button>
                          </div>
                        </div>

                        <AnimatePresence>
                          {isSelected && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }} 
                              animate={{ height: 'auto', opacity: 1 }} 
                              exit={{ height: 0, opacity: 0 }} 
                              className="overflow-hidden px-3 pb-3"
                            >
                              <div className="p-3 rounded-xl" style={{ background: 'rgba(196, 168, 224, 0.06)', border: '1px solid rgba(196, 168, 224, 0.15)' }}>
                                <label className="text-[10px] font-extrabold tracking-widest mb-2 block uppercase" style={{ color: '#c4a8e0' }}>Give this device a name</label>
                                <input 
                                  type="text" 
                                  autoFocus
                                  placeholder={`e.g. Desk Lamp, TV Plug...`}
                                  value={customName} 
                                  onChange={e => setCustomName(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                                  className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none" 
                                  style={{ background: '#1a1d24', border: '1px solid rgba(196, 168, 224, 0.2)', color: '#f0f0f2' }}
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Radar className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(255, 255, 255, 0.15)' }} />
                  <p className="text-sm font-bold text-white">No Devices Found</p>
                  <p className="text-xs mt-1 max-w-[250px] mx-auto" style={{ color: '#6b6f7a' }}>Make sure your hardware is powered on and connected to your Wi-Fi.</p>
                  <button onClick={performScan} className="mt-4 px-5 py-2.5 rounded-xl text-sm font-bold transition-all" style={{ background: '#282c35', border: '1px solid rgba(255, 255, 255, 0.08)', color: '#f0f0f2' }}>
                    Scan Again
                  </button>
                </div>
              )}
            </div>
            
            <div className="p-4 flex gap-3" style={{ background: '#1a1d24', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <button 
                onClick={onClose} 
                className="flex-1 py-3.5 px-4 rounded-xl font-bold transition-colors text-sm"
                style={{ background: '#282c35', color: '#a0a4ae' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSave} 
                disabled={!selectedDevice || isSaving}
                className="flex-[2] py-3.5 px-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 text-sm"
                style={{ 
                  background: (!selectedDevice || isSaving) ? '#282c35' : 'rgba(196, 168, 224, 0.15)', 
                  color: (!selectedDevice || isSaving) ? '#6b6f7a' : '#c4a8e0',
                  border: (!selectedDevice || isSaving) ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(196, 168, 224, 0.3)',
                  cursor: (!selectedDevice || isSaving) ? 'not-allowed' : 'pointer'
                }}
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>Add to {formatTitle(roomId)} <CheckCircle2 className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function formatTitle(roomId: string) {
  return roomId.charAt(0).toUpperCase() + roomId.slice(1);
}