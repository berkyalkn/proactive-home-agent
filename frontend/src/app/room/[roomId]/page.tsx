"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SensorCard } from "@/components/SensorCard";
import { DeviceCard } from "@/components/DeviceCard";
import { VoiceCommandCenter } from "@/components/VoiceCommandCenter";
import { BulbControl } from "@/components/BulbControl";
import { CameraFeed } from "@/components/CameraFeed";
import { SensorHistoryModal } from "@/components/SensorHistoryModal";
import { AddDeviceModal } from "@/components/AddDeviceModal"; 
import { useChat } from "@/context/ChatContext";

import {
  Thermometer, Droplets, Gauge, Eye, Sun, Home, Activity, WifiOff, ArrowLeft, Cctv, Zap, Lightbulb, PlugZap, Plus, Cpu, LogOut
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface RoomSensorData {
  device_id: string;
  temperature: number | null;
  humidity: number | null;
  pressure: number | null;
  light_level: number | null;
  motion_detected: boolean;
}

interface Device {
  name: string;
  on: boolean;
  type: "outlet" | "bulb" | "camera" | "sensor_node";
  power: number;
  brightness?: number;
  hue?: number;
  saturation?: number;
}
type DeviceState = Record<string, Device>;

interface RoomInventory {
  hasSensor: boolean;
  hasCamera: boolean;
  hasLight: boolean;
  hasPlug: boolean;
  isLoaded: boolean;
  devices: Record<string, any>; 
}

const formatTitle = (roomId: string) => {
  return roomId.charAt(0).toUpperCase() + roomId.slice(1);
};

const EmptyModuleState = ({ icon: Icon, title, description, onAdd }: { icon: any, title: string, description: string, onAdd: () => void }) => (
  <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border/50 rounded-2xl bg-muted/10 text-center h-full min-h-[200px]">
    <div className="p-3 bg-muted rounded-full mb-3 text-muted-foreground/50">
      <Icon className="h-8 w-8" />
    </div>
    <h3 className="text-sm font-bold text-foreground mb-1">{title}</h3>
    <p className="text-xs text-muted-foreground max-w-[250px] mb-4">{description}</p>
    <button onClick={onAdd} className="flex items-center gap-1.5 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg text-xs font-medium transition-colors">
      <Plus className="w-3.5 h-3.5" /> Configure Device
    </button>
  </div>
);

export default function RoomDetailPage({ params }: { params: Promise<{ roomId: string }> }) {
  const resolvedParams = use(params);
  const roomId = resolvedParams.roomId;
  const router = useRouter();
  const { latestSensorData, latestDeviceData } = useChat();

  const [sensorData, setSensorData] = useState<RoomSensorData | null>(null);
  const [devices, setDevices] = useState<DeviceState>({});
  const [isLoading, setIsLoading] = useState(false);
  const [sensorNodeId, setSensorNodeId] = useState<string | null>(null);
  
  const [reloadTrigger, setReloadTrigger] = useState(0); 
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deviceTypeToAdd, setDeviceTypeToAdd] = useState<"outlet" | "bulb" | "camera" | "sensor_node">("outlet");

  const [inventory, setInventory] = useState<RoomInventory>({
    hasSensor: false, hasCamera: false, hasLight: false, hasPlug: false, isLoaded: false, devices: {}
  });

  const [selectedSensor, setSelectedSensor] = useState<{ title: string; metricKey: string; unit: string; value: string | number; } | null>(null);

  const openAddModal = (type: "outlet" | "bulb" | "camera" | "sensor_node") => {
    setDeviceTypeToAdd(type);
    setIsAddModalOpen(true);
  };

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/rooms/${roomId}/inventory`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const safeDevices = data.devices || {};

          setInventory({ ...data, devices: safeDevices, isLoaded: true });
          
          const sNode = Object.entries(safeDevices).find(([_, dev]: [string, any]) => dev.type === 'sensor_node');
          if (sNode) setSensorNodeId(sNode[0]);
        }
      } catch (e) {
        console.error("Inventory fetch failed", e);
      }
    };
    fetchInventory();
  }, [roomId, reloadTrigger]); 

  useEffect(() => {
    if (sensorNodeId && latestSensorData[sensorNodeId]) {
      setSensorData(latestSensorData[sensorNodeId]);
    }
  }, [latestSensorData, sensorNodeId]);

  useEffect(() => {
    if (!inventory.hasSensor || !sensorNodeId) return; 
    const fetchInitial = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/sensors/all`);
            if (response.ok) {
                const data = await response.json();
                if (data[sensorNodeId]) setSensorData(data[sensorNodeId]);
            }
        } catch (e) { console.error(e); }
    };
    fetchInitial();
  }, [sensorNodeId, inventory.hasSensor, reloadTrigger]);

  useEffect(() => {
    if (!inventory.hasPlug && !inventory.hasLight) return; 
    const fetchDevicesInitial = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/devices/`);
        if (response.ok) {
          const data = await response.json();
          const filteredDevices: any = {};
          
          Object.entries(data).forEach(([key, val]: [string, any]) => {
            if (inventory.devices[key] && (val.type === "outlet" || val.type === "bulb")) { 
                filteredDevices[key] = val;
            }
          });
          setDevices(filteredDevices);
        }
      } catch (e) { console.error(e); }
    };
    fetchDevicesInitial();
  }, [inventory, reloadTrigger]);

  useEffect(() => {
    if (Object.keys(latestDeviceData).length > 0) {
        setDevices((prevDevices) => {
            const newDevices = { ...prevDevices };
            Object.entries(latestDeviceData).forEach(([devId, newData]) => {
                if (newDevices[devId]) newDevices[devId] = { ...newDevices[devId], ...newData };
            });
            return newDevices;
        });
    }
  }, [latestDeviceData]);

  const handleToggleDevice = async (deviceId: string, newStatus: boolean) => {
    setIsLoading(true);
    try {
      await fetch(`${API_BASE_URL}/api/devices/${deviceId}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ on: newStatus }),
      });
      setDevices((prev) => ({ ...prev, [deviceId]: { ...prev[deviceId], on: newStatus } }));
    } finally {
      setIsLoading(false);
    }
  };

  const formatValue = (val: number | null) => (val === null ? "N/A" : val);

  const openSensorHistory = (title: string, metricKey: string, unit: string, value: any) => {
    if (metricKey === "motion") return;
    setSelectedSensor({ title, metricKey, unit, value });
  };


  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (!inventory.isLoaded) {
    return <div className="min-h-screen flex items-center justify-center"><Activity className="animate-spin text-primary" /></div>;
  }

  const roomBulbs = Object.entries(devices).filter(([_, dev]) => dev.type === "bulb");
  const roomPlugs = Object.entries(devices).filter(([_, dev]) => dev.type === "outlet");

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-30 mb-6">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium">
              <ArrowLeft className="h-5 w-5" /> <span className="hidden sm:inline">Back</span>
            </Link>
            <div className="h-6 w-[1px] bg-border mx-2"></div>
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Home className="h-5 w-5 text-primary" /> {formatTitle(roomId)} Control
              </h1>
            </div>
          </div>

          <button 
            onClick={handleLogout} 
            className="flex items-center gap-2 p-2 sm:px-4 sm:py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-bold transition-all border border-red-100"
          >
            <LogOut className="w-4 h-4" /> 
            <span className="hidden sm:inline">Logout</span>
          </button>

        </div>
      </header>

      <main className="container mx-auto px-4 space-y-8">
        <VoiceCommandCenter />
        
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Environment Status</h2>
            </div>
            {!inventory.hasSensor && (
               <button onClick={() => openAddModal("sensor_node")} className="p-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors">
                 <Plus className="w-4 h-4" />
               </button>
            )}
          </div>

          {inventory.hasSensor ? (
             sensorData ? (
              <div className="bg-card/40 p-4 rounded-2xl border border-border/50 shadow-sm">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  <SensorCard title="Temp" value={formatValue(sensorData.temperature)} unit="°C" icon={Thermometer} onClick={() => openSensorHistory("Temperature", "temperature", "°C", formatValue(sensorData.temperature))} />
                  <SensorCard title="Humidity" value={formatValue(sensorData.humidity)} unit="%" icon={Droplets} onClick={() => openSensorHistory("Humidity", "humidity", "%", formatValue(sensorData.humidity))} />
                  <SensorCard title="Motion" value={sensorData.motion_detected ? "Active" : "Clear"} unit="" icon={Eye} />
                  <SensorCard title="Light" value={formatValue(sensorData.light_level)} unit="lx" icon={Sun} onClick={() => openSensorHistory("Light Level", "light_level", "lx", formatValue(sensorData.light_level))} />
                  <SensorCard title="Pressure" value={formatValue(sensorData.pressure)} unit="hPa" icon={Gauge} onClick={() => openSensorHistory("Pressure", "pressure", "hPa", formatValue(sensorData.pressure))} />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-xl bg-muted/5">
                <WifiOff className="h-8 w-8 text-muted-foreground mb-2 animate-pulse" />
                <p className="text-sm text-muted-foreground">Connecting to Sensor Node...</p>
              </div>
            )
          ) : (
            <EmptyModuleState icon={Cpu} title="No Sensor Node Detected" description="Monitor temperature, humidity, and motion by adding an ESP32 sensor node to this room." onAdd={() => openAddModal("sensor_node")} />
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cctv className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Live Feed</h2>
              </div>
              <button onClick={() => openAddModal("camera")} className="p-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {inventory.hasCamera ? (
              <CameraFeed roomId={roomId} />
            ) : (
              <EmptyModuleState icon={Cctv} title="Camera Feed Offline" description="No RTSP cameras are assigned to this space. Add one via settings to enable live monitoring." onAdd={() => openAddModal("camera")} />
            )}
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Smart Lighting</h2>
              </div>
              <button onClick={() => openAddModal("bulb")} className="p-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {inventory.hasLight ? (
              roomBulbs.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {roomBulbs.map(([id, dev]) => (
                    <BulbControl key={id} deviceId={id} roomName={dev.name} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-xl bg-muted/5 text-center">
                  <Activity className="h-8 w-8 text-muted-foreground mb-2 animate-pulse" />
                  <p className="text-sm font-medium text-muted-foreground">Syncing bulb status...</p>
                </div>
              )
            ) : (
              <EmptyModuleState icon={Lightbulb} title="No Smart Bulbs" description="This room is not equipped with smart lighting control. Configure a Tapo bulb to get started." onAdd={() => openAddModal("bulb")} />
            )}
          </section>

        </div>

        <section className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Other Devices</h2>
            </div>
            <button onClick={() => openAddModal("outlet")} className="p-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {inventory.hasPlug ? (
            roomPlugs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roomPlugs.map(([id, dev]) => (
                  <DeviceCard key={id} deviceId={id} name={dev.name} type={dev.type as "outlet"} isOn={dev.on} power={dev.power} onToggle={handleToggleDevice} isLoading={isLoading} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-xl bg-muted/5 text-center">
                <Activity className="h-8 w-8 text-muted-foreground mb-2 animate-pulse" />
                <p className="text-sm font-medium text-muted-foreground">Syncing outlet status...</p>
              </div>
            )
          ) : (
            <EmptyModuleState icon={PlugZap} title="No Smart Plugs" description="Appliances in this room cannot be controlled remotely. Add a smart plug to enable power management." onAdd={() => openAddModal("outlet")} />
          )}
        </section>

      </main>

      {selectedSensor && (
        <SensorHistoryModal isOpen={!!selectedSensor} onClose={() => setSelectedSensor(null)} title={selectedSensor.title} metricKey={selectedSensor.metricKey} unit={selectedSensor.unit} currentValue={selectedSensor.value} deviceId={sensorNodeId || ""} />
      )}

      <AddDeviceModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        roomId={roomId} 
        deviceType={deviceTypeToAdd} 
        onSuccess={() => setReloadTrigger(prev => prev + 1)} 
      />
    </div>
  );
}