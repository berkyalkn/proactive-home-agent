"use client";

import { useState, useEffect, use } from "react"; 
import Link from "next/link";
import { SensorCard } from "@/components/SensorCard";
import { DeviceCard } from "@/components/DeviceCard";
import {
  Thermometer, Droplets, Gauge, Eye, Sun, Home, Activity, WifiOff, ArrowLeft
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
type SensorResponse = Record<string, RoomSensorData>;
interface Device {
  name: string;
  on: boolean;
  type: "light" | "outlet";
  power: number;
}
type DeviceState = Record<string, Device>;

const formatTitle = (roomId: string) => {
  return roomId.charAt(0).toUpperCase() + roomId.slice(1) + " Control";
};

export default function RoomDetailPage({ params }: { params: Promise<{ roomId: string }> }) {
  const resolvedParams = use(params);
  const roomId = resolvedParams.roomId;

  const [sensorData, setSensorData] = useState<RoomSensorData | null>(null);
  const [devices, setDevices] = useState<DeviceState>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSensors = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/sensors/all`);
        if (response.ok) {
          const data = await response.json();
          const targetId = `esp32_${roomId}`;
          
          if (data && data[targetId]) {
            setSensorData(data[targetId]);
          } else {
            setSensorData(null);
          }
        }
      } catch (error) { console.error("Sensor error:", error); }
    };
    fetchSensors();
    const interval = setInterval(fetchSensors, 2000);
    return () => clearInterval(interval);
  }, [roomId]);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/devices/`);
        if (response.ok) {
          const data: DeviceState = await response.json();
          
          const searchKey = roomId === "livingroom" ? "living_room" : roomId;

          const filteredDevices: DeviceState = {};
          Object.entries(data).forEach(([key, val]) => {
            if (key.includes(searchKey)) {
              filteredDevices[key] = val;
            }
          });
          setDevices(filteredDevices);
        }
      } catch (error) { console.error("Device error:", error); }
    };
    fetchDevices();
    const interval = setInterval(fetchDevices, 5000);
    return () => clearInterval(interval);
  }, [roomId]);

  const handleToggleDevice = async (deviceId: string, newStatus: boolean) => {
    setIsLoading(true);
    try {
      await fetch(`${API_BASE_URL}/api/devices/${deviceId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ on: newStatus }),
      });
      setDevices((prev) => ({
         ...prev, 
         [deviceId]: { ...prev[deviceId], on: newStatus } 
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const formatValue = (val: number | null) => (val === null ? "N/A" : val);

  return (
    <div className="min-h-screen bg-background pb-12">
      
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-10 mb-8">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link 
            href="/" 
            className="p-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Map
          </Link>
          <div className="h-6 w-[1px] bg-border mx-2"></div>
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Home className="h-5 w-5 text-primary" />
              {formatTitle(roomId)}
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 space-y-10">
        
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Device Control</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.keys(devices).length > 0 ? (
              Object.entries(devices).map(([id, dev]) => (
                <DeviceCard 
                  key={id} 
                  deviceId={id} 
                  name={dev.name}
                  type={dev.type}
                  isOn={dev.on} 
                  power={dev.power}
                  onToggle={handleToggleDevice} 
                  isLoading={isLoading} 
                />
              ))
            ) : (
              <div className="col-span-full py-8 text-center text-muted-foreground bg-muted/5 rounded-lg border border-dashed border-border/50">
                No controllable devices found in {roomId}.
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Environment Monitoring</h2>
          </div>

          {sensorData ? (
             <div className="bg-card/40 p-5 rounded-xl border border-border/50 shadow-sm">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  <SensorCard title="Temp" value={formatValue(sensorData.temperature)} unit="°C" icon={Thermometer} />
                  <SensorCard title="Humidity" value={formatValue(sensorData.humidity)} unit="%" icon={Droplets} />
                  <SensorCard title="Motion" value={sensorData.motion_detected ? "Active" : "Clear"} unit="" icon={Eye} />
                  <SensorCard title="Light" value={formatValue(sensorData.light_level)} unit="lx" icon={Sun} />
                  <SensorCard title="Pressure" value={formatValue(sensorData.pressure)} unit="hPa" icon={Gauge} />
                </div>
             </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-xl bg-muted/5">
              <WifiOff className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground font-medium">No sensor data available for {roomId}.</p>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}