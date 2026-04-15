"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, Thermometer, Eye, Lightbulb, Sofa, BedDouble, Coffee, Activity, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

const IconMap: Record<string, any> = {
  "Sofa": Sofa,
  "BedDouble": BedDouble,
  "Coffee": Coffee,
  "MapPin": MapPin
};

export function FloorPlan() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch("http://localhost:8000/rooms/list", {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setRooms(data.rooms); 
        }
      } catch (err) {
        console.error("Odalar çekilemedi", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRooms();
  }, []);

  if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <h3 className="text-xl font-bold flex items-center gap-2"><MapPin className="text-indigo-500" /> Home Topology</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {rooms.map((room) => {
          const IconComponent = IconMap[room.icon] || MapPin;
          return (
            <Link key={room.id} href={`/room/${room.id}`}>
              <Card className="p-6 hover:border-indigo-500 transition-all cursor-pointer">
                <div className="p-3 bg-muted rounded-xl w-fit mb-4 text-indigo-400">
                  <IconComponent className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold">{room.name}</h4>
                <p className="text-xs text-muted-foreground mt-2">Access room controls</p>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}