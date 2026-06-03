"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const navRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      if (!navRef.current) return;
      navRef.current.style.boxShadow =
        window.scrollY > 100 ? "0 4px 30px rgba(0,0,0,0.3)" : "none";
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={styles.navWrapper}>
      <nav className={styles.navbar} ref={navRef}>
        <Link href="/" className={styles.navLogo}>
          <svg viewBox="0 0 32 32" fill="none">
            <circle cx="8" cy="8" r="3.2" fill="white" />
            <circle cx="16" cy="5" r="2.8" fill="white" />
            <circle cx="23" cy="8" r="3.2" fill="white" />
            <circle cx="6" cy="16" r="2.8" fill="white" />
            <circle cx="25" cy="16" r="2.8" fill="white" />
            <circle cx="8" cy="23" r="3.2" fill="white" />
            <circle cx="16" cy="26" r="2.8" fill="white" />
          </svg>
          HOMIEE
        </Link>
        <div className={styles.navLinks}>
          <Link
            href="/story"
            className={pathname === "/story" ? styles.active : ""}
          >
            Story
          </Link>
          <Link href="/login">Login</Link>
        </div>
        <Link href="/register" className={styles.navCta}>
          Get Started
        </Link>
      </nav>
    </div>
  );
}
