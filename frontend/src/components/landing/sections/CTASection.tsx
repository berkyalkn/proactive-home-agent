"use client";

import { useRef, useEffect, useState } from "react";
import styles from "./CTASection.module.css";

interface CTASectionProps {
  onOpenModal?: () => void;
}

export default function CTASection({ onOpenModal }: CTASectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className={styles.section} id="cta">
      <div className="container">
        <div
          className={`${styles.card} fadeIn ${visible ? "visible" : ""}`}
          ref={ref}
        >
          <h2>A home that finally looks out for you.</h2>
          <p className={styles.subtitle}>Reserve your peace of mind.</p>
          <button
            className={styles.btn}
            onClick={(e) => {
              e.preventDefault();
              onOpenModal?.();
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            Join the waitlist
          </button>
        </div>
      </div>
    </section>
  );
}
