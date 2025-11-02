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
} from "lucide-react";

const API_BASE_URL = "http://localhost:8000";

interface SensorData {
  temperature: number;
  humidity: number;
  pressure: number;
  motion_detected: boolean;
  light_level: number;
}

interface Device {
  name: string;
  on: boolean;
  type: "light" | "outlet";
}

type DeviceState = Record<string, Device>; 

export default function SmartHomeDashboard() {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [devices, setDevices] = useState<DeviceState>({});
  const [isLoading, setIsLoading] = useState(false); 

  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/sensors/all`);
        if (!response.ok) throw new Error("Sensor API Error");
        const data: SensorData = await response.json();
        setSensorData(data);
      } catch (error) {
        console.error("Failed to receive sensor data: ", error);
        setSensorData(null); 
      }
    };

    fetchSensorData(); 
    const interval = setInterval(fetchSensorData, 5000); 
    return () => clearInterval(interval); 
  }, []);

  useEffect(() => {
    const fetchDeviceData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/devices`);
        if (!response.ok) throw new Error("Device API Error");
        const data: DeviceState = await response.json();
        setDevices(data);
      } catch (error) {
        console.error("Failed to receive device data: ", error);
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

      if (!response.ok) throw new Error("Device Control Error");

      const updatedDevice: Device = await response.json();

      setDevices((prevDevices) => ({
        ...prevDevices,
        [deviceId]: updatedDevice,
      }));
    } catch (error) {
      console.error("Device could not be controlled: ", error);
  
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50">
        <div className="container mx-auto px-4 py-6 flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Home className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">HOMIFY</h1>
            <p className="text-muted-foreground">
            Proactive Smart Home Control Center
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            Environment Monitoring
          </h2>
          {sensorData ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <SensorCard
                title="Temperature"
                value={sensorData.temperature}
                unit="°C"
                icon={Thermometer}
              />
              <SensorCard
                title="Humidity"
                value={sensorData.humidity}
                unit="%"
                icon={Droplets}
              />
              <SensorCard
                title="Motion"
                value={sensorData.motion_detected ? "Detected" : "Not Detected"}
                unit=""
                icon={Eye}
              />
              <SensorCard
                title="Light Level"
                value={sensorData.light_level}
                unit="lux"
                icon={Sun}
              />
              <SensorCard
                title="Pressure"
                value={sensorData.pressure}
                unit="hPa"
                icon={Gauge}
              />
            </div>
          ) : (
            <p className="text-muted-foreground">Loading sensor data...</p>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            Device Control
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(devices).map(([deviceId, device]) => (
              <DeviceCard
                key={deviceId}
                deviceId={deviceId}
                name={device.name}
                type={device.type}
                isOn={device.on}
                onToggle={handleToggleDevice}
                isLoading={isLoading}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}