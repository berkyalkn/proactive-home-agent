"use client";

import { Home } from "lucide-react";
import { FloorPlan } from "@/components/FloorPlan";
import { VoiceCommandCenter } from "@/components/VoiceCommandCenter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Home className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">HOMIFY</h1>
            <p className="text-xs text-muted-foreground">Proactive Smart Home Control Center</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 container mx-auto">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Floor Plan View</h2>
          <p className="text-muted-foreground">Select a room from the layout below to view controls.</p>
        </div>
        <VoiceCommandCenter />
        <FloorPlan />
      </main>
    </div>
  );
}