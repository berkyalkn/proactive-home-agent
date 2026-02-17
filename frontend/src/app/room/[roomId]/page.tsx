"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { SensorCard } from "@/components/SensorCard";
import { DeviceCard } from "@/components/DeviceCard";
import { VoiceCommandCenter } from "@/components/VoiceCommandCenter";
import { BulbControl } from "@/components/BulbControl";
import { CameraFeed } from "@/components/CameraFeed";
import { SensorHistoryModal } from "@/components/SensorHistoryModal";
import { useChat } from "@/context/ChatContext";

import {
  Thermometer, Droplets, Gauge, Eye, Sun, Home, Activity, WifiOff, ArrowLeft, Cctv, Zap, Lightbulb, PlugZap
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
  type: "outlet" | "bulb";
  power: number;
  brightness?: number;
  hue?: number;
  saturation?: number;
}
type DeviceState = Record<string, Device>;

const formatTitle = (roomId: string) => {
  return roomId.charAt(0).toUpperCase() + roomId.slice(1);
};

export default function RoomDetailPage({ params }: { params: Promise<{ roomId: string }> }) {
  const resolvedParams = use(params);
  const roomId = resolvedParams.roomId;
  const { latestSensorData } = useChat();

  const [sensorData, setSensorData] = useState<RoomSensorData | null>(null);
  const [devices, setDevices] = useState<DeviceState>({});
  const [isLoading, setIsLoading] = useState(false);

  const [selectedSensor, setSelectedSensor] = useState<{
    title: string;
    metricKey: string;
    unit: string;
    value: string | number;
  } | null>(null);

  useEffect(() => {
    const targetId = `esp32_${roomId}`;
    const liveData = latestSensorData[targetId];
    
    if (liveData) {
        setSensorData(liveData);
    }
}, [latestSensorData, roomId]);


  useEffect(() => {
    const fetchInitial = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/sensors/all`);
            if (response.ok) {
                const data = await response.json();
                const targetId = `esp32_${roomId}`;
                if (data[targetId]) setSensorData(data[targetId]);
            }
        } catch (e) { console.error(e); }
    };
    fetchInitial();
  }, [roomId]);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/devices/`);
        if (response.ok) {
          const data: DeviceState = await response.json();

          const roomPrefix = roomId === "livingroom" ? "living_room" : roomId;

          const filteredDevices: DeviceState = {};

          Object.entries(data).forEach(([key, val]) => {
            if (key.toLowerCase().includes(roomPrefix) && val.type === "outlet") {
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

  const openSensorHistory = (title: string, metricKey: string, unit: string, value: any) => {
    if (metricKey === "motion") return;

    setSelectedSensor({
      title, metricKey, unit, value
    });
  };


  const mainLightId = roomId === "livingroom" ? "living_room_bulb" : `${roomId}_bulb`;

  return (
    <div className="min-h-screen bg-background pb-12">

      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-30 mb-6">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="p-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </Link>
          <div className="h-6 w-[1px] bg-border mx-2"></div>
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Home className="h-5 w-5 text-primary" />
              {formatTitle(roomId)} Control
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 space-y-8">

        <VoiceCommandCenter />
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Environment Status</h2>
          </div>

          {sensorData ? (
            <div className="bg-card/40 p-4 rounded-2xl border border-border/50 shadow-sm">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">

                <SensorCard
                  title="Temp"
                  value={formatValue(sensorData.temperature)}
                  unit="°C"
                  icon={Thermometer}
                  onClick={() => openSensorHistory("Temperature", "temperature", "°C", formatValue(sensorData.temperature))}
                />

                <SensorCard
                  title="Humidity"
                  value={formatValue(sensorData.humidity)}
                  unit="%"
                  icon={Droplets}
                  onClick={() => openSensorHistory("Humidity", "humidity", "%", formatValue(sensorData.humidity))}
                />

                <SensorCard
                  title="Motion"
                  value={sensorData.motion_detected ? "Active" : "Clear"}
                  unit=""
                  icon={Eye}
                />

                <SensorCard
                  title="Light"
                  value={formatValue(sensorData.light_level)}
                  unit="lx"
                  icon={Sun}
                  onClick={() => openSensorHistory("Light Level", "light_level", "lx", formatValue(sensorData.light_level))}
                />

                <SensorCard
                  title="Pressure"
                  value={formatValue(sensorData.pressure)}
                  unit="hPa"
                  icon={Gauge}
                  onClick={() => openSensorHistory("Pressure", "pressure", "hPa", formatValue(sensorData.pressure))}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-xl bg-muted/5">
              <WifiOff className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Searching for sensors...</p>
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Cctv className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Live Feed</h2>
            </div>
            <CameraFeed roomId={roomId} />
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Smart Lighting</h2>
            </div>

            <div className="flex flex-col gap-3">
              <BulbControl
                deviceId={mainLightId}
                roomName={`${formatTitle(roomId)} Light`}
              />
            </div>
          </section>

        </div>

        <section className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Other Devices</h2>
          </div>

          {Object.keys(devices).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(devices).map(([id, dev]) => (
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
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-border rounded-xl bg-muted/5 text-center">
              <div className="p-3 bg-muted rounded-full mb-3">
                <PlugZap className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No other devices connected</p>
              <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">
                Smart plugs, fans, or heaters connected to this room will appear here.
              </p>
            </div>
          )}
        </section>

      </main>

      {selectedSensor && (
        <SensorHistoryModal
          isOpen={!!selectedSensor}
          onClose={() => setSelectedSensor(null)}
          title={selectedSensor.title}
          metricKey={selectedSensor.metricKey}
          unit={selectedSensor.unit}
          currentValue={selectedSensor.value}
          deviceId={`esp32_${roomId}`}
        />
      )}
    </div>
  );
}