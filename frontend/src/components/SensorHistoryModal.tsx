"use client";

import React, { useState, useEffect } from "react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from "recharts";
import { X, Loader2, AlertCircle } from "lucide-react";
import { format, parseISO, differenceInMinutes } from "date-fns";
import { cn } from "@/lib/utils";

interface SensorHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  metricKey: string;
  unit: string;
  deviceId: string;
  currentValue: string | number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const TIME_RANGES = [
  { label: "1H", hours: 1 },
  { label: "6H", hours: 6 },
  { label: "12H", hours: 12 },
  { label: "24H", hours: 24 },
];

export function SensorHistoryModal({
  isOpen, onClose, title, metricKey, unit, deviceId, currentValue
}: SensorHistoryModalProps) {
  const [data, setData] = useState<any[]>([]); 
  const [loading, setLoading] = useState(false);
  const [selectedRange, setSelectedRange] = useState(24);

  const processDataWithGaps = (rawData: { timestamp: string; value: number }[]) => {
    if (!rawData || rawData.length === 0) return [];

    const processedData = [];
    
    const GAP_THRESHOLD_MINUTES = 5; 

    for (let i = 0; i < rawData.length; i++) {
      const currentPoint = rawData[i];
      processedData.push(currentPoint);

      if (i < rawData.length - 1) {
        const nextPoint = rawData[i + 1];
        const currentTime = parseISO(currentPoint.timestamp);
        const nextTime = parseISO(nextPoint.timestamp);
        
        const diff = differenceInMinutes(nextTime, currentTime);

        if (diff > GAP_THRESHOLD_MINUTES) {
          processedData.push({
            timestamp: new Date((currentTime.getTime() + nextTime.getTime()) / 2).toISOString(),
            value: null 
          });
        }
      }
    }
    return processedData;
  };

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/sensors/history/${deviceId}/${metricKey}?hours=${selectedRange}`
        );
        if (res.ok) {
          const rawResult = await res.json();
          const processed = processDataWithGaps(rawResult);
          setData(processed);
        }
      } catch (error) {
        console.error("History fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, selectedRange, deviceId, metricKey]);

  if (!isOpen) return null;

  const formatXAxis = (tickItem: string) => {
    try {
      return format(parseISO(tickItem), "HH:mm");
    } catch { return ""; }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length && payload[0].value !== null) {
      return (
        <div className="bg-background/95 backdrop-blur border rounded-lg p-3 shadow-xl text-xs">
          <p className="font-medium mb-1">{format(parseISO(label), "d MMM, HH:mm")}</p>
          <p className="text-primary font-bold text-sm">
            {payload[0].value} {unit}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-3xl px-4 animate-in zoom-in-95">
        <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden relative">
          
          <div className="p-6 flex justify-between items-start border-b border-border/50 bg-muted/20">
            <div>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                {title} History
              </h3>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold text-primary">{currentValue}</span>
                <span className="text-sm font-medium text-muted-foreground">{unit} Now</span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <div className="p-6 min-h-[300px] flex flex-col justify-center">
            {loading ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-sm">Loading data...</span>
              </div>
            ) : data.length > 0 ? (
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={formatXAxis} 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                      tickMargin={10}
                      minTickGap={30}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                      domain={['auto', 'auto']} 
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                      connectNulls={false} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <AlertCircle className="w-8 h-8 opacity-50" />
                <span>No data available for this period.</span>
              </div>
            )}
          </div>

          <div className="p-4 bg-muted/20 border-t border-border/50 flex justify-center gap-2">
            {TIME_RANGES.map((range) => (
              <button
                key={range.label}
                onClick={() => setSelectedRange(range.hours)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
                  selectedRange === range.hours
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-background hover:bg-muted text-muted-foreground border border-border"
                )}
              >
                {range.label}
              </button>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}