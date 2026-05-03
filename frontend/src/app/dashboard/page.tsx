"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Home, LogOut } from "lucide-react";
import { FloorPlan } from "@/components/FloorPlan";
import { VoiceCommandCenter } from "@/components/VoiceCommandCenter";
import { UserManager } from "@/components/UserManager";
import { GestureManager } from "@/components/GestureManager";
import { EmergencyManager } from "@/components/EmergencyManager"; 

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      
      <div className="absolute top-24 left-6 z-50 flex flex-col gap-4">
          <UserManager />
          <GestureManager /> 
          <EmergencyManager /> 
      </div>

      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          
          <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Home className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">HOMIFY</h1>
              <p className="text-xs text-muted-foreground hidden md:block">Proactive Smart Home Control Center</p>
            </div>
          </div>

          <button 
            onClick={handleLogout} 
            className="flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-bold transition-all border border-red-100"
          >
            <LogOut className="w-4 h-4" /> 
            <span className="hidden sm:inline">Logout</span>
          </button>

        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 container mx-auto">
        <div className="text-center space-y-2 mt-8 md:mt-0">
          <h2 className="text-3xl font-bold tracking-tight">Floor Plan View</h2>
          <p className="text-muted-foreground">Select a room from the layout below to view controls.</p>
        </div>
        
        <VoiceCommandCenter />
        <FloorPlan />
      </main>
    </div>
  );
}