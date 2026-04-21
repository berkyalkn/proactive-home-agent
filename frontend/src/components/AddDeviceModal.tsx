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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.95, y: 20 }} 
            animate={{ scale: 1, y: 0 }} 
            exit={{ scale: 0.95, y: 20 }} 
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 transform-gpu"
          >

            <div className="bg-slate-50 p-6 flex flex-col items-center justify-center border-b border-slate-100 relative">
              <button 
                onClick={onClose} 
                className="absolute top-4 right-4 p-2 bg-white rounded-full text-slate-400 hover:text-slate-700 shadow-sm transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="relative w-24 h-24 flex items-center justify-center mb-4">
                {isScanning && (
                  <>
                    <div className="absolute inset-0 border-2 border-indigo-400 rounded-full animate-ping opacity-75" style={{ animationDuration: '2s' }}></div>
                    <div className="absolute inset-2 border-2 border-indigo-300 rounded-full animate-ping opacity-50" style={{ animationDuration: '2.5s' }}></div>
                  </>
                )}
                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shadow-inner z-10">
                  <Icon className={`w-8 h-8 ${isScanning ? "animate-pulse" : ""}`} />
                </div>
              </div>
              
              <h3 className="font-extrabold text-slate-800 text-lg">
                {isScanning ? `Looking for ${TITLE_MAP[deviceType]}s...` : `Add a ${TITLE_MAP[deviceType]}`}
              </h3>
              <p className="text-xs text-slate-500 mt-1 text-center px-4">
                {isScanning ? "Searching your Wi-Fi network for available devices." : `Select a discovered device to add to this room.`}
              </p>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto bg-slate-50/50">
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 text-center flex items-center justify-center gap-2">
                  <X className="w-4 h-4" /> {error}
                </div>
              )}

              {isScanning ? (
                <div className="flex flex-col gap-3">
                  {[1, 2].map(i => <div key={i} className="h-16 bg-slate-200/50 rounded-xl animate-pulse"></div>)}
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
                      <div key={device.id} className={`flex flex-col gap-2 border rounded-xl transition-all group ${isSelected ? "bg-indigo-50 border-indigo-500 shadow-sm" : "bg-white border-slate-200 hover:border-indigo-300"}`}>
                        
                        <div className="flex items-center justify-between p-3">
                          <button 
                            onClick={() => {
                              setSelectedDevice(isSelected ? null : device);
                              if (!isSelected) setCustomName("");
                              setError(null);
                            }} 
                            className="flex-1 text-left flex flex-col"
                          >
                            <div className={`font-bold text-sm ${isSelected ? "text-indigo-900" : "text-slate-800"}`}>
                              {device.display_name}
                            </div>
                            <div className={`text-[10px] font-mono mt-0.5 uppercase tracking-wider ${isSelected ? "text-indigo-400" : "text-slate-400"}`}>
                              {device.id} • IP: {device.ip}
                            </div>
                          </button>
                          
                          <div className="flex items-center gap-2">
                            {(device.type === 'bulb' || device.type === 'outlet') && (
                              <button 
                                onClick={handleIdentify}
                                title="Blink to identify this device"
                                className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors border border-transparent hover:border-amber-200"
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
                                 <div className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-bold flex items-center gap-1">
                                   <Unlink className="w-3.5 h-3.5" /> Cancel
                                 </div>
                              ) : (
                                 <div className="px-3 py-1.5 bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold flex items-center gap-1">
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
                              <div className="p-3 bg-white border border-indigo-200 rounded-xl shadow-inner">
                                <label className="text-[10px] font-extrabold tracking-widest text-indigo-900 mb-2 block uppercase">Give this device a name</label>
                                <input 
                                  type="text" 
                                  autoFocus
                                  placeholder={`e.g. Desk Lamp, TV Plug...`}
                                  value={customName} 
                                  onChange={e => setCustomName(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                                  className="w-full px-3 py-2 text-sm rounded-lg border border-indigo-200 focus:outline-none focus:border-indigo-500 bg-slate-50" 
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
                  <Radar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-600">No Devices Found</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-[250px] mx-auto">Make sure your hardware is powered on and connected to your Wi-Fi.</p>
                  <button onClick={performScan} className="mt-4 px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-indigo-300 text-slate-700 rounded-xl text-sm font-bold transition-all shadow-sm">
                    Scan Again
                  </button>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-white border-t border-slate-100 flex gap-3">
              <button 
                onClick={onClose} 
                className="flex-1 py-3.5 px-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave} 
                disabled={!selectedDevice || isSaving}
                className={`flex-[2] py-3.5 px-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 text-sm ${(!selectedDevice || isSaving) ? "bg-slate-300 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/25"}`}
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