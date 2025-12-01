"use client";

import { useState, useEffect } from "react";
import { SensorCard } from "@/components/SensorCard";
import { DeviceCard } from "@/components/DeviceCard";
import {
  Thermometer,
  Droplets,
  Gauge,
  Eye,
  Sun,
  Home,
  Activity,
  WifiOff
} from "lucide-react";

const API_BASE_URL = "http://localhost:8000";

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
}

type DeviceState = Record<string, Device>;

const formatRoomName = (deviceId: string) => {
  if (!deviceId) return "Unknown Room";
  const parts = deviceId.split("_");
  if (parts.length > 1) {
    return parts.slice(1)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
  return deviceId;
};

export default function SmartHomeDashboard() {
  const [sensorData, setSensorData] = useState<SensorResponse | null>(null);
  const [devices, setDevices] = useState<DeviceState>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/sensors/all`);
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'waiting_for_data') {
             setSensorData(null); 
          } else {
             setSensorData(data as SensorResponse);
          }
        }
      } catch (error) {
        console.error("Sensor error:", error);
      }
    };

    fetchSensorData();
    const interval = setInterval(fetchSensorData, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchDeviceData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/devices`);
        if (response.ok) {
          const data = await response.json();
          setDevices(data);
        }
      } catch (error) {
        console.error("Device error:", error);
      }
    };
    fetchDeviceData();
  }, []);

  const handleToggleDevice = async (deviceId: string, newStatus: boolean) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/devices/${deviceId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ on: newStatus }),
      });
      if (response.ok) {
        const updatedDevice = await response.json();
        setDevices((prev) => ({ ...prev, [deviceId]: updatedDevice }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatValue = (val: number | null) => (val === null ? "N/A" : val);

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Home className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">HOMIFY</h1>
            <p className="text-xs text-muted-foreground">Proactive Smart Home Control Center</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-10">
        
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Device Control</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.keys(devices).length > 0 ? (
              Object.entries(devices).map(([deviceId, device]) => (
                <DeviceCard
                  key={deviceId}
                  deviceId={deviceId}
                  name={device.name}
                  type={device.type}
                  isOn={device.on}
                  onToggle={handleToggleDevice}
                  isLoading={isLoading}
                />
              ))
            ) : (
              <div className="col-span-full flex justify-center py-8 bg-muted/5 rounded-lg border border-dashed border-border/50">
                <div className="text-muted-foreground text-sm flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  Searching for devices...
                </div>
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Environment Monitoring</h2>
          </div>

          {sensorData && Object.keys(sensorData).length > 0 ? (
            <div className="space-y-8">
              {Object.values(sensorData).map((roomData) => (
                <div key={roomData.device_id} className="bg-card/40 p-5 rounded-xl border border-border/50 shadow-sm">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-primary">
                    <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                    {formatRoomName(roomData.device_id)}
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    <SensorCard title="Temperature" value={formatValue(roomData.temperature)} unit="°C" icon={Thermometer} />
                    <SensorCard title="Humidity" value={formatValue(roomData.humidity)} unit="%" icon={Droplets} />
                    <SensorCard title="Motion" value={roomData.motion_detected ? "Active" : "Clear"} unit="" icon={Eye} />
                    <SensorCard title="Light" value={formatValue(roomData.light_level)} unit="lx" icon={Sun} />
                    <SensorCard title="Pressure" value={formatValue(roomData.pressure)} unit="hPa" icon={Gauge} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-xl bg-muted/5">
              <WifiOff className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground font-medium">Waiting for sensor data...</p>
              <p className="text-xs text-muted-foreground mt-1">Please ensure ESP32 nodes are powered on.</p>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}