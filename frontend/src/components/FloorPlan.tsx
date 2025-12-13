"use client";

import Link from "next/link";
import { MapPin, Home } from "lucide-react";
import Image from "next/image";


const rooms = [
  { id: "livingroom", name: "Living Room", top: "73%", left: "35.5%" },
  { id: "guestroom", name: "Guest Room", top: "42%", left: "34%" },
  { id: "bedroom", name: "Bedroom", top: "20%", left: "33%" },
];

export function FloorPlan() {
  
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const leftPercent = Math.round((x / rect.width) * 100);
    const topPercent = Math.round((y / rect.height) * 100);

  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-card border border-border/50 rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Home Layout
        </h3>
        <span className="text-xs text-muted-foreground">Select a room to control</span>
      </div>

 
      <div 
        className="relative w-full aspect-[4/3] bg-white rounded-lg border-2 border-border/30 overflow-hidden cursor-crosshair shadow-inner group"
        onClick={handleMapClick}
      >
        
     
        <img 
          src="/home_plan.png" 
          alt="Home Plan" 
          className="w-full h-full object-contain" 
        />

        {rooms.map((room) => (
          <Link 
            key={room.id} 
            href={`/room/${room.id}`}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 group/node"
            style={{ top: room.top, left: room.left }}
            onClick={(e) => e.stopPropagation()} 
          >
            <div className="flex flex-col items-center cursor-pointer transition-transform duration-300 hover:scale-110">
              
             
              <div className="relative flex items-center justify-center">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-40 animate-ping duration-1000 w-12 h-12"></span>
                <div className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center shadow-lg bg-primary text-primary-foreground">
                  <Home className="h-3.5 w-3.5" />
                </div>
              </div>

           
              <div className="mt-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-900/90 text-white backdrop-blur-md border border-white/10 shadow-xl opacity-0 group-hover/node:opacity-100 transition-opacity translate-y-2 group-hover/node:translate-y-0">
                {room.name}
              </div>
            </div>
          </Link>
        ))}

      </div>
    </div>
  );
}