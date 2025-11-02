"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Zap, Power } from "lucide-react";

interface DeviceCardProps {
  deviceId: string;
  name: string;
  type: "light" | "outlet";
  isOn: boolean;
  onToggle: (deviceId: string, newStatus: boolean) => void;
  isLoading: boolean;
}

export function DeviceCard({
  deviceId,
  name,
  type,
  isOn,
  onToggle,
  isLoading,
}: DeviceCardProps) {
  const Icon = type === "light" ? Lightbulb : Zap;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          {name}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <span className="text-muted-foreground">
          {isOn ? "On" : "Off"}
        </span>
        <Button
          variant={isOn ? "default" : "outline"}
          size="sm"
          onClick={() => onToggle(deviceId, !isOn)}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <Power className="h-4 w-4" />
          {isOn ? "On" : "Off"}
        </Button>
      </CardContent>
    </Card>
  );
}