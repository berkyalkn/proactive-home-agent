"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, Sofa, BedDouble, Coffee, Loader2, ArrowRight } from "lucide-react";
import s from "./dashboard/dashboard.module.css";

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
        console.error("Rooms could not be taken", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRooms();
  }, []);

  if (isLoading) {
    return (
      <div className={s.loadingContainer}>
        <Loader2 size={28} className={s.loadingSpinner} />
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className={s.emptyState}>
        <MapPin size={40} className={s.emptyIcon} />
        <p className={s.emptyTitle}>No Rooms Configured</p>
        <p className={s.emptyText}>Complete the onboarding process to set up your home topology.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[716px] mx-auto">
      <div className="flex items-center gap-2 mt-8 px-1">
        <MapPin size={18} className="text-indigo-400" />
        <h2 className="text-lg font-bold text-zinc-200">Home Topology</h2>
      </div>

      <div className={s.roomGrid}>
        {rooms.map((room) => {
          const IconComponent = IconMap[room.icon] || MapPin;
          return (
            <Link key={room.id} href={`/room/${room.id}`} className={s.roomCard}>
              <div className={s.roomCardIcon}>
                <IconComponent size={22} />
              </div>
              <h3 className={s.roomCardName}>{room.name}</h3>
              <p className={s.roomCardDesc}>Access room controls</p>
              <ArrowRight size={16} className={s.roomCardArrow} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}