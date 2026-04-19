import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Server, Cpu, PlugZap, Lightbulb, Cctv, Plus, Trash2, Sofa, BedDouble, Coffee, Droplets, MapPin, CheckCircle2, Radar, X, Link as LinkIcon, Unlink } from 'lucide-react';
import api from '@/lib/api';
import { OnboardingData } from '@/app/onboarding/page';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Props {
  formData: OnboardingData;
  updateFormData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
}

const ROOM_TYPES = [
  { id: "livingroom", label: "Living Room", icon: Sofa },
  { id: "bedroom", label: "Bedroom", icon: BedDouble },
  { id: "guestroom", label: "Guest Room", icon: Coffee },
  { id: "bathroom", label: "Bathroom", icon: Droplets },
  { id: "kitchen", label: "Kitchen", icon: MapPin },
];

export default function Step2Hardware({ formData, updateFormData, onNext }: Props) {
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  const [isBuildingRoom, setIsBuildingRoom] = useState(formData.rooms.length === 0);
  
  const [draftRoom, setDraftRoom] = useState({
    name: "", type: "livingroom",
    sensorDevices: [] as any[],
    plugDevices: [] as any[],
    lightDevices: [] as any[],
    cameraDevices: [] as any[]
  });

  const [scanModal, setScanModal] = useState<{ isOpen: boolean, apiType: string, title: string, icon: any }>({
    isOpen: false, apiType: "", title: "", icon: null
  });
  const [isScanning, setIsScanning] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<any[]>([]);

  const [namingDevice, setNamingDevice] = useState<any | null>(null);
  const [customDeviceName, setCustomDeviceName] = useState("");

  const getGloballyPairedIds = () => {
    let ids: string[] = [];
    formData.rooms.forEach((r: any) => {
        if (r.sensorDevices) ids.push(...r.sensorDevices.map((d: any) => d.id));
        if (r.plugDevices) ids.push(...r.plugDevices.map((d: any) => d.id));
        if (r.lightDevices) ids.push(...r.lightDevices.map((d: any) => d.id));
        if (r.cameraDevices) ids.push(...r.cameraDevices.map((d: any) => d.id));
    });
    return ids;
  };

  const saveRoom = () => {
    if (!draftRoom.name.trim()) { alert("Please enter a name for the room."); return; }
    
    const roomToSave = {
      ...draftRoom,
      hasSensor: draftRoom.sensorDevices.length > 0,
      hasPlug: draftRoom.plugDevices.length > 0,
      hasLight: draftRoom.lightDevices.length > 0,
      hasCamera: draftRoom.cameraDevices.length > 0,
    };

    const newRooms = [...formData.rooms, roomToSave];
    updateFormData({ rooms: newRooms, topology: "Custom Build" });
    
    setDraftRoom({
      name: "", type: "livingroom",
      sensorDevices: [], plugDevices: [], lightDevices: [], cameraDevices: []
    });
    setIsBuildingRoom(false);
  };

  const removeRoom = (index: number) => {
    const newRooms = formData.rooms.filter((_, i) => i !== index);
    updateFormData({ rooms: newRooms });
    if (newRooms.length === 0) setIsBuildingRoom(true);
  };

  const handleHardwareClick = (apiType: string, title: string, icon: any) => {
    setScanModal({ isOpen: true, apiType, title, icon });
    performScan(apiType);
  };

  const performScan = async (apiType: string) => {
    setIsScanning(true);
    setDiscoveredDevices([]);
    setNamingDevice(null); 
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/discovery/scan`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Server Error");
      const data = await res.json();
      
      setTimeout(() => {
        const globalPairedIds = getGloballyPairedIds();
        const filtered = (data.discovered_devices || []).filter((d: any) => 
            d.type === apiType && !globalPairedIds.includes(d.id)
        );
        setDiscoveredDevices(filtered);
        setIsScanning(false);
      }, 1500);
    } catch (e) {
      console.error("Scan failed:", e);
      setIsScanning(false);
    }
  };

  const getArrayName = (apiType: string) => {
    if (apiType === 'sensor_node') return 'sensorDevices';
    if (apiType === 'bulb') return 'lightDevices';
    if (apiType === 'outlet') return 'plugDevices';
    if (apiType === 'camera') return 'cameraDevices';
    return 'sensorDevices'; 
  };

  const toggleDevice = (device: any) => {
    const arrayName = getArrayName(device.type) as keyof typeof draftRoom;
    const currentList = draftRoom[arrayName] as any[];
    const isSelected = currentList.some(d => d.id === device.id);

    if (isSelected) {
      setDraftRoom({ ...draftRoom, [arrayName]: currentList.filter(d => d.id !== device.id) });
      if (namingDevice?.id === device.id) setNamingDevice(null);
    } else {
      setNamingDevice(device);
      setCustomDeviceName("");
    }
  };

  const confirmDeviceName = () => {
    if (!namingDevice) return;
    
    const arrayName = getArrayName(namingDevice.type) as keyof typeof draftRoom;
    const currentList = draftRoom[arrayName] as any[];
    
    const finalName = customDeviceName.trim() !== "" ? customDeviceName : namingDevice.display_name;
    
    const deviceToSave = {
      ...namingDevice,
      display_name: finalName
    };

    setDraftRoom({ ...draftRoom, [arrayName]: [...currentList, deviceToSave] });
    setNamingDevice(null);
  };

  const startProvisioning = async () => {
    setIsProvisioning(true);
    setLogs(["Initiating secure connection..."]);
    const fakeLogs = ["Building spatial nodes...", "Registering hardware signatures...", "Encrypting topology..."];
    fakeLogs.forEach((log, idx) => setTimeout(() => setLogs(p => [...p, log]), (idx + 1) * 600));

    try {
      await api.post('/onboarding/setup', formData);
      setTimeout(() => {
        setLogs(p => [...p, "Setup complete!"]);
        setTimeout(() => { setIsProvisioning(false); onNext(); }, 1000);
      }, fakeLogs.length * 600 + 500);
    } catch (error) {
      setLogs(p => [...p, "Error saving configuration!"]);
      setTimeout(() => { setIsProvisioning(false); onNext(); }, 2000); 
    }
  };

  return (
    <div className="bg-white/60 backdrop-blur-xl border border-slate-200/60 p-8 rounded-3xl shadow-xl shadow-slate-200/50 min-h-[500px] flex flex-col relative">
      <AnimatePresence mode="wait">
        
        {scanModal.isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
              
              <div className="bg-slate-50 p-6 flex flex-col items-center justify-center border-b border-slate-100 relative">
                <button onClick={() => { setScanModal({ ...scanModal, isOpen: false }); setNamingDevice(null); }} className="absolute top-4 right-4 p-2 bg-white rounded-full text-slate-400 hover:text-slate-700 shadow-sm"><X className="w-4 h-4" /></button>
                
                <div className="relative w-24 h-24 flex items-center justify-center mb-4">
                  {isScanning && (
                    <>
                      <div className="absolute inset-0 border-2 border-indigo-400 rounded-full animate-ping opacity-75"></div>
                      <div className="absolute inset-2 border-2 border-indigo-300 rounded-full animate-ping opacity-50 animation-delay-300"></div>
                    </>
                  )}
                  <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shadow-inner z-10">
                    <scanModal.icon className={`w-8 h-8 ${isScanning ? "animate-pulse" : ""}`} />
                  </div>
                </div>
                
                <h3 className="font-extrabold text-slate-800 text-lg">
                  {isScanning ? `Scanning for ${scanModal.title}...` : `${scanModal.title} Settings`}
                </h3>
                <p className="text-xs text-slate-500 mt-1 text-center px-4">
                  {isScanning ? "Searching local network via mDNS & SSDP protocols." : `Select devices to assign to this room. Devices already assigned to other rooms are hidden.`}
                </p>
              </div>

              <div className="p-4 max-h-72 overflow-y-auto bg-slate-50/50">
                {isScanning ? (
                  <div className="flex flex-col gap-3">
                    {[1, 2].map(i => <div key={i} className="h-16 bg-slate-200/50 rounded-xl animate-pulse"></div>)}
                  </div>
                ) : discoveredDevices.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {discoveredDevices.map(device => {
                      const arrName = getArrayName(device.type) as keyof typeof draftRoom;
                      const isSelected = (draftRoom[arrName] as any[]).some(d => d.id === device.id);

                      return (
                        <button key={device.id} onClick={() => toggleDevice(device)} className={`flex items-center justify-between p-3 border rounded-xl transition-all text-left group ${isSelected ? "bg-indigo-50 border-indigo-500 shadow-sm" : "bg-white border-slate-200 hover:border-indigo-300"}`}>
                          <div>
                            <div className={`font-bold text-sm ${isSelected ? "text-indigo-900" : "text-slate-800"}`}>
                            {isSelected ? ((draftRoom[arrName] as any[]).find(d => d.id === device.id)?.display_name) : device.display_name}
                            </div>
                            <div className={`text-[10px] font-mono mt-0.5 uppercase tracking-wider ${isSelected ? "text-indigo-400" : "text-slate-400"}`}>{device.id} • {device.ip}</div>
                          </div>
                          {isSelected ? (
                             <div className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-red-200 transition-colors">
                               <Unlink className="w-3.5 h-3.5" /> Remove
                             </div>
                          ) : (
                             <div className="px-3 py-1.5 bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-indigo-200 transition-colors">
                               <LinkIcon className="w-3.5 h-3.5" /> Select
                             </div>
                          )}
                        </button>
                      );
                    })}

                    <AnimatePresence>
                      {namingDevice && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="p-4 mt-2 bg-indigo-50 border border-indigo-200 rounded-xl shadow-inner">
                            <label className="text-[10px] font-extrabold tracking-widest text-indigo-900 mb-2 block uppercase">Name this {namingDevice.model}</label>
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                autoFocus
                                placeholder="e.g. Desk Lamp, Oven, Heater..." 
                                value={customDeviceName} 
                                onChange={e => setCustomDeviceName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && confirmDeviceName()}
                                className="flex-1 px-3 py-2 text-sm rounded-lg border border-indigo-200 focus:outline-none focus:border-indigo-500 bg-white" 
                              />
                              <button onClick={confirmDeviceName} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors">
                                Save
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Radar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-600">No Devices Found</p>
                    <p className="text-xs text-slate-400 mt-1">Make sure devices are powered on and not assigned to another room.</p>
                  </div>
                )}
              </div>
              
              {!isScanning && discoveredDevices.length > 0 && (
                <div className="p-4 bg-white border-t border-slate-100">
                  <button onClick={() => { setScanModal({ ...scanModal, isOpen: false }); setNamingDevice(null); }} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors">
                    Done
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {isProvisioning ? (
          <motion.div key="provisioning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full justify-center">
            <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-2">Finalizing Ecosystem</h2>
            <p className="text-slate-500 text-center mb-6">Wiring your custom topology to the LangGraph core.</p>
            <div className="bg-slate-900 rounded-2xl p-6 font-mono text-sm text-emerald-400 flex-1 overflow-y-auto border border-slate-700 shadow-inner">
              <div className="flex items-center gap-3 mb-4 text-indigo-400"><Server className="w-5 h-5 animate-pulse" /><span>Writing to database...</span></div>
              {logs.map((log, i) => <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-2"><span className="text-slate-500">[{new Date().toISOString().split('T')[1].slice(0,-1)}]</span> {log}</motion.div>)}
            </div>
          </motion.div>
        ) : 

        isBuildingRoom ? (
          <motion.div key="builder" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Add a New Room</h2>
            <p className="text-slate-500 text-sm mb-6">Configure the space and select available hardware.</p>

            <div className="space-y-5 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 ml-1 mb-1.5 block tracking-widest">ROOM NAME</label>
                  <input type="text" placeholder="e.g. Berkay's Living Room" value={draftRoom.name} onChange={e => setDraftRoom({...draftRoom, name: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 ml-1 mb-1.5 block tracking-widest">ROOM TYPE</label>
                  <select value={draftRoom.type} onChange={e => setDraftRoom({...draftRoom, type: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none appearance-none">
                    {ROOM_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 ml-1 mb-2 block tracking-widest">HARDWARE IN THIS ROOM</label>
                <div className="grid grid-cols-2 gap-3">
                  
                  <button onClick={() => handleHardwareClick('sensor_node', 'Sensor Node', Cpu)} className={`p-4 rounded-xl border text-left transition-all relative ${draftRoom.sensorDevices.length > 0 ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
                    {draftRoom.sensorDevices.length > 0 && <div className="absolute top-3 right-3 text-indigo-500 flex items-center gap-1 text-xs font-bold"><CheckCircle2 className="w-4 h-4" /></div>}
                    <Cpu className={`w-6 h-6 mb-2 ${draftRoom.sensorDevices.length > 0 ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <div className={`font-bold text-sm ${draftRoom.sensorDevices.length > 0 ? 'text-indigo-900' : 'text-slate-600'}`}>Sensor Node</div>
                    <div className="text-[10px] text-slate-400 mt-1 truncate">{draftRoom.sensorDevices.length > 0 ? `${draftRoom.sensorDevices.length} Connected` : "Temp, Hum, Motion"}</div>
                  </button>

                  <button onClick={() => handleHardwareClick('bulb', 'Smart Bulb', Lightbulb)} className={`p-4 rounded-xl border text-left transition-all relative ${draftRoom.lightDevices.length > 0 ? 'bg-amber-50 border-amber-500 shadow-sm' : 'bg-white border-slate-200 hover:border-amber-300'}`}>
                    {draftRoom.lightDevices.length > 0 && <div className="absolute top-3 right-3 text-amber-500"><CheckCircle2 className="w-4 h-4" /></div>}
                    <Lightbulb className={`w-6 h-6 mb-2 ${draftRoom.lightDevices.length > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
                    <div className={`font-bold text-sm ${draftRoom.lightDevices.length > 0 ? 'text-amber-900' : 'text-slate-600'}`}>Smart Bulb</div>
                    <div className="text-[10px] text-slate-400 mt-1 truncate">{draftRoom.lightDevices.length > 0 ? `${draftRoom.lightDevices.length} Connected` : "Tapo L530 or similar"}</div>
                  </button>

                  <button onClick={() => handleHardwareClick('outlet', 'Smart Plug', PlugZap)} className={`p-4 rounded-xl border text-left transition-all relative ${draftRoom.plugDevices.length > 0 ? 'bg-emerald-50 border-emerald-500 shadow-sm' : 'bg-white border-slate-200 hover:border-emerald-300'}`}>
                    {draftRoom.plugDevices.length > 0 && <div className="absolute top-3 right-3 text-emerald-500"><CheckCircle2 className="w-4 h-4" /></div>}
                    <PlugZap className={`w-6 h-6 mb-2 ${draftRoom.plugDevices.length > 0 ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div className={`font-bold text-sm ${draftRoom.plugDevices.length > 0 ? 'text-emerald-900' : 'text-slate-600'}`}>Smart Plugs</div>
                    <div className="text-[10px] text-slate-400 mt-1 truncate">{draftRoom.plugDevices.length > 0 ? `${draftRoom.plugDevices.length} Connected` : "Appliances & Outlets"}</div>
                  </button>

                  <button onClick={() => handleHardwareClick('camera', 'CCTV Camera', Cctv)} className={`p-4 rounded-xl border text-left transition-all relative ${draftRoom.cameraDevices.length > 0 ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
                    {draftRoom.cameraDevices.length > 0 && <div className="absolute top-3 right-3 text-blue-500"><CheckCircle2 className="w-4 h-4" /></div>}
                    <Cctv className={`w-6 h-6 mb-2 ${draftRoom.cameraDevices.length > 0 ? 'text-blue-600' : 'text-slate-400'}`} />
                    <div className={`font-bold text-sm ${draftRoom.cameraDevices.length > 0 ? 'text-blue-900' : 'text-slate-600'}`}>CCTV / Cam</div>
                    <div className="text-[10px] text-slate-400 mt-1 truncate">{draftRoom.cameraDevices.length > 0 ? `${draftRoom.cameraDevices.length} Connected` : "RTSP Live Feed"}</div>
                  </button>

                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              {formData.rooms.length > 0 && (
                <button onClick={() => setIsBuildingRoom(false)} className="px-6 py-3.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
              )}
              <button onClick={saveRoom} className="flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                Save Room Configuration <CheckCircle2 className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ) : 

        (
          <motion.div key="summary" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col h-full">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Your Smart Topology</h2>
            <p className="text-slate-500 text-sm mb-6">Review your configured spaces before finalizing the setup.</p>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {formData.rooms.map((room: any, idx) => {
                const RoomIcon = ROOM_TYPES.find(t => t.id === room.type)?.icon || MapPin;
                return (
                  <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-sm group">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><RoomIcon className="w-6 h-6" /></div>
                      <div>
                        <div className="font-bold text-slate-800">{room.name}</div>
                        <div className="flex gap-2 mt-1">
                          {room.hasSensor && <Cpu className="w-4 h-4 text-slate-400" />}
                          {room.hasLight && <Lightbulb className="w-4 h-4 text-amber-400" />}
                          {room.hasPlug && <PlugZap className="w-4 h-4 text-emerald-400" />}
                          {room.hasCamera && <Cctv className="w-4 h-4 text-blue-400" />}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => removeRoom(idx)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-5 h-5" /></button>
                  </div>
                );
              })}
              <button onClick={() => setIsBuildingRoom(true)} className="w-full py-4 border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 rounded-2xl flex items-center justify-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-all">
                <Plus className="w-5 h-5" /> Add Another Room
              </button>
            </div>

            <button onClick={startProvisioning} className="w-full py-4 mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 group">
              Finalize Home Setup <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}