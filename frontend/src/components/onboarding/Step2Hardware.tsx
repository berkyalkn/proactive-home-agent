'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, Cpu, PlugZap, Lightbulb, Cctv, Plus, Trash2,
  Sofa, BedDouble, Coffee, Droplets, MapPin, CheckCircle2,
  Radar, X, Unlink, Loader2, BrainCircuit, ChevronDown
} from 'lucide-react';
import api from '@/lib/api';
import { OnboardingData } from '@/app/onboarding/page';
import s from '@/components/auth/auth.module.css';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Props {
  formData: OnboardingData;
  updateFormData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrev?: () => void;
}

const ROOM_TYPES = [
  { id: "livingroom", label: "Living Room", icon: Sofa },
  { id: "bedroom", label: "Bedroom", icon: BedDouble },
  { id: "guestroom", label: "Guest Room", icon: Coffee },
  { id: "bathroom", label: "Bathroom", icon: Droplets },
  { id: "kitchen", label: "Kitchen", icon: MapPin },
];

export default function Step2Hardware({ formData, updateFormData, onNext, onPrev }: Props) {
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisionStep, setProvisionStep] = useState(0);
  
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
    const newRooms = formData.rooms.filter((_: any, i: number) => i !== index);
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
      
      const globalPairedIds = getGloballyPairedIds();
      const filtered = (data.discovered_devices || []).filter((d: any) =>
        d.type === apiType && !globalPairedIds.includes(d.id)
      );
      setDiscoveredDevices(filtered);
      setIsScanning(false);
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
    setProvisionStep(0);
    
    const totalSteps = formData.rooms.length + 2;
    
    const interval = setInterval(() => {
      setProvisionStep((prev) => {
        if (prev < totalSteps) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 1200);

    try {
      await api.post('/onboarding/setup', formData);
      
      setTimeout(() => {
        clearInterval(interval);
        setProvisionStep(totalSteps);
        setTimeout(() => { setIsProvisioning(false); onNext(); }, 2000);
      }, totalSteps * 1200);
    } catch (error) {
      clearInterval(interval);
      alert("Warning: Sync delayed. Please try again.");
      setIsProvisioning(false);
    }
  };

  // Device type → accent variant mapping
  const getDeviceVariant = (apiType: string) => {
    if (apiType === 'sensor_node') return s.deviceCardSensor;
    if (apiType === 'bulb') return s.deviceCardLight;
    if (apiType === 'outlet') return s.deviceCardPlug;
    if (apiType === 'camera') return s.deviceCardCamera;
    return '';
  };

  return (
    <div className={s.cardWide} style={{ minHeight: 500, display: 'flex', flexDirection: 'column' }}>
      
      {/* ═══ Scan Modal (dark) ═══ */}
      <AnimatePresence mode="wait">
        {scanModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={s.scanOverlay}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className={s.scanModal}
            >
              {/* Scan Header */}
              <div className={s.scanHeader}>
                <button
                  onClick={() => { setScanModal({ ...scanModal, isOpen: false }); setNamingDevice(null); }}
                  className={s.scanClose}
                >
                  <X size={16} />
                </button>

                <div className={s.scanIconContainer}>
                  {isScanning && (
                    <>
                      <div className={s.scanRing} />
                      <div className={s.scanRingInner} />
                    </>
                  )}
                  <div className={s.scanIconCircle}>
                    <scanModal.icon size={28} className={isScanning ? s.scanIconPulse : ''} />
                  </div>
                </div>

                <h3 className={s.scanTitle}>
                  {isScanning ? `Looking for ${scanModal.title}s...` : `Add a ${scanModal.title}`}
                </h3>
                <p className={s.scanSubtitle}>
                  {isScanning
                    ? 'Searching your Wi-Fi network for available devices.'
                    : 'Select the devices you want to add to this room.'}
                </p>
              </div>

              {/* Scan Body */}
              <div className={s.scanBody}>
                {isScanning ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[1, 2, 3].map(i => <div key={i} className={s.scanSkeleton} />)}
                  </div>
                ) : discoveredDevices.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {discoveredDevices.map(device => {
                      const arrName = getArrayName(device.type) as keyof typeof draftRoom;
                      const isSelected = (draftRoom[arrName] as any[]).some(d => d.id === device.id);

                      const handleIdentify = async (e: React.MouseEvent) => {
                        e.stopPropagation();
                        const btn = e.currentTarget as HTMLButtonElement;
                        btn.style.color = 'var(--accent-warm)';
                        try {
                          const token = localStorage.getItem('token');
                          await fetch(`${API_BASE_URL}/discovery/identify/${device.id}`, {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}` }
                          });
                        } catch (error) {
                          console.error("Identify ping failed");
                        }
                        setTimeout(() => { btn.style.color = ''; }, 2000);
                      };

                      return (
                        <div
                          key={device.id}
                          className={`${s.deviceRow} ${isSelected ? s.deviceRowSelected : ''}`}
                        >
                          <button
                            onClick={() => toggleDevice(device)}
                            style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                          >
                            <div className={`${s.deviceRowName} ${isSelected ? s.deviceRowNameSelected : ''}`}>
                              {isSelected
                                ? (draftRoom[arrName] as any[]).find(d => d.id === device.id)?.display_name
                                : device.display_name}
                            </div>
                            <div className={s.deviceRowId}>{device.id}</div>
                          </button>

                          <div className={s.deviceRowActions}>
                            {(device.type === 'bulb' || device.type === 'outlet') && (
                              <button
                                onClick={handleIdentify}
                                title="Blink to identify this device"
                                className={s.identifyBtn}
                              >
                                <Lightbulb size={16} />
                              </button>
                            )}

                            <button
                              onClick={() => toggleDevice(device)}
                              className={`${s.addRemoveBtn} ${isSelected ? s.removeBtn : s.addBtn}`}
                            >
                              {isSelected ? (
                                <><Unlink size={14} /> Remove</>
                              ) : (
                                <><Plus size={14} /> Add</>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Device Naming */}
                    {namingDevice && (
                      <div className={s.namingBox}>
                        <label className={s.namingLabel}>Give this device a name</label>
                        <div className={s.namingRow}>
                          <input
                            type="text"
                            autoFocus
                            placeholder="e.g. Desk Lamp, TV Plug..."
                            value={customDeviceName}
                            onChange={e => setCustomDeviceName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && confirmDeviceName()}
                            className={s.namingInput}
                          />
                          <button onClick={confirmDeviceName} className={s.namingSave}>
                            Save
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={s.scanEmpty}>
                    <Radar size={40} className={s.scanEmptyIcon} />
                    <p className={s.scanEmptyTitle}>No Devices Found</p>
                    <p className={s.scanEmptyText}>
                      Make sure your devices are turned on and connected to your Wi-Fi.
                    </p>
                  </div>
                )}
              </div>

              {/* Scan Footer */}
              {!isScanning && discoveredDevices.length > 0 && (
                <div className={s.scanFooter}>
                  <button
                    onClick={() => { setScanModal({ ...scanModal, isOpen: false }); setNamingDevice(null); }}
                    className={s.scanConfirmBtn}
                  >
                    Confirm Selection
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Main Content ═══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 10 }}>
        {isProvisioning ? (
          /* ─── Provisioning View ─── */
          <motion.div
            key="provisioning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={s.provisionContainer}
          >
            <div className={s.provisionIcon}>
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={s.provisionPulse}
              />
              <div className={s.provisionIconBox}>
                <BrainCircuit size={32} />
              </div>
            </div>

            <h2 className={s.provisionTitle}>Setting Up Your Home</h2>
            <p className={s.provisionSubtitle}>Connecting devices to your smart assistant...</p>

            <div className={s.provisionSteps}>
              {/* Init step */}
              <div className={s.provisionStep}>
                {provisionStep > 0
                  ? <CheckCircle2 size={20} className={s.provisionStepIconDone} />
                  : <Loader2 size={20} className={`${s.provisionStepIconActive} ${s.spin}`} />
                }
                <span className={provisionStep > 0 ? s.provisionStepTextDone : s.provisionStepTextActive}>
                  Initializing Smart Core
                </span>
              </div>

              {/* Room steps */}
              {formData.rooms.map((room: any, idx: number) => {
                const stepIndex = idx + 1;
                const isCompleted = provisionStep > stepIndex;
                const isActive = provisionStep === stepIndex;
                const RoomIcon = ROOM_TYPES.find(t => t.id === room.type)?.icon || MapPin;

                return (
                  <div key={idx} className={s.provisionStep}>
                    {isCompleted ? (
                      <CheckCircle2 size={20} className={s.provisionStepIconDone} />
                    ) : isActive ? (
                      <Loader2 size={20} className={`${s.provisionStepIconActive} ${s.spin}`} />
                    ) : (
                      <div className={s.provisionStepCircle} />
                    )}
                    <span className={
                      isCompleted ? s.provisionStepTextDone
                        : isActive ? s.provisionStepTextActive
                        : s.provisionStepText
                    }>
                      <RoomIcon size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
                      Syncing {room.name}
                    </span>
                  </div>
                );
              })}

              {/* Final step */}
              <hr className={s.provisionDivider} />
              <div className={s.provisionStep}>
                {provisionStep > formData.rooms.length + 1 ? (
                  <CheckCircle2 size={20} className={s.provisionStepIconDone} />
                ) : provisionStep === formData.rooms.length + 1 ? (
                  <Loader2 size={20} className={`${s.provisionStepIconActive} ${s.spin}`} />
                ) : (
                  <div className={s.provisionStepCircle} />
                )}
                <span className={
                  provisionStep > formData.rooms.length + 1
                    ? s.provisionStepTextDone
                    : provisionStep === formData.rooms.length + 1
                    ? s.provisionStepTextActive
                    : s.provisionStepText
                }>
                  Securing Connections
                </span>
              </div>
            </div>
          </motion.div>

        ) : isBuildingRoom ? (
          /* ─── Room Builder View ─── */
          <motion.div
            key="builder"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
          >
            <h2 className={s.title} style={{ textAlign: 'left', fontSize: 24, marginBottom: 4 }}>Add a Room</h2>
            <p className={s.subtitle} style={{ textAlign: 'left', marginBottom: 24 }}>
              Name your space and add your smart devices to it.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
              {/* Room Name + Type */}
              <div className={s.gridTwo}>
                <div>
                  <label className={s.label}>Room Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Master Bedroom"
                    value={draftRoom.name}
                    onChange={e => setDraftRoom({ ...draftRoom, name: e.target.value })}
                    className={s.input}
                  />
                </div>
                <div>
                  <label className={s.label}>Room Type</label>
                  <div className={s.selectWrapper}>
                    <select
                      value={draftRoom.type}
                      onChange={e => setDraftRoom({ ...draftRoom, type: e.target.value })}
                      className={s.selectInput}
                    >
                      {ROOM_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                    <ChevronDown size={16} className={s.selectChevron} />
                  </div>
                </div>
              </div>

              {/* Device Category Cards */}
              <div>
                <label className={s.label}>Devices in this Room</label>
                <div className={s.deviceGrid}>
                  {/* Sensors */}
                  <button
                    onClick={() => handleHardwareClick('sensor_node', 'Sensor Node', Cpu)}
                    className={`${s.deviceCard} ${s.deviceCardSensor} ${draftRoom.sensorDevices.length > 0 ? s.deviceCardActive : ''}`}
                  >
                    {draftRoom.sensorDevices.length > 0 && (
                      <CheckCircle2 size={16} className={s.deviceCardCheck} />
                    )}
                    <Cpu size={24} className={`${s.deviceCardIcon} ${draftRoom.sensorDevices.length > 0 ? s.deviceCardIconActive : ''}`} />
                    <div className={s.deviceCardTitle}>Sensors</div>
                    <div className={s.deviceCardSub}>
                      {draftRoom.sensorDevices.length > 0 ? `${draftRoom.sensorDevices.length} Added` : 'Motion, Temp...'}
                    </div>
                  </button>

                  {/* Smart Lights */}
                  <button
                    onClick={() => handleHardwareClick('bulb', 'Smart Light', Lightbulb)}
                    className={`${s.deviceCard} ${s.deviceCardLight} ${draftRoom.lightDevices.length > 0 ? s.deviceCardActive : ''}`}
                  >
                    {draftRoom.lightDevices.length > 0 && (
                      <CheckCircle2 size={16} className={s.deviceCardCheck} />
                    )}
                    <Lightbulb size={24} className={`${s.deviceCardIcon} ${draftRoom.lightDevices.length > 0 ? s.deviceCardIconActive : ''}`} />
                    <div className={s.deviceCardTitle}>Smart Lights</div>
                    <div className={s.deviceCardSub}>
                      {draftRoom.lightDevices.length > 0 ? `${draftRoom.lightDevices.length} Added` : 'Bulbs & Strips'}
                    </div>
                  </button>

                  {/* Smart Plugs */}
                  <button
                    onClick={() => handleHardwareClick('outlet', 'Smart Plug', PlugZap)}
                    className={`${s.deviceCard} ${s.deviceCardPlug} ${draftRoom.plugDevices.length > 0 ? s.deviceCardActive : ''}`}
                  >
                    {draftRoom.plugDevices.length > 0 && (
                      <CheckCircle2 size={16} className={s.deviceCardCheck} />
                    )}
                    <PlugZap size={24} className={`${s.deviceCardIcon} ${draftRoom.plugDevices.length > 0 ? s.deviceCardIconActive : ''}`} />
                    <div className={s.deviceCardTitle}>Smart Plugs</div>
                    <div className={s.deviceCardSub}>
                      {draftRoom.plugDevices.length > 0 ? `${draftRoom.plugDevices.length} Added` : 'Outlets & Appliances'}
                    </div>
                  </button>

                  {/* Cameras */}
                  <button
                    onClick={() => handleHardwareClick('camera', 'Camera', Cctv)}
                    className={`${s.deviceCard} ${s.deviceCardCamera} ${draftRoom.cameraDevices.length > 0 ? s.deviceCardActive : ''}`}
                  >
                    {draftRoom.cameraDevices.length > 0 && (
                      <CheckCircle2 size={16} className={s.deviceCardCheck} />
                    )}
                    <Cctv size={24} className={`${s.deviceCardIcon} ${draftRoom.cameraDevices.length > 0 ? s.deviceCardIconActive : ''}`} />
                    <div className={s.deviceCardTitle}>Cameras</div>
                    <div className={s.deviceCardSub}>
                      {draftRoom.cameraDevices.length > 0 ? `${draftRoom.cameraDevices.length} Added` : 'Security Feeds'}
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Builder Actions */}
            <div className={s.actionRow}>
              {formData.rooms.length > 0 && (
                <button
                  onClick={() => setIsBuildingRoom(false)}
                  className={s.btnSecondary}
                  style={{ flex: 1, maxWidth: 180 }}
                >
                  Cancel
                </button>
              )}
              <button onClick={saveRoom} className={s.btnPrimary} style={{ flex: 2 }}>
                Save Room <CheckCircle2 size={20} />
              </button>
            </div>
          </motion.div>

        ) : (
          /* ─── Room Summary View ─── */
          <motion.div
            key="summary"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
          >
            <h2 className={s.title} style={{ textAlign: 'left', fontSize: 24, marginBottom: 4 }}>Your Home Layout</h2>
            <p className={s.subtitle} style={{ textAlign: 'left', marginBottom: 24 }}>
              Review your rooms and connected devices before moving on.
            </p>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {formData.rooms.map((room: any, idx: number) => {
                const RoomIcon = ROOM_TYPES.find(t => t.id === room.type)?.icon || MapPin;
                const sensorCount = room.sensorDevices?.length || 0;
                const lightCount = room.lightDevices?.length || 0;
                const plugCount = room.plugDevices?.length || 0;
                const cameraCount = room.cameraDevices?.length || 0;
                const totalDevices = sensorCount + lightCount + plugCount + cameraCount;

                return (
                  <div key={idx} className={s.roomCard}>
                    <div className={s.roomCardHeader}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div className={s.roomCardIcon}>
                          <RoomIcon size={20} />
                        </div>
                        <div className={s.roomCardInfo}>
                          <div className={s.roomCardName}>{room.name}</div>
                          <div className={s.roomCardDeviceCount}>
                            {totalDevices} {totalDevices === 1 ? 'Device' : 'Devices'} Connected
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeRoom(idx)}
                        className={s.roomCardDelete}
                        title="Remove Room"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className={s.roomCardBody}>
                      {sensorCount > 0 && (
                        <div className={`${s.deviceBadge} ${s.deviceBadgeSensor}`}>
                          <Cpu size={14} /> {sensorCount} Sensor{sensorCount > 1 ? 's' : ''}
                        </div>
                      )}
                      {lightCount > 0 && (
                        <div className={`${s.deviceBadge} ${s.deviceBadgeLight}`}>
                          <Lightbulb size={14} /> {lightCount} Light{lightCount > 1 ? 's' : ''}
                        </div>
                      )}
                      {plugCount > 0 && (
                        <div className={`${s.deviceBadge} ${s.deviceBadgePlug}`}>
                          <PlugZap size={14} /> {plugCount} Plug{plugCount > 1 ? 's' : ''}
                        </div>
                      )}
                      {cameraCount > 0 && (
                        <div className={`${s.deviceBadge} ${s.deviceBadgeCamera}`}>
                          <Cctv size={14} /> {cameraCount} Camera{cameraCount > 1 ? 's' : ''}
                        </div>
                      )}
                      {totalDevices === 0 && (
                        <div className={s.noDevicesText}>No devices assigned to this room yet.</div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Add Another Room */}
              <button onClick={() => setIsBuildingRoom(true)} className={s.addRoomBtn}>
                <div className={s.addRoomBtnIcon}><Plus size={16} /></div>
                Add Another Room
              </button>
            </div>

            {/* Summary Actions */}
            <div className={s.actionRow}>
              {onPrev && (
                <button
                  onClick={onPrev}
                  className={s.btnSecondary}
                  style={{ flex: 1, maxWidth: 180 }}
                >
                  Back
                </button>
              )}
              <button onClick={startProvisioning} className={s.btnPrimary} style={{ flex: 2 }}>
                Continue to Next Step <ChevronRight size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}