"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Hand, ShieldAlert, PanelLeftClose, Brain } from "lucide-react";
import s from "./dashboard.module.css";

interface DashboardSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeHub: string | null;
  onHubClick: (hubId: string) => void;
  userCount: number;
  gestureHasChanges: boolean;
  securityIsActive: boolean;
  knowledgeCount: number; 
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export default function DashboardSidebar({
  isCollapsed,
  onToggleCollapse,
  activeHub,
  onHubClick,
  userCount,
  gestureHasChanges,
  securityIsActive,
  knowledgeCount, 
  isMobileOpen,
  onMobileClose,
}: DashboardSidebarProps) {

  return (
    <>
      {isMobileOpen && (
        <div className={s.mobileOverlay} onClick={onMobileClose} />
      )}

      <aside
        className={`${s.sidebar} ${
          isCollapsed ? s.sidebarCollapsed : s.sidebarExpanded
        } ${isMobileOpen ? s.sidebarMobileOpen : ""}`}
      >
        <div className={s.sidebarLogo}>
          <div className={s.sidebarLogoIcon}>
            <svg viewBox="0 0 32 32" fill="none">
              <circle cx="8" cy="8" r="3.2" fill="white" />
              <circle cx="16" cy="5" r="2.8" fill="white" />
              <circle cx="23" cy="8" r="3.2" fill="white" />
              <circle cx="6" cy="16" r="2.8" fill="white" />
              <circle cx="25" cy="16" r="2.8" fill="white" />
              <circle cx="8" cy="23" r="3.2" fill="white" />
              <circle cx="16" cy="26" r="2.8" fill="white" />
            </svg>
          </div>
          <span className={s.sidebarLogoText}>HOMIEE</span>
        </div>

        <div className={s.sidebarSection}>
          <span className={s.sidebarSectionLabel}>Control Hubs</span>
        </div>

        <div className={s.hubList}>
          <button
            className={`${s.hubCard} ${s.hubAccess} ${
              activeHub === "access" ? s.hubCardActive : ""
            }`}
            onClick={() => onHubClick("access")}
            aria-label="Access Control"
          >
            <div className={`${s.hubIcon} ${s.hubAccessIcon}`}>
              <ShieldCheck size={20} />
            </div>
            <div className={s.hubInfo}>
              <div className={s.hubName}>Access Control</div>
              <div className={s.hubSubtitle}>Identity & Biometrics</div>
            </div>
            {userCount > 0 && (
              <span className={`${s.hubBadge} ${s.hubAccessBadge}`}>
                {userCount}
              </span>
            )}
          </button>

          <button
            className={`${s.hubCard} ${s.hubGesture} ${
              activeHub === "gesture" ? s.hubCardActive : ""
            }`}
            onClick={() => onHubClick("gesture")}
            aria-label="Hand Control"
          >
            <div className={`${s.hubIcon} ${s.hubGestureIcon}`}>
              <Hand size={20} />
            </div>
            <div className={s.hubInfo}>
              <div className={s.hubName}>Hand Control</div>
              <div className={s.hubSubtitle}>Gesture Mapping</div>
            </div>
            {gestureHasChanges && (
              <span className={`${s.hubDot} ${s.hubGestureDot}`} />
            )}
          </button>

          <button
            className={`${s.hubCard} ${s.hubSecurity} ${
              activeHub === "security" ? s.hubCardActive : ""
            }`}
            onClick={() => onHubClick("security")}
            aria-label="Security Hub"
          >
            <div className={`${s.hubIcon} ${s.hubSecurityIcon}`}>
              <ShieldAlert size={20} />
            </div>
            <div className={s.hubInfo}>
              <div className={s.hubName}>Security Hub</div>
              <div className={s.hubSubtitle}>Emergency Protocols</div>
              {!isCollapsed && (
                <span
                  className={`${s.hubSecurityBadge} ${
                    securityIsActive
                      ? s.hubSecurityBadgeActive
                      : s.hubSecurityBadgeInactive
                  }`}
                  style={{ display: "inline-block", marginTop: 6 }}
                >
                  {securityIsActive ? "ARMED" : "DISARMED"}
                </span>
              )}
            </div>
          </button>

          <button
            className={`${s.hubCard} ${
              activeHub === "knowledge" ? s.hubCardActive : ""
            }`}
            onClick={() => onHubClick("knowledge")}
            aria-label="Home Knowledge"
          >
            <div className={s.hubIcon} style={{ color: '#a855f7', backgroundColor: 'rgba(168, 85, 247, 0.15)' }}>
              <Brain size={20} />
            </div>
            <div className={s.hubInfo}>
              <div className={s.hubName}>Home Knowledge</div>
              <div className={s.hubSubtitle}>Rules & Manuals</div>
            </div>
            {knowledgeCount > 0 && (
              <span className={s.hubBadge} style={{ backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#d8b4fe' }}>
                {knowledgeCount}
              </span>
            )}
          </button>

        </div>

        <div className={s.sidebarToggle}>
          <button className={s.toggleBtn} onClick={onToggleCollapse}>
            <PanelLeftClose
              size={18}
              className={`${s.toggleIcon} ${
                isCollapsed ? s.toggleIconCollapsed : ""
              }`}
            />
            <span className={s.toggleBtnText}>
              {isCollapsed ? "Expand" : "Collapse"}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}