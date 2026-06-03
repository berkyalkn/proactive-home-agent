"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plug, Power, Activity, Zap } from "lucide-react";

interface DeviceCardProps {
  deviceId: string;
  name: string;
  type: "outlet" | "bulb" | "camera" | "sensor_node"; 
  isOn: boolean;
  power?: number;
  onToggle: (deviceId: string, newStatus: boolean) => void;
  isLoading: boolean;
  isOnline?: boolean;
}

export function DeviceCard({
  deviceId,
  name,
  type,
  isOn,
  power = 0,
  onToggle,
  isLoading,
  isOnline = true,
}: DeviceCardProps) {

  const Icon = Plug;

  return (
    <Card className="relative overflow-hidden">
      {isOn && power > 0 && (
        <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />
      )}

      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <div className={`p-2 rounded-lg transition-colors ${isOn && isOnline ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
              <Icon className="h-5 w-5" />
            </div>
            {name}
          </CardTitle>
          {typeof power === 'number' && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md">
              <Activity className="h-3 w-3" />
              {power} W
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={`w-1.5 h-1.5 rounded-full ${!isOnline ? "bg-gray-400" : isOn ? "bg-green-500" : "bg-red-400"}`} />
            <span className={`text-sm font-medium ${isOn && isOnline ? "text-foreground" : "text-muted-foreground"}`}>
              {!isOnline ? "Offline" : isOn ? "On" : "Off"}
            </span>
          </div>
          <Button
            variant={isOn && isOnline ? "default" : "outline"}
            size="sm"
            onClick={() => onToggle(deviceId, !isOn)}
            disabled={isLoading || !isOnline}
            className={`min-w-[80px] transition-all ${isOn && isOnline ? 'shadow-md shadow-primary/20' : ''}`}
          >
            <Power className="h-3.5 w-3.5 mr-1.5" />
            {isOn ? "Turn Off" : "Turn On"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}