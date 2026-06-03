"use client";

import { LogOut, Menu, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import s from "./dashboard.module.css";

interface DashboardHeaderProps {
  onMobileMenuToggle: () => void;
}

export default function DashboardHeader({ onMobileMenuToggle }: DashboardHeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    window.location.href = "/login";
  };

  return (
    <header className={s.header}>
      <div className={s.headerLeft}>
        <button
          className={s.mobileMenuBtn}
          onClick={onMobileMenuToggle}
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>
      </div>

      <div className={s.headerRight}>
        <button className={s.logoutBtn} onClick={handleLogout}>
          <LogOut size={16} />
          <span className={s.logoutBtnText}>Logout</span>
        </button>
      </div>
    </header>
  );
}
