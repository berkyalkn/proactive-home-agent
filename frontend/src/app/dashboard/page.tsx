"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import "@/app/landing.css";
import s from "@/components/dashboard/dashboard.module.css";

import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { FloorPlan } from "@/components/FloorPlan";
import { VoiceCommandCenter } from "@/components/VoiceCommandCenter";
import { UserManager } from "@/components/UserManager";
import { GestureManager } from "@/components/GestureManager";
import { EmergencyManager } from "@/components/EmergencyManager";
import { KnowledgeManager } from "@/components/KnowledgeManager";

const SIDEBAR_KEY = "homiie_sidebar_collapsed";

export default function DashboardPage() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [activeHub, setActiveHub] = useState<string | null>(null);

  const [userCount, setUserCount] = useState(0);
  const [gestureHasChanges, setGestureHasChanges] = useState(false);
  const [securityIsActive, setSecurityIsActive] = useState(true);
  const [knowledgeCount, setKnowledgeCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      setIsReady(true);
    }
  }, [router]);

  useEffect(() => {
    const saved = localStorage.getItem(SIDEBAR_KEY);
    if (saved === "true") setSidebarCollapsed(true);
  }, []);

  const handleToggleCollapse = useCallback(() => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_KEY, String(next));
      return next;
    });
  }, []);

  const handleHubClick = useCallback((hubId: string) => {
    setActiveHub(prev => (prev === hubId ? null : hubId));
    setIsMobileOpen(false);
  }, []);

  const handleCloseHub = useCallback(() => {
    setActiveHub(null);
  }, []);

  if (!isReady) return null;

  return (
    <div className="landing-scope">
      <div className={s.layout}>
        <div className={s.orbWarm} style={{ top: '-15%', left: '-5%' }} />
        <div className={s.orbCool} style={{ bottom: '-15%', right: '-5%' }} />

        <DashboardSidebar
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleCollapse}
          activeHub={activeHub}
          onHubClick={handleHubClick}
          userCount={userCount}
          gestureHasChanges={gestureHasChanges}
          securityIsActive={securityIsActive}
          knowledgeCount={knowledgeCount}
          isMobileOpen={isMobileOpen}
          onMobileClose={() => setIsMobileOpen(false)}
        />

        <div className={`${s.mainArea} ${sidebarCollapsed ? s.mainAreaCollapsed : s.mainAreaExpanded}`}>
          <DashboardHeader
            onMobileMenuToggle={() => setIsMobileOpen(prev => !prev)}
          />

          <div className={s.content}>
            <div className={s.contentInner}>
              <div className="flex flex-col items-center text-center space-y-2 mb-8 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h1 className="text-3xl font-bold tracking-tight text-white">Floor Plan View</h1>
                <p className="text-zinc-400">Select a room from the layout below to view controls.</p>
              </div>
              <VoiceCommandCenter />
              <FloorPlan />
            </div>
          </div>
        </div>

        <UserManager
          isOpen={activeHub === "access"}
          onClose={handleCloseHub}
          onUserCountChange={setUserCount}
        />
        <GestureManager
          isOpen={activeHub === "gesture"}
          onClose={handleCloseHub}
          onHasChanges={setGestureHasChanges}
        />
        <EmergencyManager
          isOpen={activeHub === "security"}
          onClose={handleCloseHub}
          onActiveStatusChange={setSecurityIsActive}
        />
        <KnowledgeManager
          isOpen={activeHub === "knowledge"}
          onClose={handleCloseHub}
          onKnowledgeCountChange={setKnowledgeCount}
        />
      </div>
    </div>
  );
}