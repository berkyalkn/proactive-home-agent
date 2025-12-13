"use client";

import { useState, useEffect } from "react";
import { Cctv, Maximize, MoreVertical, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CameraFeedProps {
  roomId: string;
}

export function CameraFeed({ roomId }: CameraFeedProps) {
  const [isOnline, setIsOnline] = useState(true); 
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-US", { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Card className="overflow-hidden border-border/50 bg-card/40 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Cctv className="h-5 w-5 text-primary" />
          Live Feed Cam-01
        </CardTitle>
        <div className="flex items-center gap-2">
           <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${isOnline ? "bg-red-500/10 text-red-500" : "bg-gray-500/10 text-gray-500"}`}>
              <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-red-500 animate-pulse" : "bg-gray-500"}`} />
              {isOnline ? "LIVE" : "OFFLINE"}
           </div>
           <button className="text-muted-foreground hover:text-primary transition-colors">
             <MoreVertical className="h-4 w-4" />
           </button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 relative group">
        
        <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
          
          {isOnline ? (
            <img 
              src="https://images.unsplash.com/photo-1558002038-1091a1661116?q=80&w=1000&auto=format&fit=crop" 
              alt="Room Camera" 
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
            />
          ) : (
            <div className="flex flex-col items-center text-muted-foreground gap-2">
               <Cctv className="h-10 w-10 opacity-20" />
               <span className="text-xs tracking-widest uppercase">No Signal</span>
            </div>
          )}

          <div className="absolute top-4 left-4 flex flex-col gap-0.5">
             <span className="text-[10px] text-white/70 font-mono tracking-widest uppercase">CAM: {roomId.toUpperCase()}</span>
             <span className="text-[10px] text-white/70 font-mono tracking-widest">{new Date().toLocaleDateString()} {currentTime}</span>
          </div>

          <div className="absolute top-1/4 left-1/4 w-32 h-32 border-2 border-primary/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
             <div className="absolute -top-3 left-0 bg-primary text-black text-[9px] font-bold px-1 rounded-sm">
                PERSON 98%
             </div>
          </div>

          <button className="absolute bottom-4 right-4 p-2 bg-black/50 text-white rounded-lg hover:bg-primary hover:text-black transition-all backdrop-blur-sm opacity-0 group-hover:opacity-100">
             <Maximize className="h-4 w-4" />
          </button>

        </div>

        <div className="px-4 py-3 bg-muted/20 border-t border-border/50 flex justify-between items-center text-xs text-muted-foreground">
           <span className="flex items-center gap-1.5">
             <Circle className="h-2 w-2 fill-green-500 text-green-500" />
             System Active
           </span>
           <span className="font-mono opacity-50">1080p • 30FPS</span>
        </div>

      </CardContent>
    </Card>
  );
}