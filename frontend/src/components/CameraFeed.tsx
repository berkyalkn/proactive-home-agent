"use client";

import { useState, useEffect, useRef } from "react";
import { Cctv, Circle, AlertCircle, Maximize, Minimize, SignalLow } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CameraFeedProps {
  roomId: string;
}

export function CameraFeed({ roomId }: CameraFeedProps) {
  const ACTIVE_CAMERAS = ["livingroom", "living_room"];
  const hasCamera = ACTIVE_CAMERAS.includes(roomId.toLowerCase());

  const [isOnline, setIsOnline] = useState(true);
  const [timeString, setTimeString] = useState("");
  const [dateString, setDateString] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [streamUrl, setStreamUrl] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString("tr-TR", { hour12: false }));
      setDateString(now.toLocaleDateString("tr-TR"));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);

    if (hasCamera) {
      setStreamUrl(`http://127.0.0.1:5001/video_feed?t=${Date.now()}`);
    }

    return () => {
      clearInterval(timer);
      setStreamUrl(""); 
    };
  }, [hasCamera]);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen API error:", err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  return (
    <Card className="overflow-hidden border border-border/50 bg-card/40 shadow-sm transition-all duration-300">
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 border-b border-border/50">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-foreground">
          <Cctv className="h-4 w-4 text-primary" />
          CAM-{roomId.substring(0, 3).toUpperCase()}01
        </CardTitle>

        <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${hasCamera && isOnline ? "bg-red-500/10 text-red-500" : "bg-muted text-muted-foreground"}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${hasCamera && isOnline ? "bg-red-500 animate-pulse" : "bg-muted-foreground"}`} />
          {hasCamera && isOnline ? "LIVE" : "NO SIGNAL"}
        </div>
      </CardHeader>

      <CardContent className="p-0 relative group">
        <div ref={containerRef} className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">

          {hasCamera ? (
            <>
              {streamUrl && (
                <img
                  src={streamUrl}
                  alt="Live Camera Stream"
                  className={`w-full h-full object-cover transition-opacity duration-700 ease-out ${isOnline ? 'opacity-100' : 'opacity-0'}`}
                  onError={() => setIsOnline(false)}
                  onLoad={() => setIsOnline(true)}
                />
              )}

              {!isOnline && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-900/80 backdrop-blur-sm z-10">
                  <AlertCircle className="h-10 w-10 text-red-500/50" />
                  <span className="text-xs tracking-widest uppercase font-semibold text-zinc-300">Connection Lost</span>
                  <span className="text-[10px] text-zinc-500">Checking edge node telemetry...</span>
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-900">
              <div className="absolute inset-0 opacity-10 bg-[url('https://media.giphy.com/media/oEI9uBYSzLpBK/giphy.gif')] bg-cover mix-blend-overlay pointer-events-none"></div>
              <SignalLow className="h-12 w-12 text-zinc-600 animate-pulse" />
              <span className="text-xs tracking-widest uppercase font-semibold text-zinc-500">NO CAMERA DETECTED</span>
              <span className="text-[9px] text-zinc-600 font-mono">Input Source: Empty</span>
            </div>
          )}

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] pointer-events-none z-10"></div>

          <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/60 to-transparent flex flex-col z-20 pointer-events-none select-none">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white font-mono tracking-widest uppercase bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-[2px]">
                CAM: {roomId.toUpperCase()}
              </span>
              {hasCamera && isOnline && (
                <span className="text-[10px] text-red-500 font-bold tracking-wider animate-pulse flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-[2px]">
                  ● REC
                </span>
              )}
            </div>
            <span className="text-[10px] text-white/80 font-mono tracking-widest mt-1 ml-0.5 drop-shadow-md">
              {dateString} - {timeString}
            </span>
          </div>

          {hasCamera && (
            <div className="absolute bottom-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button 
                onClick={toggleFullscreen}
                className="p-1.5 bg-black/50 text-white rounded hover:bg-primary hover:text-primary-foreground transition-colors backdrop-blur-sm"
                title={isFullscreen ? "Küçült" : "Tam Ekran"}
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </button>
            </div>
          )}

        </div>

        <div className="px-4 py-3 bg-muted/20 border-t border-border/50 flex justify-between items-center text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Circle className={`h-2 w-2 ${hasCamera && isOnline ? "fill-green-500 text-green-500" : "fill-muted-foreground text-muted-foreground"}`} />
            {hasCamera && isOnline ? "System Active" : "No Input"}
          </span>
          <span className="font-mono opacity-60 flex items-center gap-2">
            {hasCamera && isOnline && <span>30 FPS</span>}
            <span>{hasCamera ? "MJPEG Stream" : "N/A"}</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}