"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Cctv, Circle, Maximize, Minimize, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const GO2RTC_URL =
  process.env.NEXT_PUBLIC_GO2RTC_URL || "http://100.90.235.67:1984";
const GO2RTC_STREAM =
  process.env.NEXT_PUBLIC_GO2RTC_STREAM || "living_room_hd";

interface CameraFeedProps {
  roomId: string;
  deviceId?: string;
}

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "failed";

export function CameraFeed({ roomId, deviceId }: CameraFeedProps) {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [timeString, setTimeString] = useState("");
  const [dateString, setDateString] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCount = useRef(0);
  const mountedRef = useRef(true);

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
    const handleFullscreenChange = () =>
      setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);


  const connect = useCallback(async () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    if (!mountedRef.current) return;
    setStatus("connecting");

    try {
      const pc = new RTCPeerConnection({
        bundlePolicy: "max-bundle",
        iceServers: [], 
      });
      pcRef.current = pc;

      pc.addTransceiver("video", { direction: "recvonly" });
      pc.addTransceiver("audio", { direction: "recvonly" });

      pc.ontrack = (e) => {
        if (videoRef.current && e.streams[0]) {
          videoRef.current.srcObject = e.streams[0];
        }
      };

      pc.onconnectionstatechange = () => {
        if (!mountedRef.current) return;
        switch (pc.connectionState) {
          case "connected":
            setStatus("connected");
            retryCount.current = 0;
            break;
          case "disconnected":
            setStatus("disconnected");
            scheduleReconnect();
            break;
          case "failed":
            setStatus("failed");
            scheduleReconnect();
            break;
          case "connecting":
            setStatus("connecting");
            break;
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === "complete") return resolve();
        pc.onicegatheringstatechange = () => {
          if (pc.iceGatheringState === "complete") resolve();
        };
      });

      const resp = await fetch(
        `${GO2RTC_URL}/api/webrtc?src=${encodeURIComponent(GO2RTC_STREAM)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/sdp" },
          body: pc.localDescription!.sdp,
        }
      );

      if (!resp.ok) {
        throw new Error(`go2rtc API returned ${resp.status}`);
      }

      const answerSdp = await resp.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
    } catch (err) {
      console.error("[CameraFeed] WebRTC connection error:", err);
      if (mountedRef.current) {
        setStatus("failed");
        scheduleReconnect();
      }
    }
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    const delay = Math.min(2000 * Math.pow(2, retryCount.current), 30000);
    retryCount.current++;
    console.log(
      `[CameraFeed] Reconnecting in ${delay / 1000}s (attempt ${retryCount.current})`
    );
    reconnectTimer.current = setTimeout(() => {
      if (mountedRef.current) connect();
    }, delay);
  }, [connect]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, [connect]);

  const isOnline = status === "connected";

  const statusLabel: Record<ConnectionStatus, string> = {
    connecting: "CONNECTING...",
    connected: "LIVE",
    disconnected: "RECONNECTING...",
    failed: "OFFLINE",
  };

  return (
    <Card className="overflow-hidden border border-border/50 bg-card/40 shadow-sm transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 border-b border-border/50">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-foreground">
          <Cctv className="h-4 w-4 text-primary" />
          CAM-{roomId.substring(0, 3).toUpperCase()}-
          {(deviceId || "01").substring(0, 4)}
        </CardTitle>

        <div
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
            isOnline
              ? "bg-red-500/10 text-red-500"
              : status === "failed"
                ? "bg-orange-500/10 text-orange-500"
                : "bg-muted text-muted-foreground"
          }`}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              isOnline
                ? "bg-red-500 animate-pulse"
                : status === "failed"
                  ? "bg-orange-500"
                  : "bg-muted-foreground animate-pulse"
            }`}
          />
          {statusLabel[status]}
        </div>
      </CardHeader>

      <CardContent className="p-0 relative group">
        <div
          ref={containerRef}
          className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden"
        >
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] pointer-events-none z-10" />

          <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/60 to-transparent flex flex-col z-20 pointer-events-none select-none">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white font-mono tracking-widest uppercase bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-[2px]">
                ROOM: {roomId.toUpperCase()}
              </span>
              {isOnline && (
                <span className="text-[10px] text-red-500 font-bold tracking-wider animate-pulse flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-[2px]">
                  ● REC
                </span>
              )}
            </div>
            <span className="text-[10px] text-white/80 font-mono tracking-widest mt-1 ml-0.5 drop-shadow-md">
              {dateString} - {timeString}
            </span>
          </div>

          <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {status === "failed" && (
              <button
                onClick={() => {
                  retryCount.current = 0;
                  connect();
                }}
                className="p-1.5 bg-black/50 text-white rounded hover:bg-primary hover:text-primary-foreground transition-colors backdrop-blur-sm"
                title="Yeniden Bağlan"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 bg-black/50 text-white rounded hover:bg-primary hover:text-primary-foreground transition-colors backdrop-blur-sm"
              title={isFullscreen ? "Küçült" : "Tam Ekran"}
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="px-4 py-3 bg-muted/20 border-t border-border/50 flex justify-between items-center text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Circle
              className={`h-2 w-2 ${isOnline ? "fill-green-500 text-green-500" : "fill-red-500 text-red-500"}`}
            />
            {isOnline ? "System Active" : "Stream Offline"}
          </span>
          <span className="font-mono opacity-60 flex items-center gap-2">
            {isOnline && (
              <span className="text-blue-400 font-bold">WebRTC / Native</span>
            )}
            <span>Ultra-Low Latency</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}