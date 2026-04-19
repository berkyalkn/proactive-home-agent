"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, X, Loader2, Link as LinkIcon, CheckCircle2, Cpu, Lightbulb, PlugZap, Cctv } from 'lucide-react';

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
  bulb: "Smart Bulb",
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
      
      setTimeout(() => {
        setDiscoveredDevices(filtered);
        setIsScanning(false);
      }, 1500);

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
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
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
                    <div className="absolute inset-0 border-2 border-primary rounded-full animate-ping opacity-75"></div>
                    <div className="absolute inset-2 border-2 border-primary/50 rounded-full animate-ping opacity-50" style={{ animationDelay: '300ms' }}></div>
                  </>
                )}
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center shadow-inner z-10">
                  <Icon className={`w-8 h-8 ${isScanning ? "animate-pulse" : ""}`} />
                </div>
              </div>
              
              <h3 className="font-extrabold text-slate-800 text-lg">
                {isScanning ? `Scanning for ${TITLE_MAP[deviceType]}s...` : `Add ${TITLE_MAP[deviceType]}`}
              </h3>
              <p className="text-xs text-slate-500 mt-1 text-center px-4">
                {isScanning ? "Searching local network for new unassigned hardware." : "Select a discovered device and assign it to this room."}
              </p>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto bg-slate-50/50">
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100 text-center">
                  {error}
                </div>
              )}

              {isScanning ? (
                <div className="flex flex-col gap-3">
                  {[1, 2].map(i => <div key={i} className="h-16 bg-slate-200/50 rounded-xl animate-pulse"></div>)}
                </div>
              ) : discoveredDevices.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {discoveredDevices.map(device => {
                    const isSelected = selectedDevice?.id === device.id;

                    return (
                      <div key={device.id} className="flex flex-col gap-2">
                        <button 
                          onClick={() => {
                            setSelectedDevice(isSelected ? null : device);
                            setCustomName("");
                            setError(null);
                          }} 
                          className={`flex items-center justify-between p-4 border rounded-xl transition-all text-left ${isSelected ? "bg-primary/5 border-primary shadow-sm" : "bg-white border-slate-200 hover:border-primary/30"}`}
                        >
                          <div>
                            <div className={`font-bold text-sm ${isSelected ? "text-primary" : "text-slate-800"}`}>
                              {device.display_name}
                            </div>
                            <div className={`text-[10px] font-mono mt-0.5 uppercase tracking-wider ${isSelected ? "text-primary/70" : "text-slate-400"}`}>
                              {device.id} • {device.ip}
                            </div>
                          </div>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${isSelected ? "bg-primary border-primary text-white" : "border-slate-300"}`}>
                            {isSelected && <CheckCircle2 className="w-4 h-4" />}
                          </div>
                        </button>

                        <AnimatePresence>
                          {isSelected && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }} 
                              animate={{ height: 'auto', opacity: 1 }} 
                              exit={{ height: 0, opacity: 0 }} 
                              className="overflow-hidden"
                            >
                              <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl">
                                <label className="text-[10px] font-bold text-primary/80 uppercase tracking-wider mb-1 block">Custom Name (Optional)</label>
                                <input 
                                  type="text" 
                                  placeholder={`e.g. Desk Lamp, Coffee Maker...`}
                                  value={customName} 
                                  onChange={e => setCustomName(e.target.value)}
                                  className="w-full px-3 py-2 text-sm rounded-lg border border-primary/20 focus:outline-none focus:border-primary bg-white" 
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
                  <Radar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-600">No Devices Found</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-[250px] mx-auto">Make sure your hardware is powered on and connected to the local Wi-Fi network.</p>
                  <button onClick={performScan} className="mt-4 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors">
                    Rescan Network
                  </button>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-white border-t border-slate-100 flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors text-sm">
                Cancel
              </button>
              <button 
                onClick={handleSave} 
                disabled={!selectedDevice || isSaving}
                className={`flex-[2] py-3 px-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 text-sm ${(!selectedDevice || isSaving) ? "bg-primary/50 cursor-not-allowed" : "bg-primary hover:bg-primary/90 shadow-md"}`}
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>Add to {formatTitle(roomId)} <LinkIcon className="w-4 h-4" /></>
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