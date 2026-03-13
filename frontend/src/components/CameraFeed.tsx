"use client";

import { useState, useEffect } from "react";
import { Cctv, Circle, AlertCircle, Maximize, SignalLow } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CameraFeedProps {
  roomId: string;
}

export function CameraFeed({ roomId }: CameraFeedProps) {
  const ACTIVE_CAMERAS = ["livingroom", "living_room"];

  const STREAM_URL = "http://127.0.0.1:5001/video_feed";

  const hasCamera = ACTIVE_CAMERAS.includes(roomId.toLowerCase());

  const [isOnline, setIsOnline] = useState(true);
  const [timeString, setTimeString] = useState("");
  const [dateString, setDateString] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString("tr-TR", { hour12: false }));
      setDateString(now.toLocaleDateString("tr-TR"));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Card className="overflow-hidden border-border/50 bg-card/40 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Cctv className="h-5 w-5 text-primary" />
          CAM-{roomId.substring(0, 3).toUpperCase()}01
        </CardTitle>

        <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${hasCamera && isOnline ? "bg-red-500/10 text-red-500" : "bg-gray-500/10 text-gray-500"}`}>
          <div className={`w-2 h-2 rounded-full ${hasCamera && isOnline ? "bg-red-500 animate-pulse" : "bg-gray-500"}`} />
          {hasCamera && isOnline ? "LIVE" : "NO SIGNAL"}
        </div>
      </CardHeader>

      <CardContent className="p-0 relative group">
        <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">

          {hasCamera ? (
            <>
              <img
                src={STREAM_URL}
                alt="Live Camera Stream"
                className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-500 ${isOnline ? 'opacity-100' : 'opacity-0'}`}
                onError={() => setIsOnline(false)}
                onLoad={() => setIsOnline(true)}
              />

              {!isOnline && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-2 bg-zinc-900/80 backdrop-blur-sm">
                  <AlertCircle className="h-10 w-10 text-red-500/50" />
                  <span className="text-xs tracking-widest uppercase font-semibold">Connection Lost</span>
                  <span className="text-[10px] text-gray-500">is mac_camera.py working?</span>
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-2 bg-zinc-900">
              <div className="absolute inset-0 opacity-10 bg-[url('https://media.giphy.com/media/oEI9uBYSzLpBK/giphy.gif')] bg-cover mix-blend-overlay pointer-events-none"></div>

              <SignalLow className="h-12 w-12 text-gray-600 animate-pulse" />
              <span className="text-xs tracking-widest uppercase font-semibold text-gray-500">NO CAMERA DETECTED</span>
              <span className="text-[9px] text-gray-600 font-mono">Input Source: Empty</span>
            </div>
          )}

          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] z-10 bg-[length:100%_4px] pointer-events-none opacity-50" />

          <div className="absolute top-4 left-4 flex flex-col z-20 pointer-events-none select-none">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/90 font-mono tracking-widest uppercase bg-black/40 px-1.5 py-0.5 rounded-sm backdrop-blur-[2px]">
                CAM: {roomId.toUpperCase()}
              </span>
              {hasCamera && isOnline && (
                <span className="text-[9px] text-red-500 font-bold tracking-wider animate-pulse flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded-sm backdrop-blur-[2px]">
                  ● REC
                </span>
              )}
            </div>
            <span className="text-[10px] text-white/80 font-mono tracking-widest mt-1 ml-0.5 shadow-black drop-shadow-sm">
              {dateString} - {timeString}
            </span>
          </div>

          {hasCamera && (
            <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
              <button className="p-1.5 bg-black/60 text-white rounded hover:bg-primary hover:text-black transition-colors backdrop-blur-sm">
                <Maximize className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

        </div>

        <div className="px-4 py-3 bg-muted/20 border-t border-border/50 flex justify-between items-center text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Circle className={`h-2 w-2 ${hasCamera && isOnline ? "fill-green-500 text-green-500" : "fill-gray-500 text-gray-500"}`} />
            {hasCamera && isOnline ? "System Active" : "No Input"}
          </span>
          <span className="font-mono opacity-50 flex items-center gap-2">
            <span>{hasCamera ? "MJPEG Stream" : "N/A"}</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}